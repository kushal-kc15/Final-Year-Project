# Vyapar Margadarshan Backend

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements/development.txt
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create superuser:
```bash
python manage.py createsuperuser
```

5. Run development server:
```bash
python manage.py runserver
```

## Features

Features will be built one at a time:
- Feature 1: Authentication
- Feature 2: Landing Page
- Feature 3: Main Dashboard
- And so on...
