# Features

## Multi-Workspace Support

Users can belong to multiple organizations. The active workspace is sent through the `X-Organization-ID` request header so backend data stays scoped to the selected organization.

## Owner and Staff Roles

Roles are assigned per workspace. A user can be an owner in one organization and staff in another.

## Expense Submission

Users can record expenses with:

- Title and description
- Amount and date
- Category
- Vendor
- Receipt attachment
- Submission status

## Receipt Upload and AI Scanning

Receipt files can be uploaded and scanned with Gemini Vision through the Django backend. API keys stay server-side, and extracted fields are shown to the user for review before an expense is created.

## Approval and Rejection Workflow

Owners can review pending expenses and either approve them or reject them with a reason. Approved expenses become part of reports, budgets, dashboard metrics, and CSV exports.

## Correction and Resubmission

Rejected expenses can be corrected by the submitter and sent back into the approval queue.

## Budgets and Alerts

Owners can create category or all-category budgets by period. Budget thresholds help highlight spending that is near or over the configured limit.

## Reports and CSV Export

Reports use approved expenses only. Reports support date filtering, category/vendor filtering when available, spend-over-time charts, category breakdowns, vendor breakdowns, approved expense tables, and CSV export.

## Team Invitations

Owners can invite users to a workspace by email. Invitations support new-user and existing-user acceptance flows.

## Invitation Cancellation

Pending invitations can be cancelled by owners so unused invite links no longer remain active.

## Staff Read-Only Team View

Staff users can view workspace members but cannot manage invitations, roles, or memberships.

## Admin Dashboard

Django Admin is styled with Jazzmin and configured as a website manager console for platform-level management.

## Theme Switching

The frontend supports light, dark, and system theme preferences.

## Notifications and Activity Logs

The backend includes notifications and activity logs for important system events such as expense changes, approvals, invitations, and budget-related activity.
