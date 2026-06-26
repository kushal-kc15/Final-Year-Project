# Deployment Notes

This project is structured for separate backend and frontend deployment.

## Backend Deployment

Recommended backend steps:

1. Use production settings.
2. Set `DEBUG=False`.
3. Configure a strong `SECRET_KEY`.
4. Use PostgreSQL through `DATABASE_URL`.
5. Configure `ALLOWED_HOSTS`.
6. Configure CORS and CSRF origins for the deployed frontend.
7. Configure SMTP email for invitations and password reset.
8. Configure static and media file storage.
9. Run migrations.
10. Create a superuser.
11. Serve Django with a production WSGI server such as Gunicorn.

Example commands:

```powershell
cd backend
pip install -r requirements/production.txt
python manage.py migrate
python manage.py collectstatic
python manage.py createsuperuser
```

## Frontend Deployment

Build the frontend:

```powershell
cd frontend
npm install
npm run build
```

Deploy the generated `frontend/dist/` folder to a static hosting provider such as Vercel, Netlify, Cloudflare Pages, or an Nginx-served static site.

## Environment Variables

Production must provide real values for:

- `SECRET_KEY`
- `DATABASE_URL`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `FRONTEND_URL`
- Email SMTP settings
- OCR provider keys if OCR is enabled
- Google OAuth client IDs if Google login is enabled

## Static and Media Files

Static files are generated with:

```powershell
python manage.py collectstatic
```

Receipt uploads are media files. In production, use persistent storage such as S3-compatible object storage, cloud media storage, or a mounted volume.

## CORS, CSRF, and Frontend URL

The deployed frontend origin must be added to:

- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `FRONTEND_URL`

This is required for API calls and generated email links.

## Email Setup

Use console email only for development. Production invitations, verification emails, and password resets require real SMTP settings.

