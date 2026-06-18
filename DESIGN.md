# Vyapar Margadarshan Design Definition

## 1. Design Principles

Vyapar Margadarshan is an internal business application. The interface should prioritize clarity, trust, speed, and repeated daily use over decoration or marketing impact.

Principles:

- Work first, presentation second: every screen should help users complete a business task, understand financial status, or make a decision.
- Financial clarity over visual drama: money, status, dates, categories, vendors, and ownership should be easy to compare and verify.
- Role-aware by default: Owners and Staff should see different priorities, actions, and levels of detail based on permission.
- Progressive disclosure: show the most important operational information first, with deeper detail available through drill-downs, filters, drawers, or detail views.
- Calm density: the product should support information-rich workflows without feeling crowded or ornamental.
- Predictable interaction: similar actions should behave the same across expenses, approvals, budgets, vendors, reports, team, and settings.
- Data confidence: users should always understand what data they are seeing, which organization it belongs to, and whether it is current, filtered, loading, empty, or unavailable.
- Minimal interruption: confirmation, warning, and error patterns should protect important actions without slowing down routine tasks.
- Production restraint: avoid generic SaaS spectacle, oversized marketing sections, decorative metrics, fake personalization, and repeated icon-card patterns that do not improve usability.

## 2. Information Architecture

The application should be organized around the core business objects and workflows defined in `PRODUCT.md`: organization, expenses, approvals, budgets, vendors, reports, team, notifications, activity, and settings.

Primary areas:

- Authentication: login, registration, email verification, password reset, invitation acceptance.
- Workspace setup: organization creation, organization identity, initial onboarding into the active workspace.
- Overview: current financial and operational snapshot.
- Expenses: submit, search, filter, inspect, export, and track expense records.
- Approvals: owner-only review queue for pending expenses.
- Budgets: owner-only budget management and budget health.
- Vendors: owner-only vendor spend analysis.
- Reports: owner-only deeper financial analytics and exports.
- Activity: notifications and activity history for relevant user and workspace events.
- Team: owner-only member, role, and invitation management.
- Settings: account preferences and permitted organization settings.

IA rules:

- The active organization context should be visible at the application shell level.
- Owner-only areas should not appear as available destinations for Staff users.
- Staff IA should focus on submitting expenses, tracking personal expense status, activity, and account settings.
- Owner IA should focus on organization-wide visibility, approval work, budget control, reporting, and team administration.
- Deep views should preserve orientation with clear page titles, object names, status, and return paths.
- Reports and dashboards should not become a dumping ground for every metric; each module should own the details most relevant to its workflow.

## 3. Navigation Structure

The navigation should support fast movement between repeated operational tasks.

Recommended primary navigation:

- Overview
- Expenses
- Approvals
- Budgets
- Reports
- Vendors
- Activity

Recommended utility navigation:

- Team
- Settings
- Profile/account access
- Organization switcher or organization context control where supported
- Notifications access

Role-based navigation:

- Owner: Overview, Expenses, Approvals, Budgets, Reports, Vendors, Activity, Team, Settings.
- Staff: Overview, Expenses, Activity, Settings.

Navigation behavior:

- Use a persistent app shell on authenticated workspace screens.
- Keep global navigation stable between modules.
- Highlight the active section clearly.
- Do not rely on hidden navigation for primary workflows.
- Provide contextual actions near the object or list they affect.
- Keep destructive or administrative actions separated from routine actions.
- On smaller screens, navigation should remain reachable without covering core content unnecessarily.

## 4. Layout System

The layout system should be built for business productivity: consistent page structure, readable tables, clear forms, and focused detail views.

Standard page anatomy:

- App shell with organization context, role awareness, notifications, and account access.
- Page header with title, concise description when useful, and primary page action.
- Optional filter or control region.
- Main content region for lists, summaries, charts, forms, or detail panels.
- Contextual secondary region only when it improves decision-making.
- Feedback region for loading, empty, error, or permission states.

Layout patterns:

- Overview pages should combine summaries, prioritized work queues, and recent activity.
- List pages should prioritize scanning, filtering, sorting, pagination, and row-level actions.
- Detail views should group fields by meaning: identity, amount, status, ownership, timing, evidence, and history.
- Forms should follow a predictable order and keep required fields obvious.
- Approval flows should keep evidence, decision context, and approve/reject actions close enough to support confident review.
- Settings pages should separate account, organization, notification, security, and data areas.
- Team management should separate active members from pending invitations.

Density guidance:

- Use compact but readable spacing for operational screens.
- Avoid oversized summary cards that crowd out actionable records.
- Avoid nested cards and decorative containers.
- Tables and lists should carry most repeated financial data.
- Charts should support decisions, not replace readable numbers.

