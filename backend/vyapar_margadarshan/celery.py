import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vyapar_margadarshan.settings.development')

app = Celery('vyapar_margadarshan')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
