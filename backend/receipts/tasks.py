import logging

from celery import shared_task
from celery.exceptions import CeleryError
from django.conf import settings
from django.utils import timezone
from kombu.exceptions import OperationalError

from .models import Receipt
from .ocr_processor import OCRProcessor

logger = logging.getLogger(__name__)

PUBLIC_OCR_ERROR = 'We could not process this receipt right now. Please try again or enter the expense manually.'
NOT_RECEIPT_ERROR = 'The uploaded image does not appear to be a receipt, invoice, or bill. Please upload a clear image of a receipt.'


def apply_ocr_result(receipt, extracted_data):
    receipt.raw_text = extracted_data['raw_text']
    receipt.vendor_name = extracted_data['vendor_name']
    receipt.vendor_confidence = extracted_data['vendor_confidence']
    receipt.total_amount = extracted_data['total_amount']
    receipt.amount_confidence = extracted_data['amount_confidence']
    receipt.receipt_date = extracted_data['receipt_date']
    receipt.date_confidence = extracted_data['date_confidence']
    receipt.ocr_provider = extracted_data.get('ocr_provider', '')
    receipt.ocr_model = extracted_data.get('ocr_model', '')
    receipt.ocr_validation_warnings = extracted_data.get('ocr_validation_warnings', [])
    receipt.category = extracted_data.get('category', 'OTHER')
    receipt.description = extracted_data.get('description', '')
    receipt.line_items = extracted_data['line_items']
    receipt.status = 'COMPLETED'
    receipt.error_message = ''
    receipt.processed_at = timezone.now()
    receipt.save()


def process_receipt_ocr_sync(receipt_id):
    receipt = Receipt.objects.select_related('organization', 'user').get(id=receipt_id)
    if receipt.status == 'VERIFIED':
        logger.info('Skipping OCR for verified receipt %s', receipt_id)
        return {'status': receipt.status, 'receipt_id': receipt_id}

    receipt.status = 'PROCESSING'
    receipt.error_message = ''
    receipt.save(update_fields=['status', 'error_message', 'updated_at'])

    try:
        extracted_data = OCRProcessor(receipt.image.path).process()
        apply_ocr_result(receipt, extracted_data)
        return {'status': 'COMPLETED', 'receipt_id': receipt_id}
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
