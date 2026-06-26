import logging
from datetime import date
from decimal import Decimal, InvalidOperation

from celery import shared_task
from celery.exceptions import CeleryError
from django.conf import settings
from django.utils import timezone
from kombu.exceptions import OperationalError

from .models import Receipt
from .services.ai_receipt_extractor import (
    AIReceiptConfigurationError,
    AIReceiptExtractionError,
    CONFIGURATION_ERROR,
    GeminiReceiptExtractor,
)

logger = logging.getLogger(__name__)

PUBLIC_OCR_ERROR = 'AI receipt scanning failed. Try a clearer image or enter the expense manually.'
PUBLIC_CONFIGURATION_ERROR = CONFIGURATION_ERROR
NOT_RECEIPT_ERROR = 'The uploaded image does not appear to be a receipt, invoice, or bill. Please upload a clear image of a receipt.'


def apply_ai_receipt_result(receipt, extracted_data):
    confidence = float(extracted_data.get('confidence') or 0)
    confidence_percent = max(0, min(100, round(confidence * 100)))

    receipt.raw_text = extracted_data.get('raw_text') or ''
    receipt.vendor_name = extracted_data.get('vendor') or ''
    receipt.vendor_confidence = confidence_percent if receipt.vendor_name else 0
    amount = extracted_data.get('amount')
    try:
        receipt.total_amount = Decimal(str(amount)) if amount is not None else None
    except (InvalidOperation, ValueError):
        receipt.total_amount = None
    receipt.amount_confidence = confidence_percent if receipt.total_amount is not None else 0
    receipt_date = extracted_data.get('date')
    try:
        receipt.receipt_date = date.fromisoformat(receipt_date) if receipt_date else None
    except (TypeError, ValueError):
        receipt.receipt_date = None
    receipt.date_confidence = confidence_percent if receipt.receipt_date else 0
    receipt.ocr_provider = 'gemini'
    receipt.ocr_model = getattr(settings, 'GEMINI_RECEIPT_MODEL', 'gemini-2.5-flash')
    receipt.ocr_validation_warnings = []
    receipt.category = extracted_data.get('category') or 'OTHER'
    receipt.description = extracted_data.get('notes') or ''
    receipt.line_items = []
    receipt.status = 'COMPLETED'
    receipt.error_message = ''
    receipt.processed_at = timezone.now()
    receipt.save()


def receipt_scan_response(receipt):
    confidence_values = [
        receipt.vendor_confidence if receipt.vendor_name else None,
        receipt.amount_confidence if receipt.total_amount is not None else None,
        receipt.date_confidence if receipt.receipt_date else None,
    ]
    present = [value for value in confidence_values if value is not None]
    confidence = round((sum(present) / len(present)) / 100, 2) if present else 0.0
    return {
        'vendor': receipt.vendor_name or None,
        'amount': float(receipt.total_amount) if receipt.total_amount is not None else None,
        'date': receipt.receipt_date.isoformat() if receipt.receipt_date else None,
        'category': receipt.category or None,
        'notes': receipt.description or '',
        'confidence': confidence,
        'raw_text': receipt.raw_text or '',
    }


def process_receipt_ocr_sync(receipt_id):
    receipt = Receipt.objects.select_related('organization', 'user').get(id=receipt_id)
    if receipt.status in {'COMPLETED', 'VERIFIED'}:
        logger.info('Skipping OCR for already finalized receipt %s', receipt_id)
        return {'status': receipt.status, 'receipt_id': receipt_id}

    receipt.status = 'PROCESSING'
    receipt.error_message = ''
    receipt.save(update_fields=['status', 'error_message', 'updated_at'])

    try:
        extracted_data = GeminiReceiptExtractor().extract(receipt.image)
        apply_ai_receipt_result(receipt, extracted_data)
        return {'status': 'COMPLETED', 'receipt_id': receipt_id}
    except AIReceiptConfigurationError as exc:
        receipt.status = 'FAILED'
        receipt.error_message = PUBLIC_CONFIGURATION_ERROR
        receipt.save(update_fields=['status', 'error_message', 'updated_at'])
        logger.warning(
            'AI receipt scanning is not configured',
            extra={'receipt_id': receipt.id, 'organization_id': receipt.organization_id, 'user_id': receipt.user_id},
        )
        raise
    except AIReceiptExtractionError as exc:
        receipt.status = 'FAILED'
        receipt.error_message = PUBLIC_OCR_ERROR
        receipt.save(update_fields=['status', 'error_message', 'updated_at'])
        logger.warning(
            'AI receipt scanning failed',
            extra={'receipt_id': receipt.id, 'organization_id': receipt.organization_id, 'user_id': receipt.user_id, 'error_type': exc.__class__.__name__},
        )
        raise
    except Exception as exc:
        receipt.status = 'FAILED'
        error_text = str(exc)
        if 'No receipt data found' in error_text or 'does not appear to be a receipt' in error_text:
            receipt.error_message = NOT_RECEIPT_ERROR
        else:
            receipt.error_message = PUBLIC_OCR_ERROR
        receipt.save(update_fields=['status', 'error_message', 'updated_at'])

        log_context = {
            'receipt_id': receipt.id,
            'organization_id': receipt.organization_id,
            'user_id': receipt.user_id,
            'error_type': exc.__class__.__name__,
        }
        if settings.DEBUG:
            logger.exception('Receipt OCR task failed', extra=log_context)
        else:
            logger.error('Receipt OCR task failed', extra=log_context)
        raise


@shared_task(bind=True, autoretry_for=(OperationalError,), retry_backoff=True, retry_kwargs={'max_retries': 3})
def process_receipt_ocr(self, receipt_id):
    return process_receipt_ocr_sync(receipt_id)


def enqueue_receipt_ocr(receipt_id):
    if not getattr(settings, 'RECEIPT_OCR_USE_QUEUE', False):
        logger.info('Receipt OCR queue disabled; processing synchronously', extra={'receipt_id': receipt_id})
        process_receipt_ocr_sync(receipt_id)
        return 'sync'

    try:
        process_receipt_ocr.delay(receipt_id)
        return 'queued'
    except (CeleryError, OperationalError) as exc:
        if not settings.OCR_QUEUE_FALLBACK_SYNC:
            raise

        logger.warning(
            'Receipt OCR queue unavailable; falling back to synchronous processing',
            extra={'receipt_id': receipt_id, 'error_type': exc.__class__.__name__},
        )
        process_receipt_ocr_sync(receipt_id)
        return 'sync_fallback'
