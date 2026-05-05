from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import random

from organizations.models import Organization, OrganizationMember
from expenses.models import Expense
from budgets.models import Budget

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with dummy data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating dummy data...')
        
        # Create users
        users = self.create_users()
        
        # Create organizations
        orgs = self.create_organizations(users)
        
        # Create expenses
        self.create_expenses(users, orgs)
        
        # Create budgets
        self.create_budgets(users, orgs)
        
        self.stdout.write(self.style.SUCCESS('Successfully created dummy data!'))
        self.stdout.write(f'Login credentials:')
        self.stdout.write(f'  Owner: owner@example.com / password123')
        self.stdout.write(f'  Manager: manager@example.com / password123')
        self.stdout.write(f'  Staff: staff@example.com / password123')

    def create_users(self):
        users = []
        
        # Create owner
        owner, created = User.objects.get_or_create(
            username='owner',
            defaults={
                'email': 'owner@example.com',
                'first_name': 'Rajesh',
                'last_name': 'Sharma',
                'business_name': 'Sharma Enterprises',
                'phone_number': '+977-9841234567',
                'default_currency': 'NPR',
            }
        )
        if created:
            owner.set_password('password123')
            owner.save()
        users.append(owner)
        
        # Create manager
        manager, created = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@example.com',
                'first_name': 'Priya',
                'last_name': 'Thapa',
                'phone_number': '+977-9851234567',
                'default_currency': 'NPR',
            }
        )
        if created:
            manager.set_password('password123')
            manager.save()
        users.append(manager)
        
        # Create staff
        staff, created = User.objects.get_or_create(
            username='staff',
            defaults={
                'email': 'staff@example.com',
                'first_name': 'Amit',
                'last_name': 'Gurung',
                'phone_number': '+977-9861234567',
                'default_currency': 'NPR',
            }
        )
        if created:
            staff.set_password('password123')
            staff.save()
        users.append(staff)
        
        self.stdout.write(f'Created {len(users)} users')
        return users

    def create_organizations(self, users):
        orgs = []
        
        # Create main organization
        org, created = Organization.objects.get_or_create(
            name='Sharma Enterprises Pvt. Ltd.',
            defaults={
                'description': 'Leading retail and wholesale business in Kathmandu'
            }
        )
        orgs.append(org)
        
        # Add members
        OrganizationMember.objects.get_or_create(
            organization=org,
            user=users[0],
            defaults={'role': 'OWNER'}
        )
        OrganizationMember.objects.get_or_create(
            organization=org,
            user=users[1],
            defaults={'role': 'MANAGER'}
        )
        OrganizationMember.objects.get_or_create(
            organization=org,
            user=users[2],
            defaults={'role': 'STAFF'}
        )
        
        # Create second organization
        org2, created = Organization.objects.get_or_create(
            name='Tech Solutions Nepal',
            defaults={
                'description': 'IT consulting and software development company'
            }
        )
        orgs.append(org2)
        
        OrganizationMember.objects.get_or_create(
            organization=org2,
            user=users[1],
            defaults={'role': 'OWNER'}
        )
        
        self.stdout.write(f'Created {len(orgs)} organizations')
        return orgs

    def create_expenses(self, users, orgs):
        categories = ['FOOD', 'TRANSPORT', 'OFFICE', 'UTILITIES', 'SALARY', 'RENT', 'MARKETING', 'OTHER']
        vendors = [
            'Bhat Bhateni Supermarket', 'Nabil Bank', 'Nepal Telecom',
            'Sajha Yatayat', 'Kathmandu Guest House', 'Himalayan Java',
            'Office Suppliers Nepal', 'Nepal Electricity Authority',
            'Daraz Nepal', 'Pathao Nepal'
        ]
        
        titles = {
            'FOOD': ['Team Lunch', 'Office Snacks', 'Client Dinner', 'Staff Refreshments'],
            'TRANSPORT': ['Taxi Fare', 'Fuel', 'Vehicle Maintenance', 'Parking Fee'],
            'OFFICE': ['Stationery', 'Printer Ink', 'Office Furniture', 'Computer Accessories'],
            'UTILITIES': ['Electricity Bill', 'Internet Bill', 'Water Bill', 'Phone Bill'],
            'SALARY': ['Monthly Salary', 'Bonus Payment', 'Overtime Pay'],
            'RENT': ['Office Rent', 'Warehouse Rent', 'Parking Space Rent'],
            'MARKETING': ['Facebook Ads', 'Print Advertisement', 'Promotional Materials'],
            'OTHER': ['Miscellaneous', 'Bank Charges', 'License Renewal']
        }
        
        expenses_created = 0
        
        # Create expenses for the last 3 months
        for i in range(60):
            days_ago = random.randint(0, 90)
            expense_date = date.today() - timedelta(days=days_ago)
            category = random.choice(categories)
            
            expense = Expense.objects.create(
                organization=random.choice(orgs),
                user=random.choice(users),
                title=random.choice(titles[category]),
                amount=Decimal(str(random.uniform(500, 50000))).quantize(Decimal('0.01')),
                category=category,
                vendor=random.choice(vendors),
                date=expense_date,
                description=f'Expense for {category.lower()} related activities',
                status=random.choice(['APPROVED', 'APPROVED', 'APPROVED', 'PENDING'])
            )
            expenses_created += 1
        
        self.stdout.write(f'Created {expenses_created} expenses')

    def create_budgets(self, users, orgs):
        budgets_data = [
            {'name': 'Monthly Office Expenses', 'amount': 100000, 'period': 'MONTHLY', 'category': 'OFFICE'},
            {'name': 'Transportation Budget', 'amount': 50000, 'period': 'MONTHLY', 'category': 'TRANSPORT'},
            {'name': 'Marketing Campaign Q1', 'amount': 200000, 'period': 'MONTHLY', 'category': 'MARKETING'},
            {'name': 'Utilities Monthly', 'amount': 30000, 'period': 'MONTHLY', 'category': 'UTILITIES'},
            {'name': 'Overall Monthly Budget', 'amount': 500000, 'period': 'MONTHLY', 'category': 'ALL'},
        ]
        
        budgets_created = 0
        for budget_data in budgets_data:
            Budget.objects.get_or_create(
                organization=orgs[0],
                name=budget_data['name'],
                defaults={
                    'amount': Decimal(str(budget_data['amount'])),
                    'period': budget_data['period'],
                    'category': budget_data['category'],
                    'alert_threshold': 80,
                    'start_date': date.today().replace(day=1),
                    'end_date': (date.today().replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1),
                    'is_active': True,
                    'created_by': users[0]
                }
            )
            budgets_created += 1
        
        self.stdout.write(f'Created {budgets_created} budgets')
