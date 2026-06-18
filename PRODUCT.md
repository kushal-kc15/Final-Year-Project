# Vyapar Margadarshan Product Definition

## 1. Product Overview

Vyapar Margadarshan is a business expense management application for small and growing organizations that need a clear way to record expenses, review spending, control budgets, manage team access, and understand financial activity.

The product helps organizations move expense handling away from scattered receipts, informal approvals, manual spreadsheets, and unclear spending ownership. It provides a shared workspace where business owners and staff can submit, review, approve, track, and analyze business expenses.

The rebuilt frontend should support a production-quality product experience while preserving the behavior and capabilities already provided by the existing backend. This document defines the product scope only. It does not define visual design, frontend architecture, technical implementation, or code.

## 2. Target Users

The primary target users are small businesses, local service providers, shops, agencies, startups, and internal teams that need lightweight expense control without enterprise-level complexity.

Key user groups:

- Business owners who need visibility into company spending, approvals, budgets, and team activity.
- Finance or operations leads who help review expenses, monitor budgets, and prepare reports.
- Staff members who submit expenses and need to track approval status.
- Project evaluators or academic reviewers who need to understand the system as a complete Final Year Project product.

User needs:

- Know how much the organization is spending.
- Capture expense details consistently.
- Reduce missing or unclear expense records.
- Approve or reject expenses with accountability.
- Track budgets and receive warnings before overspending becomes serious.
- View reports that explain spending patterns by time, category, vendor, and status.
- Manage who can access business financial data.

## 3. User Roles and Permissions

### Owner

Owners are responsible for organization-level financial control and system administration.

Owner permissions:

- Create and manage the organization workspace.
- View organization-wide expense activity.
- Submit expenses.
- Approve or reject pending expenses.
- View and manage all team members.
- Invite new members to the organization.
- Change member roles where allowed.
- Remove members where allowed.
- Manage budgets.
- View budget alerts.
- View vendor analytics.
- View reports and organization-wide analytics.
- Access activity history and notifications.
- Manage organization settings.

Owner restrictions:

- Owners should not lose access to an organization in a way that leaves the workspace without ownership.
- Owners should act within the active organization context.

### Staff

Staff users are contributors who submit expenses and track their own activity.

Staff permissions:

- Join an organization through invitation.
- Submit expenses for the active organization.
- View their own submitted expenses.
- View the status of their own expenses.
- Receive notifications about approvals, rejections, budget-related updates where relevant, and role changes.
- View available personal or scoped dashboard information.
- Manage their own account preferences where supported.
- Leave an organization where allowed.

Staff restrictions:

- Staff should not approve or reject expenses.
- Staff should not manage budgets.
- Staff should not invite, remove, or change roles of team members.
- Staff should not modify organization settings.
- Staff should not access organization-wide financial information beyond what the product explicitly allows.

## 4. Core Features

### Account and Access

- User registration and login.
- Email verification.
- Password reset.
- Login verification where required.
- Active organization selection or setup.
- Invitation acceptance for joining an organization.
- Role-based access to product areas and actions.

### Organization Workspace

- Organization creation and setup.
- Organization profile information.
- Active workspace context.
- Workspace access limited to approved members.

### Expense Management

- Create business expenses with title, amount, category, vendor, date, and description.
- Categorize expenses using supported business categories.
- Attach or associate receipt information where supported.
- Track expense statuses: pending, approved, and rejected.
- Search, filter, inspect, and export expense records where available.
- Separate personal expense visibility from organization-wide visibility according to role.

### Expense Approval

- Owners can review pending expenses.
- Owners can approve valid expenses.
- Owners can reject expenses with a reason where supported.
- Staff can track whether their submitted expenses are pending, approved, or rejected.
- Users receive status updates through notifications where supported.

### Budget Management

- Owners can create and manage budgets.
- Budgets can apply to all categories or a specific category.
- Budgets support daily, weekly, monthly, and yearly periods.
- Budgets include spending limits and alert thresholds.
- Budget alerts indicate threshold risk or exceeded budgets.
- Budget usage is calculated from relevant approved spending.

### Vendor Tracking

- Vendor names can be associated with expenses.
- Vendor analytics summarize spending by vendor.
- Users with permission can identify top vendors, transaction count, and vendor spending concentration.

### Reports and Analytics

