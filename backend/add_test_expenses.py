"""
Script to add test expenses for dashboard testing
Run with: python manage.py shell < add_test_expenses.py
"""
import os
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vyapar_margadarshan.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from expenses.models import Expense

User = get_user_model()

# Get the first user (or create one)
try:
    user = User.objects.first()
    if not user:
        print("No users found. Please create a user first.")
        exit()
    
    print(f"Adding test expenses for user: {user.username}")
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)
    
    # Today's expenses
    Expense.objects.create(
        user=user,
        title='Lunch at Restaurant',
        amount=Decimal('850.00'),
        category='FOOD',
        date=today,
        description='Team lunch'
    )
    
    Expense.objects.create(
        user=user,
        title='Taxi to Office',
        amount=Decimal('450.00'),
        category='TRANSPORT',
        date=today,
        description='Morning commute'
    )
    
    # Yesterday's expenses
    Expense.objects.create(
        user=user,
        title='Office Supplies',
        amount=Decimal('2500.00'),
        category='OFFICE',
        date=yesterday,
        description='Stationery and printer paper'
    )
    
    # This week's expenses
    Expense.objects.create(
        user=user,
        title='Internet Bill',
        amount=Decimal('1800.00'),
        category='UTILITIES',
        date=week_ago,
        description='Monthly internet'
    )
    
    Expense.objects.create(
        user=user,
        title='Marketing Campaign',
        amount=Decimal('15000.00'),
        category='MARKETING',
        date=week_ago + timedelta(days=2),
        description='Facebook ads'
    )
    
    print("✅ Test expenses added successfully!")
    print(f"Total expenses created: {Expense.objects.filter(user=user).count()}")
    
except Exception as e:
    print(f"Error: {e}")
