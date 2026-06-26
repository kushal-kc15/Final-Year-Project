import json
import logging
import mimetypes
import re
import time
from io import BytesIO
from datetime import datetime
from decimal import Decimal, InvalidOperation

from dateutil import parser as date_parser
from dateutil.parser import ParserError
from django.conf import settings
from PIL import Image, ImageOps, UnidentifiedImageError

from expenses.categories import (
    OCR_CATEGORY_ALIASES,
    REAL_EXPENSE_CATEGORY_CHOICES,
    REAL_EXPENSE_CATEGORY_CODES,
)

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
GEMINI_IMAGE_MAX_DIMENSION = 1600
GEMINI_IMAGE_JPEG_QUALITY = 80
CONFIGURATION_ERROR = "AI receipt scanning is not configured. Add GEMINI_API_KEY or enter the expense manually."
SCAN_FAILED_ERROR = "AI receipt scanning failed. Try a clearer image or enter the expense manually."


class AIReceiptConfigurationError(RuntimeError):
    """Raised when Gemini receipt scanning is disabled or not configured."""


class AIReceiptExtractionError(RuntimeError):
    """Raised when Gemini cannot produce usable receipt extraction output."""


def _category_prompt_text():
    return ", ".join(f"{code} ({label})" for code, label in REAL_EXPENSE_CATEGORY_CHOICES)


RECEIPT_EXTRACTION_PROMPT = f"""You are extracting expense data from a receipt image for a business expense management system.

Return JSON only. Do not include markdown. Do not include explanation.

Extract:
- vendor: merchant/store/business name
- amount: final total/grand total/amount paid only, not subtotal
- date: transaction date in YYYY-MM-DD format
- category: one of the allowed app category codes only
- notes: short useful note
- confidence: number from 0 to 1
- raw_text: important visible receipt text

Allowed categories:
{_category_prompt_text()}

Rules:
- If a field is not visible, use null.
- Do not guess fake values.
- Prefer labels like Total, Grand Total, Amount Paid, Net Amount, Balance Due.
- Ignore phone numbers, invoice numbers, VAT/PAN numbers, and transaction IDs as amounts.
- If several amounts exist, choose the final payable total.
- Return JSON only.
"""


