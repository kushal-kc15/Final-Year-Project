# Frontend Architecture Specification

## 1. Recommended Folder Structure

The frontend should use a feature-oriented structure with a small shared foundation. Shared code should exist only when at least two product areas need it or when consistency is critical across the application.

Recommended structure:

```text
frontend/
  src/
    app/
      providers/
      routes/
      shell/
      config/
    assets/
    design-system/
      tokens/
      primitives/
      feedback/
      overlays/
      forms/
      data-display/
      navigation/
    features/
      auth/
      workspace/
      dashboard/
      expenses/
      approvals/
      budgets/
      vendors/
      reports/
      activity/
      team/
      settings/
      receipts/
    shared/
      api/
      constants/
      hooks/
      lib/
      permissions/
      storage/
      types/
      utils/
    pages/
    styles/
    tests/
```

Folder responsibilities:

- `app`: application composition, global providers, route definitions, route guards, shell wiring, environment configuration.
- `design-system`: reusable UI foundation and product-agnostic components.
- `features`: domain-specific business modules. Each feature owns its screens, feature components, data hooks, validation rules, and local utilities.
- `shared`: non-visual reusable utilities used across features.
- `pages`: route-level page composition when a page combines multiple features.
- `styles`: global style entry points and token wiring only.
- `tests`: cross-feature test utilities and integration-level test helpers.

Feature folder structure:

```text
features/<feature-name>/
  api/
  components/
  hooks/
  pages/
  schemas/
  utils/
  constants/
```

Feature folder rules:

- Keep business-specific components inside their feature until another feature genuinely needs them.
- Promote components to `design-system` only when they are product-generic.
- Promote utilities to `shared` only when they are domain-neutral and reused.
- Avoid global folders that become dumping grounds, especially `components`, `helpers`, and `misc`.
- Keep route pages thin. Pages should compose feature modules, not contain most business logic.

## 2. Design System Architecture

The design system should provide a consistent foundation for the internal SaaS application while staying lightweight enough for a Final Year Project rebuild.

Design system layers:

- Tokens: named design decisions for spacing, surface roles, text roles, borders, semantic states, z-index layers, motion, radius, and data visualization.
- Primitives: low-level UI building blocks such as button, input, label, select, checkbox, dialog, drawer, tabs, menu, tooltip, badge, and separator.
- Patterns: reusable application structures such as page header, filter bar, data toolbar, empty state, loading state, error state, confirmation dialog, metric summary, and detail panel.
- Domain adapters: thin feature-level wrappers that combine design-system parts with business meaning, such as expense status badge or budget health indicator.

Design system rules:

- Tokens should describe purpose, not appearance.
- Components must expose states required by `DESIGN.md`: default, hover where applicable, focus, disabled, loading, error, empty, selected, active, and permission-restricted.
- Design-system components should not know backend endpoint names or business workflows.
- Domain terms such as expense, budget, vendor, and approval should live in feature modules unless the component is only a label adapter.
- Components should support accessibility by default: keyboard operation, accessible names, focus handling, and non-color status communication.
- Avoid creating highly abstract layout components before repeated use proves the need.

Design system promotion criteria:

- Promote when the same component pattern appears in two or more features.
- Promote when inconsistency would harm trust, such as status badges, destructive confirmations, empty states, or form fields.
- Do not promote one-off report or dashboard widgets until their reusable shape is clear.

## 3. Shared Component Architecture

Shared components should reduce duplication without hiding business meaning.

Component categories:

- App shell components: authenticated shell, top bar, sidebar or primary navigation, organization context, user menu, notification entry point.
- Page components: page header, section header, page body, action toolbar, permission notice.
- Feedback components: loading state, empty state, error state, toast, inline alert, confirmation dialog.
- Form components: field wrapper, input controls, validation message, form actions, upload control.
- Data components: table shell, list row, status badge, metric item, pagination, filter bar, sort control.
- Overlay components: modal, drawer, popover, menu, tooltip.

