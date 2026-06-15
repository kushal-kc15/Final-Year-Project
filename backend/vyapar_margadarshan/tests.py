from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory

from .api_exceptions import api_exception_handler


class APIExceptionHandlerTestCase(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_handled_drf_exception_includes_status_code(self):
        request = self.factory.post('/api/example/', {})
        response = api_exception_handler(
            ValidationError({'field': ['Invalid value']}),
            {'request': request, 'view': object()},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['status_code'], status.HTTP_400_BAD_REQUEST)
        self.assertIn('field', response.data)

    def test_unhandled_exception_returns_generic_response(self):
        request = self.factory.get('/api/example/')

        with self.assertLogs('vyapar_margadarshan.api_exceptions', level='ERROR'):
            try:
                raise RuntimeError('sensitive provider failure')
            except RuntimeError as exc:
                response = api_exception_handler(exc, {'request': request, 'view': object()})

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['detail'], 'Internal server error.')
        self.assertNotIn('sensitive provider failure', str(response.data))