class GeminiReceiptExtractor:
    def __init__(self):
        self.enabled = bool(getattr(settings, "AI_RECEIPT_SCAN_ENABLED", True))
        self.api_key = str(getattr(settings, "GEMINI_API_KEY", "") or "").strip()
        self.model = str(getattr(settings, "GEMINI_RECEIPT_MODEL", "") or "gemini-2.5-flash").strip()

    def extract(self, receipt_file):
        if not self.enabled or not self.api_key:
            raise AIReceiptConfigurationError(CONFIGURATION_ERROR)

        started_at = time.monotonic()
        content_type, image_bytes = self._read_image(receipt_file)
        text = self._call_gemini(image_bytes=image_bytes, content_type=content_type)
        logger.info(
            "AI receipt scan completed",
            extra={
                "gemini_model": self.model,
                "duration_seconds": round(time.monotonic() - started_at, 2),
            },
        )
        payload = self._parse_json_response(text)
        return self.normalize(payload)

    def _read_image(self, receipt_file):
        size = getattr(receipt_file, "size", None)
        max_size = getattr(settings, "RECEIPT_MAX_UPLOAD_SIZE_BYTES", 5 * 1024 * 1024)
        if size and size > max_size:
            raise AIReceiptExtractionError(f"Receipt image must be {settings.RECEIPT_MAX_UPLOAD_SIZE_MB} MB or smaller.")

        name = getattr(receipt_file, "name", "") or ""
        extension = ""
        if "." in name:
            extension = f".{name.rsplit('.', 1)[-1].lower()}"
        if extension and extension not in ALLOWED_EXTENSIONS:
            raise AIReceiptExtractionError("Unsupported receipt image type.")

        try:
            receipt_file.open("rb")
        except AttributeError:
            receipt_file.seek(0)

        try:
            image_bytes = receipt_file.read()
        except OSError as exc:
            raise AIReceiptExtractionError("Receipt image could not be read.") from exc
        finally:
            try:
                receipt_file.seek(0)
            except (AttributeError, OSError):
                pass

        if not image_bytes:
            raise AIReceiptExtractionError("Receipt image could not be read.")
        if len(image_bytes) > max_size:
            raise AIReceiptExtractionError(f"Receipt image must be {settings.RECEIPT_MAX_UPLOAD_SIZE_MB} MB or smaller.")

        content_type = getattr(receipt_file, "content_type", "") or mimetypes.guess_type(name)[0] or ""
        if content_type == "image/jpg":
            content_type = "image/jpeg"
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise AIReceiptExtractionError("Unsupported receipt image type.")

        return self._compress_image(image_bytes)

    def _compress_image(self, image_bytes):
        original_size = len(image_bytes)
        try:
            with Image.open(BytesIO(image_bytes)) as image:
                image = ImageOps.exif_transpose(image)
                image.thumbnail((GEMINI_IMAGE_MAX_DIMENSION, GEMINI_IMAGE_MAX_DIMENSION), Image.Resampling.LANCZOS)
                if image.mode in {"RGBA", "LA", "P"}:
                    image = image.convert("RGBA")
                    background = Image.new("RGB", image.size, "white")
                    background.paste(image, mask=image.getchannel("A"))
                    image = background
                else:
                    image = image.convert("RGB")

                output = BytesIO()
                image.save(output, format="JPEG", quality=GEMINI_IMAGE_JPEG_QUALITY, optimize=True)
                compressed = output.getvalue()
        except (UnidentifiedImageError, OSError) as exc:
            raise AIReceiptExtractionError("Uploaded file is not a valid image.") from exc

        logger.info(
            "Prepared receipt image for Gemini",
            extra={
                "original_size_bytes": original_size,
                "compressed_size_bytes": len(compressed),
                "gemini_model": self.model,
            },
        )
        return "image/jpeg", compressed

    def _call_gemini(self, image_bytes, content_type):
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            logger.exception("google-genai is not installed")
            raise AIReceiptExtractionError(SCAN_FAILED_ERROR) from exc

        try:
            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model=self.model,
                contents=[
                    RECEIPT_EXTRACTION_PROMPT,
                    types.Part.from_bytes(data=image_bytes, mime_type=content_type),
                ],
                config=types.GenerateContentConfig(
                    temperature=0,
                    response_mime_type="application/json",
                ),
            )
        except Exception as exc:
            logger.exception("Gemini receipt extraction failed", extra={"model": self.model})
            raise AIReceiptExtractionError(SCAN_FAILED_ERROR) from exc

        text = getattr(response, "text", "") or ""
        if not text:
            raise AIReceiptExtractionError(SCAN_FAILED_ERROR)
        return text

    def _parse_json_response(self, raw_response):
        text = str(raw_response or "").strip()
        fenced = re.fullmatch(r"```(?:json)?\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
        if fenced:
            text = fenced.group(1).strip()

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            parsed = self._extract_first_json_object(text)
            if parsed is None:
                raise AIReceiptExtractionError(SCAN_FAILED_ERROR) from exc

        if not isinstance(parsed, dict):
            raise AIReceiptExtractionError(SCAN_FAILED_ERROR)
        return parsed

    def _extract_first_json_object(self, text):
        decoder = json.JSONDecoder()
        for index, char in enumerate(text):
            if char != "{":
                continue
            try:
                parsed, _ = decoder.raw_decode(text[index:])
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                return parsed
        return None

    def normalize(self, data):
        if not isinstance(data, dict):
            raise AIReceiptExtractionError(SCAN_FAILED_ERROR)

        vendor = self._clean_string(data.get("vendor") or data.get("vendor_name"))
        amount = self._parse_amount(data.get("amount") or data.get("total_amount"))
        parsed_date = self._parse_date(data.get("date") or data.get("receipt_date"))
        category = self._normalize_category(data.get("category"))
        notes = self._clean_string(data.get("notes") or data.get("description")) or ""
        raw_text = self._clean_string(data.get("raw_text")) or ""
        confidence = self._parse_confidence(data.get("confidence"))

        return {
            "vendor": vendor,
            "amount": amount,
            "date": parsed_date,
            "category": category,
            "notes": notes[:240],
            "confidence": confidence,
            "raw_text": raw_text,
        }

    def _clean_string(self, value):
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    def _parse_amount(self, value):
        if value in {None, ""}:
            return None
        try:
            cleaned = str(value).replace(",", "")
            cleaned = re.sub(r"(?i)(rs\.?|npr|inr|eur|usd|\$|€|₹)", "", cleaned)
            cleaned = cleaned.replace("/-", "")
            cleaned = re.sub(r"[^0-9.\-]", "", cleaned).strip()
            amount = Decimal(cleaned)
        except (InvalidOperation, ValueError):
            return None
        if amount <= 0:
            return None
        return float(amount.quantize(Decimal("0.01")))

    def _parse_date(self, value):
        if not value:
            return None
        text = str(value).strip()
        try:
            parsed = datetime.strptime(text, "%Y-%m-%d").date()
        except ValueError:
            try:
                parsed = date_parser.parse(text, default=datetime(1900, 1, 1)).date()
            except (ParserError, TypeError, ValueError, OverflowError):
                return None
            if parsed.year == 1900:
                return None
        if parsed.year < 1900:
            return None
        return parsed.isoformat()

    def _normalize_category(self, value):
        if not value:
            return None
        raw = str(value).strip()
        code = raw.upper()
        if code in REAL_EXPENSE_CATEGORY_CODES:
            return code

        key = raw.lower().replace("&", " ")
        key = re.sub(r"\s+", " ", key).strip()
        mapped = OCR_CATEGORY_ALIASES.get(key)
        if mapped in REAL_EXPENSE_CATEGORY_CODES:
            return mapped

        for alias, alias_code in OCR_CATEGORY_ALIASES.items():
            alias_key = alias.replace("&", " ")
            alias_key = re.sub(r"\s+", " ", alias_key).strip()
            if alias_key and (alias_key in key or key in alias_key):
                if alias_code in REAL_EXPENSE_CATEGORY_CODES:
                    return alias_code
        return None

    def _parse_confidence(self, value):
        try:
            confidence = float(value)
        except (TypeError, ValueError):
            return 0.0
        return max(0.0, min(1.0, confidence))
