# Architecture

Vyapar Margadarshan is split into a React frontend and Django REST backend.

## Frontend

The frontend lives in `frontend/` and is built with React, Vite, Tailwind CSS, and React Router.

High-level structure:

```text
frontend/
  src/
    components/       Shared UI components
    context/          Auth and theme state
    design-system/    Reusable primitives and patterns
    lib/              API client, formatting, helpers
    pages/            Main route pages
```

Main pages include Dashboard, Expenses, Approvals, Budgets, Reports, Vendors, Team, Activity, and Settings.

## Backend

The backend lives in `backend/` and is built with Django, Django REST Framework, Simple JWT, Jazzmin, and django-filter.

High-level structure:

```text
backend/
  users/                 Authentication and profile management
  organizations/         Workspaces, memberships, invitations
  expenses/              Expense records and approval workflow
  budgets/               Budgets and budget alerts
  analytics/             Reports, trends, CSV export, insights
  receipts/              Receipt upload and AI scanning
  notifications/         User notifications
  activity_logs/         System and workspace activity
  vyapar_margadarshan/   Project settings, URLs, ASGI/WSGI
```

## Database

The project supports SQLite for local development and PostgreSQL through `DATABASE_URL` for production-style environments.

## Authentication

Authentication uses JWT through `djangorestframework-simplejwt`. The frontend stores and refreshes tokens through the auth context and sends authenticated API requests through the shared API client.

## Organization Scoping

The active workspace is selected on the frontend and sent to the backend with:

```http
X-Organization-ID: <organization_id>
```

Backend views use the active membership to ensure data belongs to the current organization and that role permissions are respected.

## Roles and Memberships

The organization membership model links a user to an organization with either `OWNER` or `STAFF`. Permissions are evaluated against the active workspace, not globally.

## Admin Console

The Django Admin interface uses Jazzmin and is configured as a website manager console. It gives superusers platform-level access to users, organizations, expenses, budgets, receipts, notifications, and activity logs.