Reuse principles:

- Prefer composition over configuration-heavy components.
- Shared components should accept content and behavior from the caller rather than contain feature decisions.
- Keep component APIs small and predictable.
- Avoid one "universal card", "universal table", or "universal dashboard widget" that tries to solve every case.
- Use domain-specific wrappers when they improve clarity, such as `ExpenseStatus`, `BudgetProgress`, or `ApprovalDecisionPanel`.
- Keep destructive actions visually and behaviorally consistent across features.
- Keep loading, empty, and error patterns consistent enough that users understand system state immediately.

Component ownership:

- `design-system`: reusable visual and interaction primitives.
- `app/shell`: global navigation and authenticated workspace frame.
- `features/<feature>/components`: feature-specific components.
- `shared`: non-visual utilities and cross-feature helpers.

## 4. Layout Architecture

Layout should follow the internal business application model defined in `DESIGN.md`: persistent workspace shell, clear page headers, dense but readable content, strong list/detail patterns, and role-aware action placement.

Primary layout types:

- Public auth layout: login, registration, verification, reset password, invitation acceptance.
- Workspace setup layout: organization setup and first workspace creation.
- Authenticated app shell: persistent navigation, organization context, account access, notifications, and role awareness.
- List page layout: page header, controls, data region, pagination, detail access.
- Detail layout: object header, status, grouped fields, related evidence, history, contextual actions.
- Dashboard layout: prioritized modules with role-specific summaries and work queues.
- Settings layout: tabbed or sectioned configuration areas.

Layout rules:

- Use a consistent app shell for all authenticated workspace pages.
- Keep page-level primary actions in predictable locations.
- Keep feature-level secondary actions near the data they affect.
- Prefer list/detail or table/detail patterns for expenses, approvals, team, and reports.
- Avoid nested cards and decorative containers.
- Make tables and lists the default for repeated financial records.
- Use drawers or detail panels for inspection when staying in context is more useful than navigating away.
- Use full-page detail routes only when the object requires deeper review, sharing, or direct linking.
- Keep filters close to the list or report they control.

Responsive layout rules:

- Desktop and laptop are the primary productivity surfaces.
- Tablet should preserve all workflows with stacked or focused panels.
- Mobile should prioritize Staff workflows and preserve Owner access where feasible.
- Primary actions must remain reachable on all supported viewport sizes.
- Critical financial fields should not disappear on smaller screens.

## 5. Route Architecture

Routes should mirror the product information architecture and enforce authentication, organization, and role access without duplicating guard logic in every page.

Route groups:

- Public routes: landing or entry route if retained, login, register, verify email, forgot password, reset password, invitation acceptance.
- Workspace setup route: organization creation or join-required state.
- Authenticated workspace routes: overview, expenses, activity, settings.
- Owner-only workspace routes: approvals, budgets, reports, vendors, team.

