from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
import random

from expenses.models import Expense
from organizations.models import Organization, OrganizationMember

User = get_user_model()


class Command(BaseCommand):
    help = 'Add pending expenses to approval queue for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-name',
            type=str,
            help='Name of the organization to add expenses to',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of expenses to create (default: 20)',
        )

    def handle(self, *args, **kwargs):
        org_name = kwargs.get('org_name')
        count = kwargs.get('count')
        
        self.stdout.write('Adding expenses to approval queue...')
        
        # Get organization
        if org_name:
            try:
                org = Organization.objects.get(name__icontains=org_name)
                self.stdout.write(f'Adding expenses to organization: {org.name}')
            except Organization.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Organization "{org_name}" not found.'))
                self.stdout.write('Available organizations:')
                for o in Organization.objects.all():
                    self.stdout.write(f'  - {o.name}')
                return
        else:
            orgs = Organization.objects.all()
            if not orgs.exists():
                self.stdout.write(self.style.ERROR('No organizations found. Please register a user first.'))
                return
            org = orgs.first()
            self.stdout.write(f'Adding expenses to organization: {org.name}')
        
        # Get users from this organization
        members = OrganizationMember.objects.filter(organization=org)
        if not members.exists():
            self.stdout.write(self.style.ERROR('No members found in this organization.'))
            return
        
        users = [member.user for member in members]
        
        categories = ['FOOD', 'TRANSPORT', 'OFFICE', 'UTILITIES', 'MARKETING', 'OTHER']
        vendors = [
            'Bhat Bhateni Supermarket',
            'Nepal Telecom',
            'Sajha Yatayat',
            'Himalayan Java',
            'Office Suppliers Nepal',
            'Nepal Electricity Authority',
            'Daraz Nepal',
            'Pathao Nepal',
            'Nabil Bank',
            'Kathmandu Guest House'
        ]
        
        titles = {
            'FOOD': [
                'Team Lunch at Restaurant',
                'Office Snacks Purchase',
                'Client Dinner Meeting',
                'Staff Refreshments',
                'Coffee Meeting with Client'
            ],
            'TRANSPORT': [
                'Taxi Fare for Client Meeting',
                'Fuel for Company Vehicle',
                'Vehicle Maintenance',
                'Parking Fee',
                'Airport Transfer'
            ],
            'OFFICE': [
                'Stationery Supplies',
                'Printer Ink Cartridges',
                'Office Furniture',
                'Computer Accessories',
                'Whiteboard Markers'
            ],
            'UTILITIES': [
                'Monthly Electricity Bill',
                'Internet Service Payment',
                'Water Bill',
                'Phone Bill',
                'Office Cleaning Service'
            ],
            'MARKETING': [
                'Facebook Ads Campaign',
                'Print Advertisement',
                'Promotional Materials',
                'Social Media Marketing',
                'Business Cards Printing'
            ],
            'OTHER': [
                'Bank Service Charges',
                'License Renewal Fee',
                'Professional Consultation',
                'Software Subscription',
                'Miscellaneous Expense'
            ]
        }
        
        descriptions = {
            'FOOD': [
                'Team building lunch with 8 staff members',
                'Monthly office snacks and beverages',
                'Business dinner with potential client',
                'Weekly coffee and tea supplies',
                'Breakfast meeting with stakeholders'
            ],
            'TRANSPORT': [
                'Transportation for urgent client meeting',
                'Monthly fuel expense for company vehicle',
                'Regular vehicle servicing and oil change',
                'Parking at client office building',
                'Airport pickup for visiting consultant'
            ],
            'OFFICE': [
                'Office supplies for new employees',
                'Replacement ink for office printer',
                'New desk and chair for staff',
                'Mouse, keyboard, and USB drives',
                'Whiteboard markers and erasers'
            ],
            'UTILITIES': [
                'Office electricity consumption for March',
                'High-speed internet for office',
                'Monthly water and sewage charges',
                'Business phone line charges',
                'Weekly office cleaning and maintenance'
            ],
            'MARKETING': [
                'Social media advertising campaign',
                'Newspaper advertisement for new product',
                'Brochures and flyers for event',
                'Instagram and Facebook promotions',
                'Business cards for all staff members'
            ],
            'OTHER': [
                'Monthly bank account maintenance fee',
                'Annual business license renewal',
                'Legal consultation for contract',
                'Annual software license renewal',
                'Unexpected office expense'
            ]
        }
        
        expenses_created = 0
        
        # Create pending expenses
        for i in range(count):
            days_ago = random.randint(0, 14)  # Last 2 weeks
            expense_date = date.today() - timedelta(days=days_ago)
            category = random.choice(categories)
            
            # Random amount between 1000 and 50000
            amount = Decimal(str(random.uniform(1000, 50000))).quantize(Decimal('0.01'))
            
            expense = Expense.objects.create(
                organization=org,
                user=random.choice(users),
                title=random.choice(titles[category]),
                amount=amount,
                category=category,
                vendor=random.choice(vendors),
                date=expense_date,
                description=random.choice(descriptions[category]),
                status='PENDING'  # This puts it in approval queue
            )
            expenses_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {expenses_created} pending expenses!'))
        self.stdout.write(f'Organization: {org.name}')
        self.stdout.write('These expenses are now in the approval queue.')
