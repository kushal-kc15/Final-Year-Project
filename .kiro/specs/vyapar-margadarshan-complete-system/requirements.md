# Requirements Document: Vyapar Margadarshan - Complete System

## Introduction

Vyapar Margadarshan is a comprehensive SME financial management system built with Django REST Framework backend and React frontend. The system will be developed feature-by-feature, with each feature including backend API, frontend UI (based on Stitch designs), and tests before moving to the next feature.

## Glossary

- **Feature**: A complete vertical slice including backend API, frontend UI, and tests
- **Organization**: A business entity with multiple team members
- **Member**: A user belonging to an organization with a specific role
- **Role**: Permission level (OWNER, MANAGER, STAFF)
- **Expense**: A financial transaction record
- **Budget**: Spending limit for a category and time period
- **Alert**: System-generated notification
- **OCR**: Optical Character Recognition for receipt scanning
- **ML Model**: Machine learning model for expense categorization

## Feature-by-Feature Requirements

### Feature 0: Project Setup

**User Story**: As a developer, I want proper project structure, so that I can build features efficiently.

#### Acceptance Criteria

1. THE System SHALL have separate backend/ and frontend/ directories
2. THE backend SHALL use Django 4.2+ with DRF and SimpleJWT
3. THE frontend SHALL use React 18+ with Vite and Tailwind CSS
4. THE System SHALL have proper .gitignore and environment configuration
5. THE System SHALL have requirements files for dependencies

### Feature 1: Authentication

**User Story**: As a user, I want to register and login securely, so that I can access the system.

#### Acceptance Criteria

1. THE System SHALL provide user registration with username, email, password
2. THE System SHALL validate email format and password strength
3. THE System SHALL return JWT access and refresh tokens on login
4. THE System SHALL support token refresh mechanism
5. THE Frontend SHALL implement login/signup UI using Stitch design
6. THE Frontend SHALL store tokens securely in localStorage
7. THE System SHALL protect routes requiring authentication

### Feature 2: Landing Page

**User Story**: As a visitor, I want an attractive landing page, so that I understand what the system offers.

#### Acceptance Criteria

1. THE Frontend SHALL display hero landing page using Stitch design
2. THE Page SHALL show key features and benefits
3. THE Page SHALL have call-to-action buttons for signup/login
4. THE Page SHALL be responsive on mobile and desktop

### Feature 3: Main Dashboard

**User Story**: As a user, I want a dashboard showing my financial overview, so that I can see key metrics at a glance.

#### Acceptance Criteria

1. THE Backend SHALL provide dashboard metrics endpoint
2. THE Metrics SHALL include today, this week, this month totals
3. THE Backend SHALL calculate growth percentages
4. THE Frontend SHALL display dashboard using Stitch design
5. THE Dashboard SHALL show different views based on user role
6. THE Dashboard SHALL update metrics in real-time

### Feature 4: Expense Table & List

**User Story**: As a user, I want to view all my expenses in a table, so that I can track my spending.

#### Acceptance Criteria

1. THE Backend SHALL provide expense list endpoint with pagination
2. THE Backend SHALL support filtering by category, date range, amount
3. THE Backend SHALL support text search on title and description
4. THE Backend SHALL support sorting by date, amount, category
5. THE Frontend SHALL display expenses table using Stitch design
6. THE Table SHALL show title, amount, category, date, status
7. THE Table SHALL support inline filtering and sorting

### Feature 5: Add Expense

**User Story**: As a user, I want to add new expenses, so that I can record my spending.

#### Acceptance Criteria

1. THE Backend SHALL provide create expense endpoint
2. THE Backend SHALL validate amount is positive
3. THE Backend SHALL validate date is not in future
4. THE Backend SHALL validate category is valid choice
5. THE Frontend SHALL display add expense modal using Stitch design
6. THE Modal SHALL have fields for title, amount, category, date, description
7. THE Modal SHALL show validation errors inline
8. THE System SHALL associate expense with authenticated user

### Feature 6: Organization & Team Setup