Recommended route map:

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/invite`
- `/setup`
- `/dashboard`
- `/expenses`
- `/expenses/:expenseId` where direct deep links are useful
- `/approvals`
- `/budgets`
- `/vendors`
- `/reports`
- `/activity`
- `/team`
- `/settings`

Route guard strategy:

- Centralize route requirements in route metadata: authentication required, organization required, owner required, public-only, or setup-only.
- Keep guard behavior consistent across all protected routes.
- Redirect unauthenticated users to login.
- Redirect authenticated users without an organization to setup.
- Redirect unauthorized Staff users away from Owner-only pages and show permission messaging when they encounter restricted actions.
- Preserve intended destination after session recovery where appropriate.

Route loading strategy:

- Lazy-load route modules by feature.
- Keep global shell and route guards lightweight.
- Use page-level fallback only for route transitions or initial session checks.
- Use section-level loading inside data-heavy pages.

## 6. State Management Strategy

State should be separated by lifetime and ownership. Avoid a large global store unless the product grows beyond the current scope.

State categories:

- Server state: data fetched from the backend, such as expenses, budgets, reports, vendors, members, notifications, activity, and organization records.
- Session state: authenticated user, tokens, active organization, role, session status.
- URL state: filters, search terms, pagination, sorting, selected report period, tab selection when shareable or restorable.
- Local UI state: modal open state, drawer selection, temporary form state, expanded rows, local confirmation state.
- Derived state: totals, labels, grouped display values, permission flags, dashboard summaries.

State strategy:

- Use server-state patterns for backend data: caching, invalidation, refetching, optimistic safety only where appropriate.
- Keep session and active organization state centralized.
- Store active organization consistently and include it in API requests as required by the existing backend.
- Keep filters, pagination, search, and sort in the URL for list/report pages where users benefit from back/forward behavior or sharing.
- Keep transient UI state local to the component or feature.
- Avoid duplicating backend data into global client state.
- Avoid computing business-critical totals only on the client when backend-provided values exist.
- Invalidate related server state after mutations, such as expense submission, approval decision, budget update, invitation action, or role change.

Permission state:

- Derive permissions from the authenticated user's role and active organization.
- Provide shared permission helpers for route guards, navigation visibility, and action availability.
- Do not rely only on hidden UI for security; backend remains the source of truth.

## 7. API Layer Strategy

The API layer must adapt the frontend to the existing backend without requiring backend changes.

API architecture:

- One configured HTTP client for base URL, authentication headers, active organization headers, token refresh, and common error normalization.
- Feature-specific API modules for endpoint calls.
- Shared response normalization utilities for inconsistent or paginated response shapes.
- Shared error parsing for validation, permission, session, not-found, network, and server errors.
- Upload-aware request handling for receipt or file flows.

Feature API modules:

- `auth`: login, register, refresh, verification, password reset, two-factor where supported.
- `workspace`: organization create, organization list, switch active organization, invitation acceptance.
- `expenses`: list, detail, create, update where supported, export, vendor analytics, receipt association.
- `approvals`: pending expenses, approve, reject.
- `budgets`: list, create, update, delete or deactivate where supported, alerts.
- `reports`: analytics, trends, category summaries, anomaly or insight data, exports.
- `activity`: activity logs and notifications.
- `team`: members, invitations, role changes, removal, leave organization.
- `settings`: account, organization, notification preferences where supported.

API rules:

- Keep endpoint paths in API modules, not inside UI components.
- Keep request and response mapping near the API module.
- Convert backend field names into stable frontend domain shapes only when it improves maintainability.
- Do not create a second business rules layer that conflicts with the backend.
- Treat token refresh and logout events as infrastructure concerns.
- Ensure failed mutations report whether data changed or remained unchanged.
- Include active organization context on protected workspace requests.

Error handling:

- Normalize errors into user-actionable categories.
- Field validation errors should be consumable by forms.
- Permission errors should be consumable by route guards and disabled-action messaging.
- Session errors should trigger auth recovery or logout flow.
- Network errors should preserve user input and allow retry.

## 8. Form Architecture

Forms should be predictable, accessible, and resilient to backend validation.

Form categories:

- Authentication forms.
- Organization setup forms.
- Expense submission forms.
- Receipt upload or association forms.
- Approval rejection forms.
- Budget creation and edit forms.
- Team invitation and role forms.
- Settings and preference forms.

Form structure:

- Each feature owns its form schema, defaults, validation messages, and submit adapter.
- Shared form components provide consistent labels, help text, errors, required state, disabled state, and loading state.
- Backend validation errors should map back to field-level or form-level messages.
- Submit actions should clearly show progress and prevent accidental duplicate submission.
- Unsaved user input should be preserved after validation or network errors.

Form rules:

- Use feature-level schemas for business validation that can be checked before submit.
- Keep backend as final validation authority.
- Keep form field order aligned with the user's mental model and business workflow.
- Split long administrative forms into meaningful sections.
- Use confirmation dialogs for destructive or irreversible actions.
- Use inline validation for field-specific issues and summary messaging for form-level failures.
- Keep file upload flows separate enough to show upload progress and file-specific errors.

Reusable form patterns:

- `Field`
- `FieldGroup`
- `FormSection`
- `FormActions`
- `AmountField`
- `DateField`
- `CategorySelect`
- `StatusSelect`
- `RoleSelect`
- `ReceiptUpload`
- `ValidationSummary`

These should remain patterns or components only when used across multiple forms.

## 9. Table Architecture

Tables and structured lists should be the primary pattern for repeated business records.

Table use cases:

- Expenses ledger.
- Approval queue.
- Budgets list.
- Vendor analytics.
- Reports data tables.
- Team members.
- Pending invitations.
- Activity history.

Table architecture:

- Shared table shell for layout, loading, empty, error, pagination, and column behavior.
- Feature-owned column definitions and row actions.
- Feature-owned filter definitions.
- Feature-owned data fetching and mutation behavior.
- Shared formatting utilities for money, dates, status labels, and user display names.

Table behavior:

- Support search, filters, sorting, pagination, and row actions where useful.
- Keep status, amount, date, owner/user, and primary object name easy to scan.
- Use URL state for filters, sort, and pagination on pages where returning to a view matters.
- Provide clear empty states for no data and no matching results.
- Provide clear loading states that preserve table shape.
- Avoid showing too many low-value columns by default.
- Prefer row click or explicit detail action for inspection.
- Keep destructive row actions behind confirmation.

Responsive table strategy:

- Use full tables on desktop for dense scanning.
- On tablet, preserve important columns and allow detail expansion where needed.
- On mobile, convert to structured rows or cards with visible labels for each critical value.
- Never hide critical status, amount, date, or available primary action.

## 10. Reusable Dashboard Architecture

Dashboards should be composed from reusable modules, not one-off page code. The goal is to support role-specific dashboards now and future dashboard modules later without inventing a complex dashboard framework.

Dashboard layers:

- Dashboard page: decides role-specific composition and page-level loading/error behavior.
- Dashboard data hooks: fetch required summary data and expose normalized module inputs.
- Dashboard modules: focused, reusable sections such as pending approvals, spend summary, budget health, recent expenses, activity, vendor signals, and personal expense status.
- Dashboard primitives: metric item, trend summary, compact list, action group, risk item, chart wrapper, dashboard section.

Owner dashboard modules:

- Financial overview.
- Pending approvals.
- Budget health.
- Spending trends.
- Recent high-value or unusual expenses.
- Vendor concentration.
- Organization activity.
- Quick actions.

Staff dashboard modules:

- Expense submission action.
- Personal expense status.
- Recent submitted expenses.
- Rejection feedback where available.
- Notifications or activity relevant to the user.

Dashboard module rules:

- Every module must answer a specific business question.
- Every module should link to the deeper feature area when more detail is needed.
- Modules should own display logic, not data fetching infrastructure.
- Dashboard data should reuse feature API modules and shared formatting utilities.
- Avoid dashboard-only duplicates of feature components when a reusable list, status, or metric component already exists.
- Avoid generic KPI grids that do not connect to action.
- Keep role-specific differences at the composition layer, not scattered through every module.
- Use section-level loading and error states so one failed module does not collapse the full dashboard.

Future feature readiness:

- Receipt management can extend the expenses feature with receipt-specific components and upload state.
- OCR extraction can attach to receipt flows without changing expense table or dashboard architecture.
- AI insights can be added as report or dashboard modules that consume backend-provided insight data.
- Predictive budget alerts can extend budget health modules and notification patterns.
- Multi-organization support can extend workspace state, route guards, API headers, and organization context without rewriting feature modules.

Architecture boundaries:

- The backend remains unchanged.
- The frontend should adapt to existing endpoints and response shapes.
- Reuse should be intentional, not abstract for its own sake.
- Components should move from feature-local to shared only after repeated need is clear.
- Maintainability comes from clear ownership, consistent patterns, and small composable modules.
