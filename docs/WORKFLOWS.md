# Workflows

## Create Workspace

1. Register or log in.
2. Create a new organization/workspace during onboarding or workspace setup.
3. The creator becomes the owner of that workspace.
4. The workspace becomes available in the organization switcher.

## Invite Member

1. Owner opens the Team page.
2. Owner selects Invite by email.
3. Owner enters the email address and role.
4. Backend creates a pending invitation and sends an email if SMTP is configured.
5. The invitation appears in the pending invitations list.

## Accept Invite as New User

1. User opens the invitation link.
2. User registers a new account.
3. Backend validates the invitation token.
4. User becomes a member of the invited workspace.
5. User is redirected into the app.

## Accept Invite as Existing User

1. User opens the invitation link.
2. User logs in with an existing account.
3. Backend validates the invitation token and email rules.
4. Membership is created for the invited workspace.
5. The workspace becomes available in the organization switcher.

## Cancel Invitation

1. Owner opens Team.
2. Owner finds the pending invitation.
3. Owner cancels it.
4. The invitation status changes to cancelled and the link should no longer be usable.

## Switch Workspace

1. User opens the organization switcher in the topbar.
2. User selects a workspace.
3. Frontend updates the active organization.
4. Pages refetch data using `X-Organization-ID`.
5. Role-specific actions update for the selected workspace.

## Submit Expense

1. User opens Expenses.
2. User selects Add expense.
3. User enters amount, category, vendor, date, title, and notes.
4. User optionally uploads or scans a receipt.
5. Expense is saved and follows the backend approval rules.

## Reject Expense with Reason

1. Owner opens Approvals.
2. Owner selects a pending expense.
3. Owner enters a rejection reason.
4. Owner confirms rejection.
5. Expense status changes to rejected and the submitter can correct it.

## Correct and Resubmit Rejected Expense

1. Submitter opens the rejected expense.
2. Submitter edits the requested fields.
3. Submitter saves the correction.
4. Expense returns to the pending approval queue.

## Approve Expense

1. Owner opens Approvals.
2. Owner selects a pending expense.
3. Owner reviews amount, category, vendor, date, notes, and receipt.
4. Owner approves the expense.
5. Approved expense becomes part of budgets, reports, dashboard metrics, and CSV exports.

## Budget Tracking

1. Owner opens Budgets.
2. Owner creates a budget for all categories or a specific category.
3. Approved expenses are compared against budget limits.
4. Threshold and exceeded states help identify risky spending.

## Report Export

1. User opens Reports.
2. User selects date range and optional filters.
3. Report loads approved expense data for the active workspace and permitted role scope.
4. User selects Export CSV.
5. CSV uses the same report filters and organization scope.

