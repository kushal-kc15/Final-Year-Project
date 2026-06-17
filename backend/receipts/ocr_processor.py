import base64
import json
import logging
import re
import time
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

import requests
from dateutil import parser as date_parser
from dateutil.parser import ParserError
from decouple import config
from django.conf import settings
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

ALLOWED_CATEGORIES = {
    'FOOD',
    'TRANSPORT',
    'OFFICE',
    'UTILITIES',
    'SALARY',
    'RENT',
    'MARKETING',
    'OTHER',
}

IMAGE_MEDIA_TYPES = {
    'JPEG': 'image/jpeg',
    'PNG': 'image/png',
    'WEBP': 'image/webp',
}

SUPPORTED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

NVIDIA_DEFAULT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
NVIDIA_DEFAULT_MODEL = 'nvidia/nemotron-nano-12b-v2-vl'
TRANSIENT_HTTP_STATUSES = {429, 500, 502, 503, 504}

RECEIPT_EXTRACTION_PROMPT = """Extract receipt data from this image.

Return only valid JSON. No markdown. No explanation.

{
  "vendor_name": "",
  "total_amount": null,
  "receipt_date": "",
  "category": "",
  "description": "",
  "line_items": [
    {
      "name": "",
      "quantity": null,
      "unit_price": null,
      "total": null
    }
  ],
  "warnings": []
}

Rules:
- Do not invent values.
- If a field is not visible, use null or empty string.
- Use YYYY-MM-DD for receipt_date when possible.
- total_amount must be a number only.
- category must be one of: FOOD, TRANSPORT, OFFICE, UTILITIES, SALARY, RENT, MARKETING, OTHER.
- If unsure about category, use OTHER."""


class OCRConfigurationError(RuntimeError):
    """Raised when OCR provider configuration is missing or invalid."""


class OCRProviderError(RuntimeError):
    """Raised when the OCR provider cannot process the request."""


