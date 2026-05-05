# Vyapar Margadarshan - Technology Stack & Features

## 📚 Table of Contents
1. [Backend Technologies](#backend-technologies)
2. [Frontend Technologies](#frontend-technologies)
3. [Features & Implementation](#features--implementation)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)

---

## 🔧 Backend Technologies

### Core Framework
- **Django 4.2.11** - Python web framework
- **Django REST Framework 3.14.0** - RESTful API framework
- **Python 3.12** - Programming language

### Authentication & Security
- **djangorestframework-simplejwt 5.3.1** - JWT token authentication
  - Access tokens (30 min lifetime)
  - Refresh tokens (7 days lifetime)
  - Remember me feature (30 days)
- **Django CORS Headers 4.3.1** - Cross-Origin Resource Sharing
- **Password Validation** - Built-in Django validators
- **Password Strength Checker** - Custom implementation
- **Account Lockout** - 5 failed attempts = 15 min lock
- **Email Verification** - Required before login
- **2FA Support** - OTP via email (optional)

### Database
- **SQLite** - Development database
- **PostgreSQL** - Production ready (psycopg2-binary 2.9.9)

### Email System
- **SMTP Backend** - Gmail/SendGrid/AWS SES support
- **Console Backend** - Development mode
- **HTML Email Templates** - Beautiful responsive emails
- **Email Features:**
  - User registration verification
  - Password reset
  - 2FA OTP codes
  - Team invitations
  - Expense notifications
  - Budget alerts

### OCR (Optical Character Recognition)
- **Google Gemini API 0.8.6** - AI-powered receipt scanning
- **Pillow 10.2.0** - Image processing
- **Features:**
  - Vendor name extraction
  - Total amount detection
  - Date extraction
  - Auto-categorization (FOOD, TRANSPORT, etc.)
  - Line items extraction
  - Description generation
  - Multi-model fallback (gemini-1.5-flash, gemini-1.5-pro, gemini-pro-vision)
  - Retry logic with exponential backoff

### Utilities
- **python-decouple 3.8** - Environment variable management
- **python-dateutil 2.8.2** - Date/time handling
- **django-filter 23.5** - Advanced filtering for API

### Development Tools
- **ipython 8.21.0** - Enhanced Python shell
- **django-extensions 3.2.3** - Additional management commands
- **pytest 8.0.0** - Testing framework
- **pytest-django 4.8.0** - Django testing integration
- **factory-boy 3.3.0** - Test data generation

---

## 🎨 Frontend Technologies

### Core Framework
- **React 18** - UI library
- **Vite 5.4.21** - Build tool & dev server
- **JavaScript (ES6+)** - Programming language

### Routing & State
- **React Router DOM** - Client-side routing
- **Context API** - Global state management (AuthContext)
- **Local Storage** - Token persistence

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **Material Icons** - Icon library
- **Custom Fonts** - Plus Jakarta Sans, Inter

### HTTP Client
- **Axios** - HTTP requests
- **Interceptors** - Auto token refresh, error handling

### UI Components
- Custom components (no external UI library)
- Responsive design (mobile-first)
- Dark mode support (system preference)
- Toast notifications
- Modal dialogs
- Loading states
- Form validation

---

## 🚀 Features & Implementation

### 1. **User Authentication**

**Technologies:**
- Django User Model (extended)
- JWT tokens (simplejwt)
- Email verification
- Password strength checker

**Features:**
- ✅ Register with email verification
- ✅ Login with email/password
- ✅ Remember me (30-day tokens)
- ✅ Password reset via email
- ✅ Account lockout after failed attempts
- ✅ 2FA via email OTP (optional)
- ✅ Profile management
- ✅ Avatar upload

**Implementation:**
```python
# Backend: users/views.py
- RegisterView (CreateAPIView)
- CustomTokenObtainPairView (JWT login)
- CurrentUserView (get authenticated user)
- Password reset flow (token-based)

# Frontend: pages/Login.jsx, pages/Register.jsx
- Form validation
- Error handling
- Token storage
- Auto-redirect
```

---

### 2. **Organization Management**

**Technologies:**
- Django models (Organization, OrganizationMember, Invitation)
- UUID tokens for invitations
- Email invitations

**Features:**
- ✅ Create organization (auto on registration)
- ✅ Multi-user support (Owner, Manager, Staff)
- ✅ Team invitations via email
- ✅ Role-based permissions
- ✅ One organization per user rule
- ✅ Invitation expiry (7 days)
- ✅ Invitation status tracking (PENDING, ACCEPTED, EXPIRED)

**Roles & Permissions:**
- **Owner:** Full control, manage team, budgets, approve expenses, view all reports
- **Manager:** Manage expenses, view reports, limited team management
- **Staff:** Submit expenses, upload receipts, view own expense status

**Implementation:**
```python
# Backend: organizations/views.py
- OrganizationViewSet (CRUD)
- InvitationViewSet (send, accept, list)
- OrganizationMemberViewSet (manage members)

# Frontend: pages/TeamManagement.jsx
- Member list with roles
- Invite modal
- Pending invitations
- Role management
```

---

### 3. **Expense Management**

**Technologies:**
- Django models (Expense)
- Decimal fields for accurate currency
- Date handling
- File uploads (receipts)

**Features:**
- ✅ Add expenses manually
- ✅ Upload receipt images
- ✅ OCR auto-fill from receipts
- ✅ Categorization (8 categories)
- ✅ Vendor tracking
- ✅ Status workflow (PENDING → APPROVED/REJECTED)
- ✅ Approval queue for owners
- ✅ Expense filtering & search
- ✅ Date range filtering
- ✅ Export to CSV/JSON

**Categories:**
- FOOD (Food & Dining)
- TRANSPORT (Transportation)
- OFFICE (Office Supplies)
- UTILITIES (Utilities)
- SALARY (Salary & Wages)
- RENT (Rent)
- MARKETING (Marketing)
- OTHER (Other)

**Implementation:**
```python
# Backend: expenses/views.py
- ExpenseViewSet (CRUD)
- pending_approvals() - Get expenses needing approval
- approve() - Approve expense
- reject() - Reject expense
- statistics() - Expense analytics

# Frontend: pages/Expenses.jsx
- Expense list with filters
- Add expense modal
- Receipt upload
- Status badges
```

---

### 4. **Receipt OCR**

**Technologies:**
- Google Gemini 1.5 Flash API
- Pillow (image processing)
- JSON parsing
- Retry logic

**Features:**
- ✅ Upload receipt image (JPG, PNG, WebP)
- ✅ AI-powered text extraction
- ✅ Vendor name detection
- ✅ Total amount extraction
- ✅ Date extraction
- ✅ Auto-categorization
- ✅ Line items extraction
- ✅ Description generation
- ✅ Multi-model fallback
- ✅ Error handling & retries

**Supported Image Formats:**
- JPEG/JPG
- PNG
- WebP
- GIF

**Implementation:**
```python
# Backend: receipts/ocr_processor.py
class OCRProcessor:
    - extract_with_gemini() - Main OCR logic
    - Retry with exponential backoff
    - Model fallback (flash → pro → vision)
    - JSON parsing & validation

# Backend: receipts/views.py
- ReceiptViewSet (upload, list, delete)
- process_receipt() - Trigger OCR

# Frontend: components/OCRUploadModal.jsx
- Drag & drop upload
- Image preview
- OCR result display
- Auto-fill expense form
```

---

### 5. **Budget Management**

**Technologies:**
- Django models (Budget, BudgetAlert)
- Decimal calculations
- Date range filtering
- Aggregation queries

**Features:**
- ✅ Create budgets by category
- ✅ Set budget periods (Daily, Weekly, Monthly, Yearly)
- ✅ Alert thresholds (default 80%)
- ✅ Budget vs actual tracking
- ✅ Visual progress bars
- ✅ Alert notifications
- ✅ Budget status (active/inactive)
- ✅ Date range budgets

**Budget Periods:**
- DAILY
- WEEKLY
- MONTHLY
- YEARLY

**Implementation:**
```python
# Backend: budgets/views.py
- BudgetViewSet (CRUD)
- Budget calculation logic
- Alert generation
- Spending analytics

# Frontend: pages/BudgetManagement.jsx
- Budget cards with progress
- Add budget modal
- Alert indicators
- Category filtering
```

---

### 6. **Approval Queue**

**Technologies:**
- Django filtering
- Role-based access control
- Status updates

**Features:**
- ✅ Owner-only access
- ✅ View pending expenses
- ✅ Approve/reject with one click
- ✅ Exclude own expenses
- ✅ Expense details view
- ✅ Bulk actions (future)
- ✅ Notification on status change

**Implementation:**
```python
# Backend: expenses/views.py
@action(detail=False, methods=['get'])
def pending_approvals(self, request):
    # Get pending expenses excluding own
    # Owner role check
    # Return filtered list

# Frontend: pages/ApprovalQueue.jsx
- Pending expense cards
- Approve/reject buttons
- Expense details modal
- Empty state
```

---

### 7. **Dashboard & Analytics**

**Technologies:**
- Django aggregation (Sum, Count, Avg)
- Date filtering
- Chart data preparation

**Features:**
- ✅ Total expenses summary
- ✅ Expense by category breakdown
- ✅ Monthly trends
- ✅ Budget utilization
- ✅ Recent expenses
- ✅ Pending approvals count
- ✅ Quick actions

**Metrics:**
- Total spent (current month)
- Expense count
- Average expense
- Category distribution
- Budget vs actual
- Approval queue size

**Implementation:**
```python
# Backend: expenses/views.py
@action(detail=False, methods=['get'])
def statistics(self, request):
    # Aggregate expenses
    # Calculate totals
    # Group by category
    # Return analytics

# Frontend: pages/Dashboard.jsx
- Summary cards
- Category charts
- Recent activity
- Quick actions
```

---

### 8. **Activity Logs**

**Technologies:**
- Django signals
- Automatic logging
- User tracking

**Features:**
- ✅ Auto-log all actions
- ✅ User attribution
- ✅ Timestamp tracking
- ✅ Action types (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- ✅ Entity tracking (expense, budget, user)
- ✅ Activity feed

**Logged Actions:**
- Expense created/updated/deleted
- Expense approved/rejected
- Budget created/updated/deleted
- User invited/joined
- Receipt uploaded

**Implementation:**
```python
# Backend: activity_logs/utils.py
def log_activity(user, action, entity_type, entity_id, description):
    # Create activity log entry
    # Store user, timestamp, details

# Frontend: pages/ActivityCenter.jsx
- Activity timeline
- Filter by type
- User attribution
- Timestamp display
```

---

### 9. **Reports**

**Technologies:**
- Django aggregation
- Date range filtering
- Export functionality

**Features:**
- ✅ Expense reports by date range
- ✅ Category-wise breakdown
- ✅ Vendor analysis
- ✅ Budget vs actual reports
- ✅ Export to CSV
- ✅ Export to JSON
- ✅ Print-friendly format

**Report Types:**
- Expense summary
- Category breakdown
- Vendor spending
- Budget utilization
- Monthly trends

**Implementation:**
```python
# Backend: analytics/views.py
- Generate reports
- Apply filters
- Calculate totals
- Format data

# Frontend: pages/Reports.jsx
- Date range picker
- Filter options
- Report visualization
- Export buttons
```

---

### 10. **Settings & Preferences**

**Technologies:**
- User model fields
- Form validation
- File upload

**Features:**
- ✅ Profile management (name, email, phone)
- ✅ Avatar upload
- ✅ Currency preference (NPR, USD, EUR)
- ✅ Theme preference (light, dark, system)
- ✅ Items per page setting
- ✅ Password change
- ✅ Account security

**Implementation:**
```python
# Backend: users/views.py
- update_profile() - Update user info
- update_preferences() - Update settings
- change_password() - Change password
- upload_profile_picture() - Avatar upload

# Frontend: pages/Settings.jsx
- Profile form
- Preferences form
- Security settings
- Avatar upload
```

---

## 🗄️ Database Schema

### Users
```python
- id (PK)
- username (unique)
- email (unique)
- password (hashed)
- first_name, last_name
- business_name
- phone_number
- default_currency (NPR/USD/EUR)
- items_per_page
- theme_preference
- profile_picture
- email_verified
- email_verification_token
- failed_login_attempts
- account_locked_until
- last_login_ip
- created_at, updated_at
```

### Organizations
```python
- id (PK)
- name
- description
- created_at, updated_at
```

### OrganizationMembers
```python
- id (PK)
- organization_id (FK)
- user_id (FK)
- role (OWNER/MANAGER/STAFF)
- joined_at
```

### Invitations
```python
- id (PK)
- organization_id (FK)
- email
- role
- token (UUID)
- status (PENDING/ACCEPTED/EXPIRED)
- invited_by_id (FK)
- created_at
- expires_at
```

### Expenses
```python
- id (PK)
- organization_id (FK)
- user_id (FK)
- title
- amount (Decimal)
- category
- vendor
- date
- description
- status (PENDING/APPROVED/REJECTED)
- created_at, updated_at
```

### Budgets
```python
- id (PK)
- organization_id (FK)
- name
- amount (Decimal)
- period (DAILY/WEEKLY/MONTHLY/YEARLY)
- category
- alert_threshold (%)
- start_date, end_date
- is_active
- created_by_id (FK)
- created_at, updated_at
```

### Receipts
```python
- id (PK)
- expense_id (FK)
- image (file)
- ocr_data (JSON)
- uploaded_at
```

### ActivityLogs
```python
- id (PK)
- user_id (FK)
- action (CREATE/UPDATE/DELETE/APPROVE/REJECT)
- entity_type
- entity_id
- description
- created_at
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register/              - Register new user
POST   /api/auth/login/                 - Login (get JWT tokens)
POST   /api/auth/refresh/               - Refresh access token
GET    /api/auth/me/                    - Get current user
PUT    /api/auth/profile/               - Update profile
POST   /api/auth/change-password/       - Change password
POST   /api/auth/verify-email/          - Verify email
POST   /api/auth/resend-verification/   - Resend verification
POST   /api/auth/request-password-reset/ - Request password reset
POST   /api/auth/reset-password/        - Reset password
POST   /api/auth/check-password-strength/ - Check password strength
```

### Organizations
```
GET    /api/organizations/              - List organizations
POST   /api/organizations/              - Create organization
GET    /api/organizations/{id}/         - Get organization
PUT    /api/organizations/{id}/         - Update organization
DELETE /api/organizations/{id}/         - Delete organization
GET    /api/organizations/{id}/members/ - List members
POST   /api/organizations/{id}/invite/  - Invite member
```

### Invitations
```
GET    /api/invitations/                - List invitations
POST   /api/invitations/accept/         - Accept invitation
DELETE /api/invitations/{id}/           - Delete invitation
```

### Expenses
```
GET    /api/expenses/                   - List expenses
POST   /api/expenses/                   - Create expense
GET    /api/expenses/{id}/              - Get expense
PUT    /api/expenses/{id}/              - Update expense
DELETE /api/expenses/{id}/              - Delete expense
GET    /api/expenses/pending_approvals/ - Get pending approvals
POST   /api/expenses/{id}/approve/      - Approve expense
POST   /api/expenses/{id}/reject/       - Reject expense
GET    /api/expenses/statistics/        - Get expense stats
```

### Budgets
```
GET    /api/budgets/                    - List budgets
POST   /api/budgets/                    - Create budget
GET    /api/budgets/{id}/               - Get budget
PUT    /api/budgets/{id}/               - Update budget
DELETE /api/budgets/{id}/               - Delete budget
```

### Receipts
```
GET    /api/receipts/                   - List receipts
POST   /api/receipts/                   - Upload receipt
GET    /api/receipts/{id}/              - Get receipt
DELETE /api/receipts/{id}/              - Delete receipt
```

### Activity Logs
```
GET    /api/activity-logs/              - List activity logs
```

---

## 🔐 Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - Django's PBKDF2 algorithm
3. **CORS Protection** - Whitelist allowed origins
4. **CSRF Protection** - Django middleware
5. **SQL Injection Protection** - Django ORM
6. **XSS Protection** - React escaping
7. **Rate Limiting** - Account lockout after failed attempts
8. **Email Verification** - Required before login
9. **Secure Password Reset** - Token-based with expiry
10. **Role-Based Access Control** - Owner/Manager/Staff permissions

---

## 📦 Deployment Considerations

### Backend
- Use PostgreSQL in production
- Set DEBUG=False
- Use environment variables for secrets
- Configure ALLOWED_HOSTS
- Set up HTTPS
- Use production SMTP (SendGrid/AWS SES)
- Configure static/media file serving
- Set up logging

### Frontend
- Build for production: `npm run build`
- Serve with Nginx/Apache
- Configure API base URL
- Enable HTTPS
- Set up CDN for assets
- Configure caching

---

## 🎯 Key Highlights

✅ **Full-stack application** - Django REST + React
✅ **AI-powered OCR** - Google Gemini API
✅ **Multi-user support** - Organizations with roles
✅ **Email system** - Verification, invitations, notifications
✅ **Approval workflow** - Expense approval queue
✅ **Budget tracking** - With alerts and analytics
✅ **Secure authentication** - JWT with refresh tokens
✅ **Responsive design** - Mobile-first approach
✅ **Production-ready** - PostgreSQL, SMTP, deployment configs

---

**Total Lines of Code:** ~15,000+
**Backend:** ~8,000 lines (Python/Django)
**Frontend:** ~7,000 lines (JavaScript/React)
