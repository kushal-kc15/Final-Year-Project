import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    """
    Normalize API error responses and prevent unexpected exceptions from
    leaking implementation details to clients.
    """
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(response.data, dict):
            response.data.setdefault('status_code', response.status_code)
        return response

    request = context.get('request')
    view = context.get('view')
    logger.exception(
        'Unhandled API exception',
        extra={
            'path': getattr(request, 'path', None),
            'method': getattr(request, 'method', None),
            'view': view.__class__.__name__ if view else None,
        },
    )

    return Response(
        {'detail': 'Internal server error.', 'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