class OCRProcessor:
    """
    Extract receipt data using a configurable OpenAI-compatible vision endpoint.
    """

    def __init__(self, image_path):
        self.image_path = image_path
        self.provider = config('OCR_PROVIDER', default='nvidia').strip().lower()

        if self.provider == 'nvidia':
            self.api_key = config('NVIDIA_API_KEY', default='').strip()
            self.invoke_url = config(
                'NVIDIA_OCR_URL',
                default=config('NVIDIA_OCR_INVOKE_URL', default=NVIDIA_DEFAULT_URL),
            ).strip()
            self.model = config('NVIDIA_OCR_MODEL', default=NVIDIA_DEFAULT_MODEL)
            self.timeout = config('NVIDIA_OCR_TIMEOUT', default=120, cast=int)
            self.max_retries = config('NVIDIA_OCR_MAX_RETRIES', default=2, cast=int)
            self.retry_delay = config('NVIDIA_OCR_RETRY_DELAY', default=1, cast=int)
            self._validate_nvidia_config()
        elif self.provider == 'freemodel':
            self.api_key = config('FREEMODEL_API_KEY', default='').strip()
            base_url = config('FREEMODEL_BASE_URL', default='https://api.freemodel.dev').rstrip('/')
            self.invoke_url = f'{base_url}/v1/chat/completions'
            self.model = config('FREEMODEL_OCR_MODEL', default='gpt-5.4-mini')
            self.timeout = config('FREEMODEL_OCR_TIMEOUT', default=90, cast=int)
            self.max_retries = config('FREEMODEL_OCR_MAX_RETRIES', default=2, cast=int)
            self.retry_delay = config('FREEMODEL_OCR_RETRY_DELAY', default=1, cast=int)
        else:
            raise OCRConfigurationError('OCR_PROVIDER must be nvidia or freemodel.')

        if not self.api_key:
            raise OCRConfigurationError(f'{self.provider.upper()} API key is not configured.')

    def process(self):
        logger.info(
            'Processing receipt with configured OCR provider',
            extra={'provider': self.provider, 'model': self.model},
        )
        raw_response = self._extract_with_provider()
        data = self._parse_json_response(raw_response)
        return self._normalize_receipt_data(data)

    def _validate_nvidia_config(self):
        if not self.api_key:
            raise OCRConfigurationError('NVIDIA API key is not configured.')
        if not self.invoke_url:
            raise OCRConfigurationError('NVIDIA OCR URL is not configured.')
        if not self.model:
            raise OCRConfigurationError('NVIDIA OCR model is not configured.')
        if self.timeout <= 0:
            raise OCRConfigurationError('NVIDIA OCR timeout must be greater than 0.')
        if self.max_retries < 1:
            raise OCRConfigurationError('NVIDIA OCR max retries must be at least 1.')
        if self.retry_delay < 0:
            raise OCRConfigurationError('NVIDIA OCR retry delay cannot be negative.')

    def _extract_with_provider(self):
        media_type, image_data = self._read_image_for_api()
        image_url = f'data:{media_type};base64,{image_data}'
        del image_data
        payload = {
            'model': self.model,
            'max_tokens': config('OCR_MAX_OUTPUT_TOKENS', default=2048, cast=int),
            'temperature': 0,
            'stream': False,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'text',
                            'text': RECEIPT_EXTRACTION_PROMPT,
                        },
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': image_url,
                            }
                        },
                    ],
                }
            ],
        }
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

        last_error = None
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    self.invoke_url,
                    headers=headers,
                    json=payload,
                    timeout=self.timeout,
                )
                if response.status_code in TRANSIENT_HTTP_STATUSES and attempt < self.max_retries - 1:
                    self._sleep_before_retry(attempt, response.status_code)
                    continue
                try:
                    response.raise_for_status()
                except requests.HTTPError as exc:
                    logger.warning(
                        '%s OCR provider rejected request',
                        self.provider,
                        extra={
                            'status_code': response.status_code,
                            'model': self.model,
                        },
                    )
                    raise OCRProviderError(
                        f'{self.provider} OCR HTTP {response.status_code}.'
                    ) from exc

                try:
                    response_payload = response.json()
                except ValueError as exc:
                    logger.warning(
                        '%s OCR provider returned non-JSON HTTP response',
                        self.provider,
                        extra={'status_code': response.status_code},
                    )
                    raise OCRProviderError(f'{self.provider} OCR returned non-JSON response.') from exc

                return self._extract_text_from_response(response_payload)
            except OCRProviderError as exc:
                last_error = exc
                logger.exception('%s OCR processing failed', self.provider)
                break
            except requests.Timeout as exc:
                last_error = exc
                if attempt < self.max_retries - 1:
                    self._sleep_before_retry(attempt, None)
                    continue
                logger.exception('%s OCR request timed out', self.provider)
                break
            except requests.RequestException as exc:
                last_error = exc
                logger.exception('%s OCR request failed', self.provider)
                break

        if isinstance(last_error, OCRProviderError):
            raise OCRProviderError(str(last_error)) from last_error

        raise OCRProviderError(f'{self.provider} OCR request failed.') from last_error

    def _read_image_for_api(self):
        image_path = Path(self.image_path)
        extension = image_path.suffix.lower()
        if extension and extension not in SUPPORTED_IMAGE_EXTENSIONS:
            raise OCRProviderError('Unsupported receipt image format.')

        max_size = getattr(settings, 'RECEIPT_MAX_UPLOAD_SIZE_BYTES', None)
        try:
            file_size = image_path.stat().st_size
        except OSError as exc:
            raise OCRProviderError('Receipt image could not be read.') from exc
        if max_size and file_size > max_size:
            raise OCRProviderError('Receipt image exceeds the maximum supported size.')

        try:
            with Image.open(self.image_path) as image:
                image.verify()
                media_type = IMAGE_MEDIA_TYPES.get(image.format)
        except (UnidentifiedImageError, OSError) as exc:
            raise OCRProviderError('Uploaded file is not a valid image.') from exc

        if not media_type:
            raise OCRProviderError('Unsupported receipt image format.')

        with open(self.image_path, 'rb') as image_file:
            encoded = base64.b64encode(image_file.read()).decode('ascii')

        return media_type, encoded

    def _sleep_before_retry(self, attempt, status_code):
        wait_time = self.retry_delay * (2 ** attempt)
        logger.warning(
            '%s OCR request retry scheduled',
            self.provider,
            extra={'attempt': attempt + 1, 'max_retries': self.max_retries, 'wait_time': wait_time, 'status_code': status_code},
        )
        time.sleep(wait_time)

    def _extract_text_from_response(self, payload):
        choices = payload.get('choices') or []
        text = ''
        if choices:
            text = (choices[0].get('message') or {}).get('content') or ''
        text = text.strip()
        if not text:
            raise OCRProviderError('OCR provider returned an empty response.')
        return text

    def _parse_json_response(self, raw_response):
        text = raw_response.strip()
        fenced_match = re.fullmatch(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL | re.IGNORECASE)
        if fenced_match:
            text = fenced_match.group(1).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            extracted = self._extract_first_json_object(text)
            if extracted is not None:
                return extracted
            logger.warning('%s OCR returned non-JSON response', self.provider)
            raise OCRProviderError('OCR provider returned invalid JSON.') from exc

    def _extract_first_json_object(self, text):
        decoder = json.JSONDecoder()
        for index, character in enumerate(text):
            if character != '{':
                continue
            try:
                parsed, _ = decoder.raw_decode(text[index:])
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed
        return None

    def _normalize_receipt_data(self, data):
        if not data.get('is_receipt', True):
            raise OCRProviderError('No receipt data found. The uploaded image does not appear to be a receipt, invoice, or bill.')

        warnings = []
        vendor_name = str(data.get('vendor_name') or '').strip()
        if not vendor_name:
            warnings.append('missing_vendor')

        amount = self._parse_amount(data.get('total_amount'))
        if amount is None:
            warnings.append('missing_or_invalid_total_amount')

        receipt_date, date_confidence, date_warning = self._parse_date(data.get('receipt_date'))
        if date_warning:
            warnings.append(date_warning)

        category = str(data.get('category') or 'OTHER').upper()
        if category not in ALLOWED_CATEGORIES:
            warnings.append('unsupported_category_normalized')
            category = 'OTHER'

        line_items = self._normalize_line_items(data.get('line_items'))
        if not isinstance(line_items, list):
            warnings.append('invalid_line_items')
            line_items = []

        provider_warnings = data.get('warnings')
        if isinstance(provider_warnings, list):
            warnings.extend(str(warning) for warning in provider_warnings if warning)

        return {
            'raw_text': str(data.get('raw_text') or ''),
            'vendor_name': vendor_name,
            'vendor_confidence': 95 if vendor_name else 0,
            'total_amount': amount,
            'amount_confidence': 95 if amount is not None else 0,
            'receipt_date': receipt_date,
            'date_confidence': date_confidence,
            'category': category,
            'description': str(data.get('description') or ''),
            'line_items': line_items,
            'ocr_provider': self.provider,
            'ocr_model': self.model,
            'ocr_validation_warnings': warnings,
        }

    def _parse_amount(self, value):
        if value in {None, ''}:
            return None
        try:
            amount = Decimal(str(value).replace(',', '').strip())
        except (InvalidOperation, ValueError):
            return None
        return amount if amount > 0 else None

    def _parse_date(self, value):
        if not value:
            return None, 0, 'missing_receipt_date'
        value = str(value).strip()
        try:
            parsed_date = datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError:
            try:
                default = datetime(1900, 1, 1)
                parsed_date = date_parser.parse(value, default=default).date()
            except (ParserError, TypeError, ValueError, OverflowError):
                return None, 0, 'invalid_receipt_date'
            if parsed_date.year == 1900:
                return None, 0, 'invalid_receipt_date'

        if parsed_date.year < 1900:
            return None, 0, 'invalid_receipt_date'

        today = datetime.now().date()
        if parsed_date > today:
            return None, 0, 'future_receipt_date'

        return parsed_date, 90, None

    def _normalize_line_items(self, line_items):
        if not isinstance(line_items, list):
            return line_items

        normalized_items = []
        for item in line_items:
            if not isinstance(item, dict):
                continue
            normalized_items.append({
                'name': str(item.get('name') or item.get('description') or '').strip(),
                'quantity': item.get('quantity'),
                'unit_price': item.get('unit_price'),
                'total': item.get('total', item.get('amount')),
            })
        return normalized_items
