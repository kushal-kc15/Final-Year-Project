import json
import logging
import traceback
from datetime import datetime

from django.core.exceptions import PermissionDenied, ValidationError
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class GlobalErrorHandlingMiddleware:
    """
    Middleware that catches unhandled exceptions and returns
    standardized JSON error responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        except ValidationError as e:
            return self._handle_validation_error(e)
        except PermissionDenied as e:
            return self._handle_permission_error(e)
        except Exception as e:
            return self._handle_system_error(e)
        return response

    def _handle_validation_error(self, exc):
        logger.warning(f"Validation error: {exc}")
        return JsonResponse({
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Invalid input data',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else {'detail': exc.messages},
                'timestamp': datetime.utcnow().isoformat() + 'Z',
            }
        }, status=400)

    def _handle_permission_error(self, exc):
        logger.warning(f"Permission denied: {exc}")
        return JsonResponse({
            'error': {
                'code': 'PERMISSION_DENIED',
                'message': str(exc) or 'You do not have permission to perform this action.',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
            }
        }, status=403)

    def _handle_system_error(self, exc):
        logger.error(f"System error: {exc}\n{traceback.format_exc()}")
        return JsonResponse({
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred.',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
            }
        }, status=500)
