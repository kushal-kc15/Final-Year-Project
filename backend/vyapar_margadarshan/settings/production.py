"""
Production settings for Vyapar Margadarshan.
"""
from django.core.exceptions import ImproperlyConfigured

from .base import *

DEBUG = False

if (
    SECRET_KEY == INSECURE_SECRET_KEY
    or SECRET_KEY.startswith('django-insecure-')
    or len(SECRET_KEY) < 50
    or len(set(SECRET_KEY)) < 5
):
    raise ImproperlyConfigured('Set a strong, random SECRET_KEY in production.')

if not ALLOWED_HOSTS:
    raise ImproperlyConfigured('Set ALLOWED_HOSTS in production.')

if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfigured('Set CORS_ALLOWED_ORIGINS in production.')

SECURE_SSL_REDIRECT = config_bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = config_bool('SESSION_COOKIE_SECURE', default=True)
CSRF_COOKIE_SECURE = config_bool('CSRF_COOKIE_SECURE', default=True)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config_bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True)
SECURE_HSTS_PRELOAD = config_bool('SECURE_HSTS_PRELOAD', default=True)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

CSRF_TRUSTED_ORIGINS = config_list('CSRF_TRUSTED_ORIGINS', default='')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': config('LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
