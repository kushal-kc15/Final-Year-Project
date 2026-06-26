# API Overview

The backend API is served under `/api/` and uses JWT authentication. Most workspace-specific requests should include the active organization header:

```http
Authorization: Bearer <access_token>
X-Organization-ID: <organization_id>
```

## Authentication

Base path:

```text
/api/auth/
```

Important groups:

- Register
- Login
- Token refresh
- Google login
- Email verification
- Password reset
- Current user profile
- Preferences
- Profile picture
- Two-factor setup endpoints

## Organizations and Workspaces

Base paths:

```text
/api/organizations/
/api/invitations/
```

Used for:

- Workspace CRUD where permitted
- Active membership and role behavior
- Member listing
- Role updates
- Member removal
- Invitation creation
- Invitation acceptance
- Invitation cancellation

## Expenses

Base path:

```text
/api/expenses/
```

Used for:

- Expense list/detail
- Create and update expenses
- Receipt-related fields
- Pending approval queue
- Approve and reject actions
- Expense CSV export
- Dashboard and vendor analytics actions exposed by the expense viewset

## Approvals

Approval behavior is part of the expenses API. Owners review pending expenses and submit approve/reject actions. Staff correction and resubmission are handled through expense update behavior.

## Budgets

Base paths:

```text
/api/budgets/
/api/budget-alerts/
```

Used for:

- Budget list/detail
- Create, update, pause, and remove budgets where permitted
- Budget alert tracking

## Analytics and Reports

Base path:

```text
/api/analytics/
```

Important endpoints:

- `overview/`
- `report-detail/`
- `export-csv/`
- `spending-trends/`
- `category-breakdown/`
- `period-comparison/`
- `vendor-summary/`
- `budget-burn-rate/`
- `ai-insights/`
- `anomalies/`

Reports are designed around approved expense data and active organization scope.

## Receipts

Base path:

```text
/api/receipts/
```

Used for receipt upload, Gemini AI extraction, and receipt metadata. The scan endpoint does not create an expense automatically; the frontend asks the user to review and confirm first.

## Notifications

Base path:

```text
/api/notifications/
```

Used for user-facing notification list and read-state management.

## Activity Logs

Base path:

```text
/api/activity-logs/
```

Used for workspace and system activity history.