- Spending summaries by date range, category, vendor, budget, and status.
- Dashboard metrics for recent activity and financial status.
- Budget risk reporting.
- Anomaly or unusual-spend signals where available.
- Exportable report data where supported.
- Owner views focus on organization-wide financial insight.
- Staff views focus on their own expense activity.

### Team Management

- Owners can view organization members.
- Owners can invite users by email.
- Owners can assign roles during invitation where supported.
- Owners can change roles where allowed.
- Owners can remove members where allowed.
- Members can see their role and organization membership status.

### Notifications and Activity

- Users receive relevant notifications for expense approvals, rejections, pending approvals, budget alerts, invitations, membership changes, role changes, and system messages.
- Users can identify unread and recent notifications.
- Activity history records important business actions such as expense changes, budget changes, invitations, role changes, and login activity where supported.

## 5. Business Workflows

### New Organization Setup

1. A user registers and verifies their account.
2. The user creates an organization workspace.
3. The user becomes the owner of that workspace.
4. The owner completes organization details.
5. The owner invites staff members as needed.

### Staff Invitation and Joining

1. An owner sends an invitation to a staff member's email address.
2. The invited user registers or logs in using the invited email.
3. The invited user accepts the invitation before it expires.
4. The user joins the organization with the assigned role.
5. The user can access role-appropriate workspace areas.

### Expense Submission

1. A user opens the active organization workspace.
2. The user enters the expense amount, category, vendor, date, title, and description.
3. The user submits the expense.
4. The expense is stored under the active organization and associated with the submitter.
5. The expense appears in the relevant status list.

### Expense Review

1. An owner opens the approval queue.
2. The owner reviews pending expenses and related details.
3. The owner approves valid expenses.
4. The owner rejects invalid or unclear expenses with a reason where supported.
5. The submitter is notified of the decision.
6. Approved expenses contribute to reporting and budget usage.

### Budget Monitoring

1. An owner creates a budget for a period and category.
2. Approved expenses accumulate against the matching budget.
3. The system compares spending with the budget limit and alert threshold.
4. Budget alerts are produced when spending reaches the threshold or exceeds the limit.
5. Owners use the alert information to control future spending.

### Reporting and Review

1. A permitted user opens reports or dashboard views.
2. The user reviews spending totals, category distribution, vendor activity, budget performance, and recent expense status.
3. The user filters or exports data where available.
4. The organization uses the insights to adjust budgets, approve spending, or identify unusual expenses.

### Team Administration

1. An owner reviews current members and pending invitations.
2. The owner invites new members, updates roles, or removes access where required.
3. The affected users receive relevant notifications.
4. Activity is recorded for accountability where supported.

## 6. Functional Requirements

### Account Requirements

- The product must allow users to register, log in, verify email, reset password, and securely access their account.
- The product must prevent unauthenticated users from accessing protected business workspace areas.
- The product must support invitation-based organization joining.

### Organization Requirements

- The product must require a user to have or join an organization before accessing organization-specific expense features.
- The product must maintain an active organization context.
- The product must separate one organization's data from another organization's data.
- The product must display organization identity and membership status where relevant.

### Role and Permission Requirements

- The product must distinguish between Owner and Staff users.
- The product must restrict actions according to role.
- The product must prevent Staff users from performing owner-only actions.
- The product must make permission restrictions clear to the user.

### Expense Requirements

- The product must allow permitted users to submit expenses with required business fields.
- The product must validate expense records before submission.
- The product must show expense status clearly.
- The product must allow users to inspect expense details.
- The product must support expense categories used by the business.
- The product must support vendor information when provided.
- The product must keep expense records associated with the submitting user and organization.

### Approval Requirements

- The product must provide Owners with a way to view pending expenses.
- The product must allow Owners to approve pending expenses.
- The product must allow Owners to reject pending expenses.
- The product must notify submitters when expenses are approved or rejected where supported.
- The product must ensure only approved expenses contribute to final spend analytics and budget calculations where applicable.

### Budget Requirements

- The product must allow Owners to create and manage budgets.
- The product must support budgets by period and category.
- The product must calculate budget usage from relevant approved expenses.
- The product must show budget threshold and exceeded states.
- The product must support active and inactive budget states where available.

### Reporting Requirements

- The product must provide spending summaries.
- The product must provide category-level spending analysis.
- The product must provide vendor-level spending analysis.
- The product must provide budget performance visibility.
- The product must show pending, approved, and rejected expense counts or summaries where relevant.
- The product must support exports where existing product capability allows.

