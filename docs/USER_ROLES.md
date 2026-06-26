# User Roles

Roles are workspace-specific. The same user can have different roles in different organizations.

## Owner

Owners can:

- Create and manage workspace data
- Invite staff members
- Cancel pending invitations
- View and manage team members
- Review pending expenses
- Approve or reject expenses
- Create, pause, update, and remove budgets
- View organization-wide approved expense reports
- Export reports and expenses where permitted
- View vendor analytics and activity data for the workspace

## Staff

Staff can:

- Submit expenses
- Upload receipts
- Correct rejected expenses
- Resubmit rejected expenses for approval
- View their own expense records
- View read-only team information
- View data allowed by backend permissions for the active workspace

Staff cannot:

- Manage invitations
- Change member roles
- Remove members
- Approve or reject expenses
- Manage budgets
- Access organization-wide owner-only actions unless explicitly allowed by backend permissions

## Superuser or Platform Admin

Superusers use Django Admin/Jazzmin to manage platform data. This role is separate from workspace owner/staff behavior in the frontend application.

Superusers can inspect or manage:

- Users
- Organizations and memberships
- Invitations
- Expenses
- Budgets and alerts
- Receipts
- Notifications
- Activity logs

## Multi-Workspace Behavior

When the active workspace changes:

- The frontend remounts/refetches workspace data.
- API requests include the selected `X-Organization-ID`.
- Owner/staff actions update according to the user's role in that workspace.
- Data from another organization should not be displayed in the current workspace.

