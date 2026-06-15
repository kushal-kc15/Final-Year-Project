import os
import shutil
import tempfile
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from organizations.models import Organization, OrganizationMember
from receipts.ocr_processor import OCRProcessor
from receipts.models import Receipt

User = get_user_model()


TEST_MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class ReceiptUploadErrorTestCase(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='receiptuser',
            email='receipt@example.com',
            password='StrongPass123!',
            email_verified=True,
        )
        self.organization = Organization.objects.create(name='Receipt Org')
        OrganizationMember.objects.create(
            user=self.user,
            organization=self.organization,
            role='OWNER',
        )
        self.user.active_organization = self.organization
        self.user.save(update_fields=['active_organization'])
        self.client.force_authenticate(self.user)

    def receipt_image(self):
        return SimpleUploadedFile(
            'receipt.gif',
            b'GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00\xff\xff\xff,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02L\x01\x00;',
            content_type='image/gif',
        )

    def test_ocr_failure_response_does_not_leak_provider_error(self):
        provider_error = 'secret provider stack trace with API key metadata'
        processor = patch('receipts.views.enqueue_receipt_ocr').start()
        self.addCleanup(patch.stopall)
        processor.side_effect = RuntimeError(provider_error)

        with self.assertLogs('receipts.views', level='ERROR'):
            response = self.client.post(
                '/api/receipts/',
                {'image': self.receipt_image()},
                format='multipart',
            )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error'], 'OCR processing failed')
        self.assertIn('receipt_id', response.data)
        self.assertNotIn(provider_error, str(response.data))

        receipt = Receipt.objects.get(id=response.data['receipt_id'])
        self.assertEqual(receipt.status, 'FAILED')
        self.assertNotIn(provider_error, receipt.error_message)

    def test_upload_queues_receipt_ocr(self):
        enqueue = patch('receipts.views.enqueue_receipt_ocr', return_value='queued').start()
        self.addCleanup(patch.stopall)

        response = self.client.post(
            '/api/receipts/',
            {'image': self.receipt_image()},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data['status'], 'PROCESSING')
        self.assertEqual(response.data['queue_mode'], 'queued')
        enqueue.assert_called_once_with(response.data['id'])

    def test_upload_rejects_unsupported_content_type_before_creating_receipt(self):
        response = self.client.post(
            '/api/receipts/',
            {
                'image': SimpleUploadedFile(
                    'receipt.gif',
                    self.receipt_image().read(),
                    content_type='text/plain',
                )
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Receipt.objects.exists())

    @override_settings(RECEIPT_MAX_UPLOAD_SIZE_BYTES=1, RECEIPT_MAX_UPLOAD_SIZE_MB=0)
    def test_upload_rejects_oversized_image_before_creating_receipt(self):
        response = self.client.post(
            '/api/receipts/',
            {'image': self.receipt_image()},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Receipt.objects.exists())

    def test_receipt_must_be_verified_before_creating_expense(self):
        receipt = Receipt.objects.create(
            organization=self.organization,
            user=self.user,
            image='receipts/test.gif',
            status='COMPLETED',
            total_amount=Decimal('10.00'),
            receipt_date=date.today(),
            category='FOOD',
        )

        response = self.client.post(f'/api/receipts/{receipt.id}/create_expense/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Verify this receipt before creating an expense.')


class FreeModelOCRProcessorTestCase(TestCase):
    def create_test_image(self):
        image_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        image_file.close()
        Image.new('RGB', (1, 1), color='white').save(image_file.name)
        self.addCleanup(lambda: os.path.exists(image_file.name) and os.remove(image_file.name))
        return image_file.name

    def test_process_sends_openai_vision_payload_and_normalizes_response(self):
        image_path = self.create_test_image()

        class FakeResponse:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {
                    'choices': [
                        {
                            'message': {
                                'content': '''
                            {
                                "is_receipt": true,
                                "vendor_name": "Demo Store",
                                "total_amount": "123.45",
                                "receipt_date": "2026-06-11",
                                "category": "FOOD",
                                "description": "Lunch supplies",
                                "line_items": [],
                                "raw_text": "Demo Store Total 123.45"
                            }
                            ''',
                            },
                        }
                    ]
                }

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
                'NVIDIA_OCR_INVOKE_URL': 'https://integrate.api.nvidia.com/v1/chat/completions',
                'NVIDIA_OCR_MODEL': 'moonshotai/kimi-k2.6',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()) as request_post:
                result = OCRProcessor(image_path).process()

        request_post.assert_called_once()
        url = request_post.call_args.args[0]
        kwargs = request_post.call_args.kwargs
        self.assertEqual(url, 'https://integrate.api.nvidia.com/v1/chat/completions')
        self.assertEqual(kwargs['headers']['Authorization'], 'Bearer test-key')
        self.assertEqual(kwargs['headers']['Accept'], 'application/json')
        self.assertEqual(kwargs['json']['model'], 'moonshotai/kimi-k2.6')
        self.assertFalse(kwargs['json']['stream'])
        self.assertEqual(kwargs['json']['messages'][0]['content'][0]['type'], 'text')
        self.assertEqual(kwargs['json']['messages'][0]['content'][1]['type'], 'image_url')
        self.assertTrue(kwargs['json']['messages'][0]['content'][1]['image_url']['url'].startswith('data:image/png;base64,'))
        self.assertEqual(result['vendor_name'], 'Demo Store')
        self.assertEqual(str(result['total_amount']), '123.45')
        self.assertEqual(result['category'], 'FOOD')
        self.assertEqual(result['ocr_provider'], 'nvidia')
        self.assertEqual(result['ocr_model'], 'moonshotai/kimi-k2.6')
        self.assertEqual(result['ocr_validation_warnings'], [])

    def test_process_flags_suspicious_output(self):
        image_path = self.create_test_image()

        class FakeResponse:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {
                    'choices': [
                        {
                            'message': {
                                'content': '''
                            {
                                "is_receipt": true,
                                "vendor_name": "",
                                "total_amount": "not-a-number",
                                "receipt_date": "2999-01-01",
                                "category": "UNSUPPORTED",
                                "description": "",
                                "line_items": "bad-shape",
                                "raw_text": ""
                            }
                            ''',
                            },
                        }
                    ]
                }

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
                'NVIDIA_OCR_INVOKE_URL': 'https://integrate.api.nvidia.com/v1/chat/completions',
                'NVIDIA_OCR_MODEL': 'moonshotai/kimi-k2.6',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                result = OCRProcessor(image_path).process()

        self.assertIsNone(result['total_amount'])
        self.assertEqual(result['vendor_confidence'], 0)
        self.assertEqual(result['amount_confidence'], 0)
        self.assertLessEqual(result['receipt_date'], timezone.now().date())
        self.assertEqual(result['date_confidence'], 40)
        self.assertEqual(result['category'], 'OTHER')
        self.assertEqual(result['line_items'], [])
        self.assertIn('missing_vendor', result['ocr_validation_warnings'])
        self.assertIn('missing_or_invalid_total_amount', result['ocr_validation_warnings'])
        self.assertIn('future_receipt_date_normalized', result['ocr_validation_warnings'])
        self.assertIn('unsupported_category_normalized', result['ocr_validation_warnings'])
        self.assertIn('invalid_line_items', result['ocr_validation_warnings'])