## 5. Responsive Strategy

The product should remain usable across desktop, laptop, tablet, and mobile widths, with desktop and laptop treated as the primary work environments.

Responsive priorities:

- Preserve task completion before preserving exact layout.
- Keep primary actions available without forcing excessive scrolling.
- Convert wide data tables into responsive list rows or horizontally manageable views where necessary.
- Avoid hiding critical status, amount, date, or action information on smaller screens.
- Keep filters usable on small screens through collapsible or staged controls.
- Ensure modals, drawers, menus, and date controls fit within small viewports.
- Do not assume hover interaction is available.
- Touch targets must remain usable on mobile and tablet.

Desktop strategy:

- Support dense scanning of financial records.
- Allow side-by-side context where useful, such as list plus detail, dashboard plus work queue, or report plus filters.

Tablet strategy:

- Keep navigation compact.
- Prefer stacked sections and focused detail panels.
- Maintain full access to filters and actions.

Mobile strategy:

- Prioritize core Staff workflows: login, invitation, expense submission, own expense status, notifications, and settings.
- Owner workflows should remain possible, but complex analytics and bulk review may be optimized for larger screens.

## 6. Component Inventory

Core shell components:

- App shell
- Primary navigation
- Utility navigation
- Organization context control
- User/profile menu
- Notification access
- Role indicator
- Breadcrumb or workspace orientation where needed

Page structure components:

- Page header
- Section header
- Summary strip
- Filter bar
- Search control
- Sort control
- Pagination controls
- Toolbar
- Tab set
- Empty state
- Loading state
- Error state
- Permission state

Data display components:

- Financial metric
- Status badge
- Category label
- Vendor summary row
- Budget progress summary
- Activity item
- Notification item
- Expense table
- Approval queue row
- Team member row
- Invitation row
- Report table
- Chart container with supporting data labels

Input and action components:

- Text field
- Number or amount field
- Date field
- Select control
- Text area
- File or receipt upload control
- Checkbox or toggle
- Primary action
- Secondary action
- Destructive action
- Icon action
- Confirmation dialog
- Detail drawer or detail panel
- Toast or transient feedback

Domain-specific components:

- Expense submission form
- Expense detail view
- Receipt preview and attachment indicator
- Approval decision panel
- Rejection reason capture
- Budget creation/edit form
- Budget health indicator
- Vendor analytics list
- Report export control
- Member invitation form
- Role selection control
- Account/security form

Component behavior requirements:

- Components should be reusable across modules when behavior is shared.
- Domain components should use consistent labels, statuses, and actions.
- Interactive components must expose disabled, loading, error, empty, success, and permission-restricted states where relevant.
- Components that display financial data should support clear alignment, readable amounts, and consistent number formatting.

## 7. Design Tokens Strategy

Design tokens should define reusable decisions without locking the product to one visual expression in this document.

Token categories:

- Surface roles: page background, standard surface, raised surface, recessed surface, overlay surface.
- Text roles: primary, secondary, muted, inverse, disabled.
- Border roles: subtle, standard, strong, focus.
- Semantic roles: success, warning, danger, information, neutral.
- Status roles: pending, approved, rejected, active, inactive, unread.
- Spacing scale: compact controls, form rhythm, section rhythm, page rhythm.
- Radius scale: controls, panels, overlays.
- Elevation scale: none, subtle, floating, overlay.
- Motion scale: instant, fast, standard, deliberate.
- Layer scale: base, sticky shell, dropdown, modal backdrop, modal, toast, tooltip.
- Data visualization roles: categorical series, comparison series, threshold markers, forecast or risk markers.

Token strategy:

- Tokens should describe purpose, not appearance.
- Semantic tokens should be used for state and meaning, not decoration.
- Financial status should never rely on visual styling alone; pair status tokens with text labels.
- Data visualization tokens should be consistent across reports and dashboards.
- Spacing and layout tokens should support compact business workflows.
- Accessibility requirements should constrain token usage, especially contrast, focus, and disabled states.

## 8. Dashboard UX Philosophy

The dashboard is an operational command center, not a vanity analytics page.

Dashboard goals:

- Help users know what needs attention now.
- Summarize financial position without overwhelming detail.
- Provide fast paths into common workflows.
- Reveal risk, pending work, and recent movement.
- Support different priorities for Owner and Staff users.

Owner dashboard priorities:

- Pending approvals requiring action.
- Current spend and approved spending trend.
- Budget health and exceeded or near-threshold budgets.
- Recent high-value or unusual expenses.
- Vendor concentration signals.
- Recent organization activity.
- Quick access to submit expense, review approvals, create budget, and view reports.

Staff dashboard priorities:

