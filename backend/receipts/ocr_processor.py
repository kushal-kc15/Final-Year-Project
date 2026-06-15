import base64
import json
import logging
import time
from datetime import datetime
from decimal import Decimal, InvalidOperation

import requests
from decouple import config
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
    'GIF': 'image/gif',
}

RECEIPT_EXTRACTION_PROMPT = """FIRST, determine if this image is actually a receipt, invoice, or bill. If it is NOT a receipt/invoice/bill, return this exact JSON:

{
    "is_receipt": false,
    "vendor_name": "",
    "total_amount": 0,
    "receipt_date": "",
    "category": "OTHER",
    "description": "",
    "line_items": [],
    "raw_text": ""
}

If it IS a receipt/invoice/bill, extract this JSON:

{
    "is_receipt": true,
    "vendor_name": "name of the store/vendor",
    "total_amount": "total amount as a number, e.g. 1234.56",
    "receipt_date": "date in YYYY-MM-DD format",
    "category": "one of: FOOD, TRANSPORT, OFFICE, UTILITIES, SALARY, RENT, MARKETING, OTHER",
    "description": "brief description of what this expense is for",
    "line_items": [
        {
            "description": "item name",
            "quantity": 1,
            "unit_price": 0.00,
            "amount": 0.00
        }
    ],
    "raw_text": "all text from the receipt"
}

Rules:
- A receipt/invoice/bill usually has vendor name, items/services, prices, total amount, and date.
- If the image does not have those characteristics, set is_receipt to false.
- Extract the final total amount, not subtotal.
- If date is unclear, use today's date.
- Return valid JSON only. Do not include markdown fences or commentary."""


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
                'NVIDIA_OCR_INVOKE_URL',
                default='https://integrate.api.nvidia.com/v1/chat/completions',
            ).strip()
            self.model = config('NVIDIA_OCR_MODEL', default='moonshotai/kimi-k2.6')
            self.timeout = config('NVIDIA_OCR_TIMEOUT', default=120, cast=int)
            self.max_retries = config('NVIDIA_OCR_MAX_RETRIES', default=2, cast=int)
            self.retry_delay = config('NVIDIA_OCR_RETRY_DELAY', default=1, cast=int)
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
        logger.info('Processing receipt with %s OCR model: %s', self.provider, self.model)
        raw_response = self._extract_with_provider()
        data = self._parse_json_response(raw_response)
        return self._normalize_receipt_data(data)

    def _extract_with_provider(self):
        media_type, image_data = self._read_image_for_api()
        payload = {
            'model': self.model,
            'max_tokens': config('OCR_MAX_OUTPUT_TOKENS', default=1500, cast=int),
            'temperature': 0,
            'top_p': 1,
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
                                'url': f'data:{media_type};base64,{image_data}',
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
                if response.status_code in {429, 500, 502, 503, 504} and attempt < self.max_retries - 1:
                    self._sleep_before_retry(attempt, response.status_code)
                    continue
                try:
                    response.raise_for_status()
                except requests.HTTPError as exc:
                    preview = self._response_preview(response)
                    logger.warning(
                        '%s OCR provider rejected request',
                        self.provider,
                        extra={
                            'status_code': response.status_code,
                            'body_preview': preview,
                            'model': self.model,
                        },
                    )
                    raise OCRProviderError(
                        f'{self.provider} OCR HTTP {response.status_code}: {preview}'
                    ) from exc

                try:
                    response_payload = response.json()
                except ValueError as exc:
                    preview = self._response_preview(response)
                    logger.warning(
                        '%s OCR provider returned non-JSON HTTP response',
                        self.provider,
                        extra={'status_code': response.status_code, 'body_preview': preview},
                    )
                    raise OCRProviderError(f'{self.provider} OCR returned non-JSON response.') from exc

                return self._extract_text_from_response(response_payload)
            except OCRProviderError as exc:
                last_error = exc
                if attempt < self.max_retries - 1:
                    self._sleep_before_retry(attempt, None)
                    continue
                logger.exception('%s OCR processing failed', self.provider)
                break
            except requests.RequestException as exc:
                last_error = exc
                if attempt < self.max_retries - 1:
                    self._sleep_before_retry(attempt, None)
                    continue
                logger.exception('%s OCR request failed', self.provider)
                break

        if isinstance(last_error, OCRProviderError):
            raise OCRProviderError(str(last_error)) from last_error

        raise OCRProviderError(f'{self.provider} OCR request failed.') from last_error

    def _response_preview(self, response):
        text = (response.text or '').replace(self.api_key, '[redacted]')
        return text[:500]

    def _read_image_for_api(self):
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
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
            text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            logger.warning('%s OCR returned non-JSON response', self.provider)
            raise OCRProviderError('OCR provider returned invalid JSON.') from exc

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

        line_items = data.get('line_items')
        if not isinstance(line_items, list):
            warnings.append('invalid_line_items')
            line_items = []

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
        today = datetime.now().date()
        if not value:
            return today, 30, 'missing_receipt_date'
        try:
            parsed_date = datetime.strptime(str(value), '%Y-%m-%d').date()
        except ValueError:
            return today, 30, 'invalid_receipt_date'

        if parsed_date > today:
            return today, 40, 'future_receipt_date_normalized'

        return parsed_date, 90, None
