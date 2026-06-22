import io
import os
import shutil
import tempfile
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
import requests
from rest_framework import status
from rest_framework.test import APIClient

from expenses.models import Expense
from organizations.models import Organization, OrganizationMember
from receipts.ocr_processor import NVIDIA_DEFAULT_MODEL, OCRConfigurationError, OCRProviderError, OCRProcessor
from receipts.models import Receipt
from receipts.tasks import PUBLIC_OCR_ERROR, process_receipt_ocr_sync

User = get_user_model()


TEST_MEDIA_ROOT = tempfile.mkdtemp()
TASK_TEST_MEDIA_ROOT = tempfile.mkdtemp()


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
        output = io.BytesIO()
        Image.new('RGB', (1, 1), color='white').save(output, format='PNG')
        return SimpleUploadedFile(
            'receipt.png',
            output.getvalue(),
            content_type='image/png',
        )

    def create_receipt(self, user=None, **overrides):
        data = {
            'organization': self.organization,
            'user': user or self.user,
            'image': 'receipts/test.png',
            'status': 'VERIFIED',
            'vendor_name': 'Receipt Store',
            'total_amount': Decimal('12.50'),
            'receipt_date': date.today(),
            'category': 'FOOD',
            'description': 'Verified receipt',
        }
        data.update(overrides)
        return Receipt.objects.create(**data)

    def create_staff_user(self, username='receiptstaff', email='receiptstaff@example.com'):
        staff = User.objects.create_user(
            username=username,
            email=email,
            password='StrongPass123!',
            email_verified=True,
        )
        OrganizationMember.objects.create(
            user=staff,
            organization=self.organization,
            role='STAFF',
        )
        staff.active_organization = self.organization
        staff.save(update_fields=['active_organization'])
        return staff

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

    def test_upload_rejects_gif_before_creating_receipt_when_nvidia_is_active(self):
        with patch.dict('os.environ', {'OCR_PROVIDER': 'nvidia'}, clear=False):
            response = self.client.post(
                '/api/receipts/',
                {
                    'image': SimpleUploadedFile(
                        'receipt.gif',
                        b'GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00\xff\xff\xff,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02L\x01\x00;',
                        content_type='image/gif',
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

    def test_staff_only_sees_own_receipts(self):
        staff = self.create_staff_user()
        other_staff = self.create_staff_user(
            username='otherreceiptstaff',
            email='otherreceiptstaff@example.com',
        )
        own_receipt = self.create_receipt(user=staff)
        self.create_receipt(user=self.user)
        self.create_receipt(user=other_staff)
        self.client.force_authenticate(staff)

        response = self.client.get(
            '/api/receipts/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        receipt_ids = {receipt['id'] for receipt in results}
        self.assertEqual(receipt_ids, {own_receipt.id})

    def test_staff_cannot_verify_another_users_receipt(self):
        staff = self.create_staff_user()
        receipt = self.create_receipt(user=self.user, status='COMPLETED')
        self.client.force_authenticate(staff)

        response = self.client.post(
            f'/api/receipts/{receipt.id}/verify/',
            {'vendor_name': 'Changed Store'},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, 'COMPLETED')
        self.assertEqual(receipt.vendor_name, 'Receipt Store')

    def test_staff_cannot_create_expense_from_another_users_receipt(self):
        staff = self.create_staff_user()
        receipt = self.create_receipt(user=self.user)
        self.client.force_authenticate(staff)

        response = self.client.post(
            f'/api/receipts/{receipt.id}/create_expense/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(Expense.objects.exists())
        receipt.refresh_from_db()
        self.assertIsNone(receipt.expense)

    def test_create_expense_validates_expense_data_before_saving(self):
        invalid_cases = [
            ({'amount': '-1.00'}, 'amount'),
            ({'category': 'NOT_A_CATEGORY'}, 'category'),
            ({'date': 'not-a-date'}, 'date'),
        ]

        for payload, field in invalid_cases:
            with self.subTest(field=field):
                receipt = self.create_receipt()
                response = self.client.post(
                    f'/api/receipts/{receipt.id}/create_expense/',
                    payload,
                    format='json',
                    HTTP_X_ORGANIZATION_ID=str(self.organization.id),
                )

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.data)
                self.assertFalse(Expense.objects.filter(receipt=receipt).exists())
                receipt.refresh_from_db()
                self.assertIsNone(receipt.expense)

    def test_create_expense_does_not_duplicate_existing_receipt_expense(self):
        receipt = self.create_receipt()

        first_response = self.client.post(
            f'/api/receipts/{receipt.id}/create_expense/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )
        second_response = self.client.post(
            f'/api/receipts/{receipt.id}/create_expense/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(second_response.data['error'], 'Expense already created for this receipt')
        self.assertEqual(Expense.objects.count(), 1)
        receipt.refresh_from_db()
        self.assertEqual(receipt.expense_id, first_response.data['expense_id'])


class NVIDIAOCRProcessorTestCase(TestCase):
    def create_test_image(self):
        image_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        image_file.close()
        Image.new('RGB', (1, 1), color='white').save(image_file.name)
        self.addCleanup(lambda: os.path.exists(image_file.name) and os.remove(image_file.name))
        return image_file.name

    def _run_ocr_with_category(self, category_label: str):
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
                                'content': f'''
                                {{
                                    "is_receipt": true,
                                    "vendor_name": "Test Vendor",
                                    "total_amount": "1250",
                                    "receipt_date": "2026-06-11",
                                    "category": "{category_label}",
                                    "description": "",
                                    "line_items": [],
                                    "warnings": []
                                }}
                                '''
                            },
                        }
                    ]
                }

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                return OCRProcessor(image_path).process()

    def test_category_aliases_map_human_labels_to_allowed_codes(self):
        result = self._run_ocr_with_category('Food & Dining')
        self.assertEqual(result['category'], 'FOOD')

    def test_category_aliases_map_travel_hotel_lodging_accommodation_to_travel(self):
        result = self._run_ocr_with_category('Hotel / Lodging / Accommodation')
        self.assertEqual(result['category'], 'TRAVEL')

    def test_category_aliases_unknown_still_maps_to_other(self):
        result = self._run_ocr_with_category('UNSUPPORTED')
        self.assertEqual(result['category'], 'OTHER')

    def test_amount_parsing_handles_currency_symbols_and_commas(self):
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
                                    "vendor_name": "Shop",
                                    "total_amount": "₹1,250.50",
                                    "receipt_date": "2026-06-11",
                                    "category": "TRANSPORT",
                                    "description": "",
                                    "line_items": [],
                                    "warnings": []
                                }
                                '''
                            },
                        }
                    ]
                }

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                result = OCRProcessor(image_path).process()

        self.assertEqual(str(result['total_amount']), '1250.50')

    def test_amount_parsing_rejects_invalid_numbers(self):
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
                                    "vendor_name": "Shop",
                                    "total_amount": "not-a-number",
                                    "receipt_date": "2026-06-11",
                                    "category": "TRANSPORT",
                                    "description": "",
                                    "line_items": [],
                                    "warnings": []
                                }
                                '''
                            },
                        }
                    ]
                }

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                result = OCRProcessor(image_path).process()

        self.assertIsNone(result['total_amount'])

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
                                "total_amount": 123.45,
                                "receipt_date": "2026-06-11",
                                "category": "FOOD",
                                "description": "Lunch supplies",
                                "line_items": [
                                    {
                                        "name": "Lunch",
                                        "quantity": 1,
                                        "unit_price": 123.45,
                                        "total": 123.45
                                    }
                                ],
                                "warnings": []
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
                'NVIDIA_OCR_URL': 'https://integrate.api.nvidia.com/v1/chat/completions',
                'NVIDIA_OCR_MODEL': NVIDIA_DEFAULT_MODEL,
                'OCR_MAX_OUTPUT_TOKENS': '2048',
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
        self.assertEqual(kwargs['json']['model'], NVIDIA_DEFAULT_MODEL)
        self.assertEqual(kwargs['json']['temperature'], 0)
        self.assertEqual(kwargs['json']['max_tokens'], 2048)
        self.assertFalse(kwargs['json']['stream'])
        self.assertEqual(kwargs['json']['messages'][0]['content'][0]['type'], 'text')
        self.assertIn('Return only valid JSON. No markdown. No explanation.', kwargs['json']['messages'][0]['content'][0]['text'])
        self.assertEqual(kwargs['json']['messages'][0]['content'][1]['type'], 'image_url')
        self.assertTrue(kwargs['json']['messages'][0]['content'][1]['image_url']['url'].startswith('data:image/png;base64,'))
        self.assertEqual(result['vendor_name'], 'Demo Store')
        self.assertEqual(str(result['total_amount']), '123.45')
        self.assertEqual(result['category'], 'FOOD')
        self.assertEqual(result['ocr_provider'], 'nvidia')
        self.assertEqual(result['ocr_model'], NVIDIA_DEFAULT_MODEL)
        self.assertEqual(result['ocr_validation_warnings'], [])
        self.assertEqual(result['line_items'][0]['name'], 'Lunch')

    def test_missing_nvidia_api_key_fails_configuration_safely(self):
        image_path = self.create_test_image()

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': '',
            },
            clear=False,
        ):
            with self.assertRaises(OCRConfigurationError) as error:
                OCRProcessor(image_path).process()

        self.assertIn('NVIDIA API key is not configured', str(error.exception))
        self.assertNotIn('test-key', str(error.exception))

    def test_markdown_wrapped_json_parses(self):
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
                                'content': '''```json
                                {
                                    "vendor_name": "Fence Store",
                                    "total_amount": 42.5,
                                    "receipt_date": "2026-06-10",
                                    "category": "office",
                                    "description": "",
                                    "line_items": [],
                                    "warnings": []
                                }
                                ```''',
                            },
                        }
                    ]
                }

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                result = OCRProcessor(image_path).process()

        self.assertEqual(result['vendor_name'], 'Fence Store')
        self.assertEqual(str(result['total_amount']), '42.5')
        self.assertEqual(result['category'], 'OFFICE')

    def test_extra_text_around_json_parses_first_json_object(self):
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
                                Here is the extracted receipt:
                                {
                                    "vendor_name": "Verbose Mart",
                                    "total_amount": "15.75",
                                    "receipt_date": "June 9, 2026",
                                    "category": "",
                                    "description": "",
                                    "line_items": []
                                }
                                Done.
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
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                result = OCRProcessor(image_path).process()

        self.assertEqual(result['vendor_name'], 'Verbose Mart')
        self.assertEqual(str(result['total_amount']), '15.75')
        self.assertEqual(result['receipt_date'].isoformat(), '2026-06-09')
        self.assertEqual(result['category'], 'OTHER')

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
                                "warnings": ["low_image_quality"]
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
                'NVIDIA_OCR_URL': 'https://integrate.api.nvidia.com/v1/chat/completions',
                'NVIDIA_OCR_MODEL': NVIDIA_DEFAULT_MODEL,
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()):
                result = OCRProcessor(image_path).process()

        self.assertIsNone(result['total_amount'])
        self.assertEqual(result['vendor_confidence'], 0)
        self.assertEqual(result['amount_confidence'], 0)
        self.assertIsNone(result['receipt_date'])
        self.assertEqual(result['date_confidence'], 0)
        self.assertEqual(result['category'], 'OTHER')
        self.assertEqual(result['line_items'], [])
        self.assertIn('missing_vendor', result['ocr_validation_warnings'])
        self.assertIn('missing_or_invalid_total_amount', result['ocr_validation_warnings'])
        self.assertIn('future_receipt_date', result['ocr_validation_warnings'])
        self.assertIn('unsupported_category_normalized', result['ocr_validation_warnings'])
        self.assertIn('invalid_line_items', result['ocr_validation_warnings'])
        self.assertIn('low_image_quality', result['ocr_validation_warnings'])

    def test_process_rejects_unsupported_image_extension(self):
        image_file = tempfile.NamedTemporaryFile(suffix='.gif', delete=False)
        image_file.close()
        Image.new('RGB', (1, 1), color='white').save(image_file.name, format='GIF')
        self.addCleanup(lambda: os.path.exists(image_file.name) and os.remove(image_file.name))

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
            },
            clear=False,
        ):
            with self.assertRaises(OCRProviderError):
                OCRProcessor(image_file.name).process()

    def test_auth_error_does_not_retry(self):
        image_path = self.create_test_image()

        class FakeResponse:
            status_code = 401

            def raise_for_status(self):
                raise requests.HTTPError('unauthorized')

            def json(self):
                return {}

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', return_value=FakeResponse()) as request_post:
                with self.assertRaises(OCRProviderError):
                    OCRProcessor(image_path).process()

        request_post.assert_called_once()