- Submit a new expense.
- Personal pending, approved, and rejected expense status.
- Recent submitted expenses.
- Rejection feedback where available.
- Relevant notifications and activity.

Dashboard rules:

- Avoid decorative KPI tiles that do not connect to decisions.
- Every summary should answer a business question or lead to a useful action.
- Do not show too many metrics at once; prioritize the few that change behavior.
- Use trend and comparison only when the comparison period is clear.
- Keep risk and pending work visually and structurally prominent.
- Recent activity should support accountability without becoming noisy.
- Charts should be paired with readable labels, totals, and drill-down paths.

## 9. Empty States

Empty states should explain what is missing, why it matters, and what the user can do next.

General empty state requirements:

- Use specific language tied to the module.
- Avoid blaming the user.
- Provide one primary next action when action is possible.
- Respect role permissions; do not invite Staff users to perform Owner-only actions.
- Avoid decorative filler content that makes the product feel fake.
- Distinguish true empty data from filtered-out results.

Module examples:

- No organization: guide the user to create or join a workspace.
- No expenses: encourage the permitted user to submit the first expense.
- No pending approvals: confirm that there is no review work.
- No budgets: prompt Owners to create a first budget; explain budget value briefly.
- No vendor data: explain that vendor analytics appears after expenses include vendors.
- No reports data: explain which approved expenses are needed before reports become useful.
- No notifications: confirm that there are no updates requiring attention.
- No search results: suggest changing filters or search terms.
- Restricted page: explain that the current role does not have access.

## 10. Loading States

Loading states should preserve layout stability and communicate progress without exaggeration.

Loading requirements:

- Use page-level loading only for initial protected workspace loading or full-page transitions.
- Use section-level loading for dashboards, reports, tables, and panels when partial content can load independently.
- Preserve space for expected content to reduce layout shift.
- Keep loading language concise and specific.
- Avoid fake precision, playful copy, or excessive animation.
- Disable actions that depend on loading data.
- Allow unaffected areas to remain usable when possible.
- Make refresh or retry available after loading failure.

Loading patterns:

- Initial app/session loading.
- Workspace context loading.
- Table/list loading.
- Report/chart loading.
- Form submission loading.
- Export loading.
- Approval decision processing.
- File or receipt upload progress.

## 11. Error States

Error states should help users recover, understand impact, and protect financial data integrity.

Error requirements:

- State what happened in plain language.
- Explain whether data was saved, not saved, unavailable, or unchanged.
- Offer the next recovery action.
- Keep technical details out of the main message unless needed for support.
- Preserve entered form data whenever possible.
- Avoid duplicate submissions after failures.
- Distinguish validation errors, permission errors, network errors, session errors, missing data, and server errors.
- Place field errors next to the field and page errors near the affected region.

Common error patterns:

- Authentication expired: ask the user to sign in again and preserve return context where possible.
- Permission denied: explain the role limitation and avoid showing unavailable actions.
- Validation failed: show field-level corrections and keep the form open.
- Expense not found: explain that the record may have been removed or is outside the active workspace.
- Approval failed: make clear whether the expense decision was applied.
- Budget save failed: keep the budget form data and provide retry.
- Report unavailable: allow retry and explain that underlying data may still be intact.
- Export failed: allow the user to retry without changing filters.
- Upload failed: explain file requirements and keep expense form context.

## 12. Accessibility Requirements

Accessibility is part of production quality and must be considered across navigation, data display, forms, feedback, and responsive behavior.

Requirements:

- All interactive elements must be reachable and operable by keyboard.
- Focus order must follow visual and workflow order.
- Visible focus indicators must be clear on every interactive element.
- Navigation, forms, dialogs, menus, drawers, and notifications must expose meaningful names and states.
- Status must not be communicated by color alone.
- Financial values, dates, statuses, and actions must remain readable at supported viewport sizes.
- Text alternatives must exist for meaningful icons and receipt images where relevant.
- Decorative icons should not add noise for assistive technology.
- Form fields must have persistent labels or accessible names.
- Field errors must be programmatically associated with their fields.
- Confirmation dialogs must clearly identify the action, object, and consequence.
- Toasts and notifications must not be the only place critical information appears.
- Users should be able to reduce motion without losing context.
- Contrast must meet accepted accessibility thresholds for text, controls, borders that convey state, and focus indicators.
- Tables or list alternatives must preserve relationships between labels, values, statuses, and actions.
- Touch targets must be large enough for reliable mobile and tablet use.
- The product should support browser zoom without clipping critical content or hiding actions.

Accessibility review should be part of acceptance for every major screen: authentication, workspace setup, dashboard, expenses, approvals, budgets, reports, vendors, activity, team, settings, and all modal or drawer workflows.
