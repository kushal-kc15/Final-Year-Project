# Vyapar Margadarshan - Expense Management System

A full-stack expense management application with AI-powered receipt OCR.

## Tech Stack

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: SQLite (development)
- **OCR**: Google Gemini AI (FREE) + Tesseract (fallback)

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Login Credentials

- **Admin**: admin / admin123
- **User**: kushalkc / kushalkc123
- **Test Users**: user1-50 / password123

## Features

- ✅ User authentication (JWT)
- ✅ Expense tracking & management
- ✅ Budget management
- ✅ Organization & team management
- ✅ Receipt OCR (AI-powered)
- ✅ Activity logging
- ✅ Analytics & reports

## OCR Setup (Optional)

The app uses **Google Gemini AI** for smart receipt scanning (100% FREE).

1. Get API key: https://aistudio.google.com/app/apikey
2. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=your-key-here
   ```
3. Restart backend server

**Note**: Works with Tesseract OCR by default (no setup needed).

## Dummy Data

The database includes:
- 50+ users
- 10 organizations
- 1,000+ expenses
- 50+ budgets
- 500+ activity logs

## API Endpoints

- `/api/auth/` - Authentication
- `/api/users/` - User management
- `/api/organizations/` - Organizations
- `/api/expenses/` - Expenses
- `/api/budgets/` - Budgets
- `/api/receipts/` - Receipt OCR
- `/api/activity-logs/` - Activity logs

## Development

- Backend: http://127.0.0.1:8000/
- Frontend: http://localhost:5173/
- Admin Panel: http://127.0.0.1:8000/admin/

## License

MIT