### Team Requirements

- The product must allow Owners to view organization members.
- The product must allow Owners to invite members.
- The product must show pending invitations where supported.
- The product must allow role changes and member removal where supported.
- The product must prevent unauthorized team-management actions.

### Notification and Activity Requirements

- The product must show relevant user notifications.
- The product must distinguish read and unread notification states where supported.
- The product must surface important activity history for accountability where supported.

## 7. Non-Functional Requirements

### Usability

- The product must be understandable to non-technical business users.
- Core workflows must be easy to complete without training.
- Financial information must be clear, scannable, and unambiguous.
- Empty, loading, error, and restricted-access states must be understandable.

### Reliability

- The product must preserve submitted user data.
- The product must avoid duplicate or accidental actions where confirmation is appropriate.
- The product must handle failed requests gracefully.
- The product must recover cleanly from expired sessions or unavailable data.

### Security and Privacy

- The product must protect authenticated workspace data.
- The product must enforce role-based access.
- The product must prevent users from seeing financial records outside their permitted organization scope.
- The product must treat expense, user, receipt, and organization data as sensitive business information.

### Performance

- Common workflows should feel responsive during normal use.
- Dashboards, lists, reports, and filters should remain usable as business data grows.
- The product should avoid unnecessary waiting during repeated daily tasks.

### Accessibility

- The product should be usable by people with common accessibility needs.
- Important information should not depend only on color.
- Forms and actions should be understandable through labels, states, and feedback.
- Keyboard and screen-reader access should be considered part of production quality.

### Maintainability

- Product behavior should remain consistent across modules.
- Role rules, terminology, statuses, and categories should be used consistently.
- The frontend rebuild should respect existing backend behavior and avoid requiring backend changes.

### Auditability

- Important financial and administrative actions should be traceable where the system supports activity logs.
- Users should be able to understand who submitted, approved, rejected, or changed relevant records where available.

## 8. Success Criteria

The frontend rebuild is successful when:

- A new user can register, verify their account, create an organization, and reach a usable workspace.
- An owner can invite staff and manage organization membership.
- A staff member can join by invitation and submit an expense.
- An owner can review, approve, and reject submitted expenses.
- Staff can clearly see the status of their own expenses.
- Owners can create and monitor budgets.
- Budget usage and alerts help identify overspending risk.
- Reports provide clear insight into spending by time, category, vendor, status, and budget.
- Role restrictions are consistently enforced and understandable.
- Organization data remains scoped to the correct workspace.
- The product feels credible for a real business expense management use case.
- The product is suitable for Final Year Project demonstration and evaluation.
- The frontend rebuild does not require backend modification.

## 9. Assumptions and Constraints

### Assumptions

- The existing backend remains the source of truth for data, authentication, roles, permissions, and business rules.
- The product name is Vyapar Margadarshan.
- The primary organization roles are Owner and Staff.
- Each user belongs to one organization in the current product scope.
- Expense statuses are pending, approved, and rejected.
- Approved expenses are the basis for official spending analytics and budget usage.
- The application is intended for small business expense management, not full accounting or tax filing.
- The system may support receipt processing, smart insights, anomaly detection, exports, and notifications where already available.

### Constraints

- Backend behavior must not be changed as part of the frontend rebuild.
- This document must not define visual design direction.
- This document must not define frontend implementation details.
- This document must not introduce unsupported backend functionality as mandatory product scope.
- The product must work within the existing role model and organization model.
- The product must support the existing expense categories and budget periods.
- The product must treat business financial data as sensitive.
- The frontend should replace the current interface while preserving the product's existing business capabilities.

### Out of Scope for This Product Definition

- Visual design system.
- Page layouts.
- Component specifications.
- Frontend framework decisions.
- API implementation details.
- Backend model or endpoint changes.
- Payment processing.
- Payroll processing.
- Tax filing.
- Full accounting ledger functionality.

### Dashboard

- Financial overview
- Recent expenses
- Pending approvals
- Budget health summary
- Spending trends
- Quick actions
- Organization activity summary

### Receipt Management

- Upload receipt image
- View receipt attachment
- Associate receipt with expense
- Download receipt
- Receipt availability indicator

## Future Enhancements

- OCR-based receipt extraction
- AI spending insights
- Predictive budget alerts
- Mobile application
- Multi-organization support