**User Story**: As a business owner, I want to create an organization and invite team members, so that we can collaborate.

#### Acceptance Criteria

1. THE Backend SHALL provide organization CRUD endpoints
2. THE Backend SHALL create OrganizationMember with OWNER role on creation
3. THE Backend SHALL provide invitation creation endpoint
4. THE Backend SHALL generate secure unique invitation tokens
5. THE Backend SHALL send invitation emails
6. THE Backend SHALL provide invitation acceptance endpoint
7. THE Frontend SHALL have organization creation flow
8. THE Frontend SHALL have team member invitation interface
9. THE System SHALL validate invitation expiry (7 days)
10. THE System SHALL prevent duplicate memberships

### Feature 7: User Role Management

**User Story**: As an owner, I want to manage team member roles, so that I can control permissions.

#### Acceptance Criteria

1. THE Backend SHALL provide update member role endpoint
2. THE Backend SHALL enforce only OWNER can change roles
3. THE Backend SHALL prevent removing last OWNER
4. THE Frontend SHALL display role management UI using Stitch design
5. THE UI SHALL show all members with their roles
6. THE UI SHALL allow role changes via dropdown (OWNER only)
7. THE System SHALL implement permission matrix for all roles

### Feature 8: Staff Dashboard

**User Story**: As a staff member, I want a dashboard for submitting expenses, so that I can request reimbursements.

#### Acceptance Criteria

1. THE Backend SHALL provide staff-specific endpoints
2. THE Backend SHALL set STAFF expenses to PENDING status
3. THE Frontend SHALL display staff dashboard using Stitch design
4. THE Dashboard SHALL show pending, approved, rejected expenses
5. THE Dashboard SHALL allow expense submission
6. THE System SHALL prevent STAFF from approving own expenses

### Feature 9: Expense Approval Queue

**User Story**: As a manager, I want to approve/reject staff expenses, so that I can control spending.

#### Acceptance Criteria

1. THE Backend SHALL provide approval queue endpoint
2. THE Backend SHALL provide approve/reject endpoints
3. THE Backend SHALL enforce only MANAGER/OWNER can approve
4. THE Backend SHALL prevent self-approval
5. THE Frontend SHALL display approval queue using Stitch design
6. THE Queue SHALL show pending expenses with details
7. THE Queue SHALL allow approve/reject with reason
8. THE System SHALL notify staff of approval/rejection

### Feature 10: Budget Management

**User Story**: As a manager, I want to set budgets, so that I can control spending by category.

#### Acceptance Criteria

1. THE Backend SHALL provide budget CRUD endpoints
2. THE Backend SHALL validate budget amounts are positive
3. THE Backend SHALL validate period_end > period_start
4. THE Backend SHALL prevent overlapping budgets for same category
5. THE Backend SHALL track spending against budgets
6. THE Backend SHALL generate alerts at 80% threshold
7. THE Frontend SHALL display budget management using Stitch design
8. THE UI SHALL show budget vs actual with progress bars
9. THE System SHALL forecast budget utilization

### Feature 11: Vendor Management

**User Story**: As a user, I want to track vendors, so that I can analyze vendor spending.

#### Acceptance Criteria

1. THE Backend SHALL add vendor field to Expense model
2. THE Backend SHALL provide vendor analytics endpoint
3. THE Backend SHALL calculate vendor-wise totals
4. THE Frontend SHALL display vendor management using Stitch design
5. THE UI SHALL show vendor list with spending totals
6. THE UI SHALL allow filtering expenses by vendor

### Feature 12: Reports & Analytics

**User Story**: As a manager, I want comprehensive reports, so that I can analyze spending patterns.

#### Acceptance Criteria

1. THE Backend SHALL provide analytics endpoints
2. THE Backend SHALL support category breakdown
3. THE Backend SHALL support spending trends over time
4. THE Backend SHALL support period comparison
5. THE Backend SHALL generate PDF/Excel reports
6. THE Frontend SHALL display reports using Stitch design
7. THE UI SHALL show charts and visualizations
8. THE UI SHALL allow custom date ranges