@override_settings(MEDIA_ROOT=TASK_TEST_MEDIA_ROOT)
class ReceiptOCRTaskTestCase(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TASK_TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.user = User.objects.create_user(
            username='taskreceiptuser',
            email='taskreceipt@example.com',
            password='StrongPass123!',
            email_verified=True,
        )
        self.organization = Organization.objects.create(name='Receipt Task Org')
        OrganizationMember.objects.create(
            user=self.user,
            organization=self.organization,
            role='OWNER',
        )

    def receipt_png(self):
        output = io.BytesIO()
        Image.new('RGB', (1, 1), color='white').save(output, format='PNG')
        return SimpleUploadedFile('receipt.png', output.getvalue(), content_type='image/png')

    def create_receipt(self, status='PROCESSING'):
        return Receipt.objects.create(
            organization=self.organization,
            user=self.user,
            image=self.receipt_png(),
            status=status,
        )

    def test_provider_timeout_marks_receipt_failed_with_public_error(self):
        receipt = self.create_receipt()

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': 'test-key',
                'NVIDIA_OCR_MAX_RETRIES': '2',
                'NVIDIA_OCR_RETRY_DELAY': '0',
            },
            clear=False,
        ):
            with patch('receipts.ocr_processor.requests.post', side_effect=requests.Timeout) as request_post:
                with patch('receipts.ocr_processor.time.sleep'):
                    with self.assertRaises(OCRProviderError):
                        process_receipt_ocr_sync(receipt.id)

        self.assertEqual(request_post.call_count, 2)
        receipt.refresh_from_db()
        self.assertEqual(receipt.status, 'FAILED')
        self.assertEqual(receipt.error_message, PUBLIC_OCR_ERROR)

    def test_missing_nvidia_api_key_marks_receipt_failed_with_public_error(self):
        receipt = self.create_receipt()

        with patch.dict(
            'os.environ',
            {
                'OCR_PROVIDER': 'nvidia',
                'NVIDIA_API_KEY': '',
            },
            clear=False,
        ):
            with self.assertRaises(OCRConfigurationError):
                process_receipt_ocr_sync(receipt.id)

        receipt.refresh_from_db()
        self.assertEqual(receipt.status, 'FAILED')
        self.assertEqual(receipt.error_message, PUBLIC_OCR_ERROR)

    def test_completed_receipt_retry_is_skipped(self):
        receipt = self.create_receipt(status='COMPLETED')

        with patch('receipts.tasks.OCRProcessor') as processor:
            result = process_receipt_ocr_sync(receipt.id)

        self.assertEqual(result['status'], 'COMPLETED')
        processor.assert_not_called()
