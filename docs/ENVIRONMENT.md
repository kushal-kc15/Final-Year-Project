# Environment Variables

Use the provided `.env.example` files as templates. Do not commit real secrets.

## Backend Environment

File:

```text
backend/.env
```

Important variables:

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django signing key. Use a strong unique value in production. |
| `DEBUG` | Enables development behavior when true. Use false in production. |
| `DJANGO_SETTINGS_MODULE` | Selects the settings module. Development commonly uses `vyapar_margadarshan.settings.development`. |
| `ALLOWED_HOSTS` | Comma-separated backend hostnames. |
| `DATABASE_URL` | Database connection. Supports SQLite and PostgreSQL URLs. |
| `JWT_ACCESS_TOKEN_LIFETIME` | Access token lifetime in minutes. |
| `JWT_REFRESH_TOKEN_LIFETIME` | Refresh token lifetime in minutes. |
| `JWT_SIGNING_KEY` | Optional separate JWT signing key. Leave unset to use `SECRET_KEY`. |
| `CORS_ALLOWED_ORIGINS` | Frontend origins allowed to call the API. |
| `CSRF_TRUSTED_ORIGINS` | Trusted frontend origins for CSRF-sensitive flows. |
| `FRONTEND_URL` | Used when generating email links. |
| `EMAIL_BACKEND` | Console email backend for development or SMTP backend for real email. |
| `EMAIL_HOST` | SMTP host, for example Gmail SMTP. |
| `EMAIL_PORT` | SMTP port, usually `587` for TLS. |
| `EMAIL_USE_TLS` | Enables SMTP TLS. |
| `EMAIL_HOST_USER` | SMTP username. |
| `EMAIL_HOST_PASSWORD` | SMTP password or Gmail app password. Never commit this. |
| `DEFAULT_FROM_EMAIL` | Sender email shown in application emails. |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID, if Google login is enabled. |
| `RECEIPT_MAX_UPLOAD_SIZE_MB` | Maximum receipt upload size. |
| `RECEIPT_ALLOWED_CONTENT_TYPES` | Allowed receipt MIME types. |
| `CELERY_BROKER_URL` | Redis broker URL for Celery. |
| `CELERY_RESULT_BACKEND` | Redis result backend URL for Celery. |
| `OCR_QUEUE_FALLBACK_SYNC` | Allows synchronous OCR fallback in development. |
| `OCR_PROVIDER` | OCR provider selector. |
| `NVIDIA_API_KEY` | API key for NVIDIA/OpenAI-compatible OCR provider. |
| `FREEMODEL_API_KEY` | API key for FreeModel fallback provider. |
| `AI_INSIGHTS_MODEL` | Model used by finance insights configuration. |

## Frontend Environment

File:

```text
frontend/.env.local
```

Important variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base path or URL used by the frontend. |
| `VITE_APP_NAME` | Display name used by the frontend. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for browser login. |

## Development Email

For local development, use:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

This prints emails to the terminal instead of sending real email.

## Gmail SMTP

For real email delivery, use Django's SMTP email backend and a Gmail app password. Do not use your normal Gmail password, and do not commit the app password.

Example placeholders:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=noreply@example.com
```

