# Installation

These instructions are written for Windows PowerShell.

## Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- Git
- Optional: Redis for Celery background jobs
- Optional: PostgreSQL for production-like database setup

## Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements/development.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs at:

```text
http://127.0.0.1:8000/
```

Admin dashboard:

```text
http://127.0.0.1:8000/admin/
```

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Frontend runs at:

```text
http://localhost:5173/
```

## Production Build

```powershell
cd frontend
npm run build
```

The production bundle is generated in:

```text
frontend/dist/
```

## Useful Backend Commands

```powershell
cd backend
python manage.py check
python manage.py test
python manage.py makemigrations --check --dry-run
```

