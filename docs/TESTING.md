# Testing

## Backend Tests

Run all backend tests:

```powershell
cd backend
python manage.py test
```

Run selected apps:

```powershell
cd backend
python manage.py test users organizations expenses budgets analytics receipts notifications activity_logs
```

Run Django system checks:

```powershell
cd backend
python manage.py check
```

Check for missing migrations:

```powershell
cd backend
python manage.py makemigrations --check --dry-run
```

## Frontend Build Check

```powershell
cd frontend
npm run build
```

## Recommended Manual Checklist

- Register a new user.
- Create a workspace.
- Invite a staff member.
- Accept invitation as a new user.
- Accept invitation as an existing user.
- Cancel a pending invitation.
- Switch between two workspaces and confirm data changes.
- Submit an expense as staff.
- Upload or scan a receipt.
- Reject an expense with a reason.
- Correct and resubmit the rejected expense.
- Approve the resubmitted expense.
- Create a budget and confirm approved spend affects budget usage.
- Open Reports and verify approved-only reporting.
- Export a filtered CSV report.
- Confirm staff cannot see owner-only actions.
- Confirm staff report data does not include other users unless backend permissions intentionally allow it.
- Open Django Admin/Jazzmin as a superuser.

