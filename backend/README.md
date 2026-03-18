# Vyapar Margadarshan Backend

Django REST API backend for SME Financial Guide application.

## Features

- **User Authentication**: JWT-based authentication with custom user model
- **Expense Management**: CRUD operations for business expenses
- **Security**: User data isolation and proper permissions
- **Categories**: Predefined expense categories (Food, Rent, Salary, Supplies, Other)
- **Localization**: BS/AD date conversion utilities
- **Error Handling**: Global error handling with standardized JSON responses

## Quick Start

### 1. Install Dependencies

```bash
# Using the setup script (recommended)
python setup.py

# Or manually
pip install -r requirements/development.txt
python manage.py migrate
python manage.py check
```

### 2. Create Superuser

```bash
python manage.py createsuperuser
```

### 3. Run Development Server

```bash
python manage.py runserver
```

### 4. Test the API

```bash
# Run the API test script
python test_api.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Login (returns JWT tokens)
- `POST /api/auth/refresh/` - Refresh access token

### Expenses
- `GET /api/expenses/` - List user's expenses
- `POST /api/expenses/` - Create new expense
- `GET /api/expenses/{id}/` - Get specific expense
- `PUT /api/expenses/{id}/` - Update expense
- `DELETE /api/expenses/{id}/` - Delete expense

### Analytics (New!)
- `GET /api/expenses/dashboard/` - Dashboard summary (today, week, month stats)
- `GET /api/expenses/monthly_summary/?year=2024&month=3` - Monthly expense summary
- `GET /api/expenses/category_analytics/?days=30` - Category-wise breakdown
- `GET /api/expenses/spending_trends/?days=90` - Weekly and monthly spending trends
- `GET /api/expenses/top_expenses/?limit=10&days=30` - Top expenses by amount

## Project Structure

```
backend/
├── apps/
│   ├── users/          # User authentication
│   ├── expenses/       # Expense management
│   └── core/           # Shared utilities
├── vyapar_margadarshan/
│   └── settings/       # Django settings
├── requirements/       # Dependencies
├── setup.py           # Setup script
└── test_api.py        # API testing script
```

## Development

### Running Tests

```bash
python manage.py test
```

### Creating Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Admin Interface

Access at: http://127.0.0.1:8000/admin/

## Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

## API Usage Examples

### Register User
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "businessowner",
    "password": "securepass123",
    "email": "owner@business.com",
    "business_name": "My Business",
    "phone_number": "9841234567"
  }'
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "businessowner",
    "password": "securepass123"
  }'
```

### Create Expense
```bash
curl -X POST http://127.0.0.1:8000/api/expenses/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Office Rent",
    "amount": "25000.00",
    "category": "RENT",
    "date": "2024-01-15",
    "description": "Monthly office rent payment"
  }'
```

### Get Dashboard Analytics
```bash
curl -X GET http://127.0.0.1:8000/api/expenses/dashboard/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Category Analytics
```bash
curl -X GET http://127.0.0.1:8000/api/expenses/category_analytics/?days=30 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Tech Stack

- **Django 4.2+**: Web framework
- **Django REST Framework**: API framework
- **SimpleJWT**: JWT authentication
- **SQLite**: Database (development)
- **CORS Headers**: Cross-origin requests
- **Python Decouple**: Environment configuration