"""
WSGI config for vyapar_margadarshan project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vyapar_margadarshan.settings.production')

application = get_wsgi_application()