### Feature 13: Activity Center

**User Story**: As an owner, I want to see all activities, so that I can audit actions.

#### Acceptance Criteria

1. THE Backend SHALL log all important actions
2. THE Backend SHALL provide activity log endpoint
3. THE Backend SHALL include user, action, timestamp, details
4. THE Frontend SHALL display activity center using Stitch design
5. THE UI SHALL show chronological activity feed
6. THE UI SHALL support filtering by user, action type, date

### Feature 14: Settings & Profile

**User Story**: As a user, I want to update my profile, so that I can keep my information current.

#### Acceptance Criteria

1. THE Backend SHALL provide update profile endpoint
2. THE Backend SHALL validate email uniqueness
3. THE Backend SHALL support password change
4. THE Frontend SHALL display settings using Stitch design
5. THE UI SHALL have tabs for profile, security, preferences
6. THE System SHALL require current password for changes

### Feature 15: OCR Receipt Upload

**User Story**: As a user, I want to upload receipts and auto-extract data, so that I can save time.

#### Acceptance Criteria

1. THE Backend SHALL accept image uploads (JPEG, PNG)
2. THE Backend SHALL use pytesseract for OCR
3. THE Backend SHALL extract vendor, amount, date, line items
4. THE Backend SHALL return confidence score
5. THE Frontend SHALL display OCR upload using Stitch design
6. THE UI SHALL show extracted data for review
7. THE UI SHALL allow manual corrections

### Feature 16: OCR Data Review

**User Story**: As a user, I want to review OCR data, so that I can ensure accuracy.

#### Acceptance Criteria

1. THE Backend SHALL provide receipt verification endpoint
2. THE Backend SHALL save verified data for ML training
3. THE Frontend SHALL display review UI using Stitch design
4. THE UI SHALL highlight low-confidence fields
5. THE UI SHALL allow field-by-field editing
6. THE System SHALL create expense from verified data

### Feature 17: AI Category Prediction

**User Story**: As a user, I want automatic category suggestions, so that I can categorize faster.

#### Acceptance Criteria

1. THE Backend SHALL train ML model from verified expenses
2. THE Backend SHALL use TF-IDF for text features
3. THE Backend SHALL provide prediction endpoint
4. THE Backend SHALL return category and confidence score
5. THE Frontend SHALL show suggested category in expense form
6. THE System SHALL allow manual override
7. THE Model SHALL retrain periodically with new data

### Feature 18: Anomaly Detection

**User Story**: As a manager, I want to detect unusual spending, so that I can prevent fraud.

#### Acceptance Criteria

1. THE Backend SHALL detect spending spikes (>2 std dev)
2. THE Backend SHALL detect duplicate transactions
3. THE Backend SHALL detect unusual timing (after-hours, weekends)
4. THE Backend SHALL detect rapid transactions
5. THE Backend SHALL generate alerts for high-confidence anomalies
6. THE Frontend SHALL display anomaly alerts in dashboard
7. THE System SHALL allow marking false positives

### Feature 19: Budget Forecasting

**User Story**: As a manager, I want budget forecasts, so that I can plan ahead.

#### Acceptance Criteria

1. THE Backend SHALL use regression for forecasting
2. THE Backend SHALL calculate daily spending rate
3. THE Backend SHALL project end-of-period spending
4. THE Backend SHALL generate projection alerts
5. THE Frontend SHALL display forecast in budget page
6. THE UI SHALL show projected vs actual with confidence bands

### Feature 20: Deployment & Polish

**User Story**: As a developer, I want production-ready deployment, so that users can access the system.

#### Acceptance Criteria

1. THE Backend SHALL have production settings
2. THE Backend SHALL use PostgreSQL in production
3. THE Backend SHALL use Gunicorn and Nginx
4. THE Frontend SHALL be optimized and minified
5. THE System SHALL use HTTPS
6. THE System SHALL have proper error handling
7. THE System SHALL have monitoring and logging
8. THE System SHALL pass security audit
