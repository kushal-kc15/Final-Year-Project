# Vyapar Margadarshan

Business Expense Management Platform

Vyapar Margadarshan is a full-stack expense management system for small teams and organizations. It helps owners and staff record expenses, upload receipts, review approvals, manage budgets, and generate approved-spend reports from one workspace-aware dashboard.

## Problem Statement

Many small businesses track spending through spreadsheets, chat messages, paper receipts, and manual approvals. This creates delays, missing receipts, unclear budget usage, and weak visibility into approved spending. Vyapar Margadarshan provides a structured workflow for recording, reviewing, and reporting business expenses while keeping each organization's data separate.

## Key Features

- Multi-workspace organization support
- Owner and staff roles
- Expense submission with category, vendor, amount, date, and receipt
- Receipt upload with Gemini Vision AI-assisted data extraction
- Approval, rejection, correction, and resubmission workflow
- Budget tracking with threshold alerts
- Approved-only analytics and CSV exports
- Team invitations and invitation cancellation
- Staff read-only team view
- Notifications and activity logs
- Jazzmin-powered website manager admin dashboard
- Light/dark theme support

## Tech Stack

**Frontend**
- React 18
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide icons

**Backend**
- Django 4.2
- Django REST Framework
- Simple JWT
- Django Jazzmin
- django-filter
- Celery and Redis support for background work

**Database**
- SQLite for local development
- PostgreSQL supported through `DATABASE_URL`

**AI integrations**
- Gemini Vision receipt scanning through the Django backend
- Optional AI finance insights endpoint

## Screenshots

Screenshots are documented in [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md). Add final images under a `screenshots/` folder before publishing the repository.

## Quick Start

Run the backend and frontend in separate terminals.

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements/development.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000/api/`
- Admin dashboard: `http://127.0.0.1:8000/admin/`

## Environment Variables

Use `.env.example` files as templates only. Never commit real secrets, Gmail app passwords, database passwords, JWT signing keys, OAuth secrets, or API tokens.

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for a safe variable reference.

## User Roles

- **Owner**: manages workspace settings, team invitations, budgets, approvals, organization-wide reports, and vendor analytics.
- **Staff**: submits expenses, corrects rejected expenses, views their own expense data, and can see a read-only team view.
- **Superuser/platform admin**: uses Django Admin/Jazzmin to manage platform data and inspect system activity.

More detail is available in [docs/USER_ROLES.md](docs/USER_ROLES.md).

## Main Workflows

- Create or switch workspace
- Invite team members
- Accept invitations as a new or existing user
- Submit expenses with receipt attachments
- Approve or reject submitted expenses
- Correct and resubmit rejected expenses
- Track category budgets
- Export approved-spend reports as CSV

See [docs/WORKFLOWS.md](docs/WORKFLOWS.md) for step-by-step flows.

## Testing

Backend:

```powershell
cd backend
python manage.py test
python manage.py check
```

Frontend:

```powershell
cd frontend
npm run build
```

More testing notes are in [docs/TESTING.md](docs/TESTING.md).

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Features](docs/FEATURES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [User Roles](docs/USER_ROLES.md)
- [Workflows](docs/WORKFLOWS.md)
- [Installation](docs/INSTALLATION.md)
- [Environment](docs/ENVIRONMENT.md)
- [API Overview](docs/API_OVERVIEW.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Future Scope](docs/FUTURE_SCOPE.md)
- [Screenshots](docs/SCREENSHOTS.md)

## Project Status

This project was completed as a final-year academic project. The core expense management, organization scoping, role-based workflows, reporting, team invitation, AI receipt scanning, and admin-dashboard features are implemented.

## Future Scope

Planned improvements include production deployment hardening, PDF reports, richer audit trails, mobile access, organization billing, and more advanced analytics.
