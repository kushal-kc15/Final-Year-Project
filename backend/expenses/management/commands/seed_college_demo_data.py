from datetime import timedelta
from decimal import Decimal
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from budgets.models import Budget, BudgetAlert
from expenses.models import Expense
from organizations.models import Organization, OrganizationMember


class Command(BaseCommand):
    help = 'Seed realistic demo expenses and budgets for the college project organization.'

    def add_arguments(self, parser):
        parser.add_argument('--org-name', default='college project')
        parser.add_argument(
            '--reset-demo',
            action='store_true',
            help='Delete existing [Demo] expenses/budgets for the organization before seeding.',
        )

    def handle(self, *args, **options):
        org_name = options['org_name']
        try:
            organization = Organization.objects.get(name__iexact=org_name)
        except Organization.DoesNotExist as exc:
            raise CommandError(f'Organization not found: {org_name}') from exc

        owner_member = OrganizationMember.objects.filter(
            organization=organization,
            role='OWNER',
        ).select_related('user').first()
        staff_members = list(OrganizationMember.objects.filter(
            organization=organization,
            role='STAFF',
        ).select_related('user'))

        if not owner_member:
            raise CommandError(f'Organization {organization.name} needs an OWNER member before seeding.')

        users = [owner_member.user] + [member.user for member in staff_members]
        if not users:
            raise CommandError('No users available for demo expense ownership.')

        if options['reset_demo']:
            self.reset_demo_data(organization)

        today = timezone.now().date()
        month_start = today.replace(day=1)
        month_end = self.month_end(today)

        budgets = self.create_budgets(organization, owner_member.user, month_start, month_end)
        expenses = self.create_expenses(organization, users, today)
        alerts = self.create_budget_alerts(organization, budgets, month_start, month_end)

        self.stdout.write(self.style.SUCCESS(
            f'Seeded {len(expenses)} demo expenses, {len(budgets)} demo budgets, '
            f'and {len(alerts)} budget alerts for {organization.name}.'
        ))

    def reset_demo_data(self, organization):
        demo_budgets = Budget.objects.filter(organization=organization, name__startswith='[Demo]')
        BudgetAlert.objects.filter(budget__in=demo_budgets).delete()
        demo_budgets.delete()
        Expense.objects.filter(organization=organization, title__startswith='[Demo]').delete()

    def month_end(self, day):
        if day.month == 12:
            return day.replace(day=31)
        return day.replace(month=day.month + 1, day=1) - timedelta(days=1)

    def create_budgets(self, organization, owner, month_start, month_end):
        budget_rows = [
            ('[Demo] Overall Monthly Operating Budget', 'ALL', 'MONTHLY', '20000.00', 80),
            ('[Demo] Food & Meeting Budget', 'FOOD', 'MONTHLY', '18000.00', 75),
            ('[Demo] Transport Budget', 'TRANSPORT', 'MONTHLY', '9000.00', 80),
            ('[Demo] Office Supplies Budget', 'OFFICE', 'MONTHLY', '25000.00', 80),
            ('[Demo] Marketing Budget', 'MARKETING', 'MONTHLY', '7000.00', 75),
            ('[Demo] Utilities Budget', 'UTILITIES', 'MONTHLY', '10000.00', 80),
        ]

        budgets = []
        for name, category, period, amount, threshold in budget_rows:
            budget, _ = Budget.objects.update_or_create(
                organization=organization,
                name=name,
                defaults={
                    'category': category,
                    'period': period,
                    'amount': Decimal(amount),
                    'alert_threshold': threshold,
                    'start_date': month_start,
                    'end_date': month_end,
                    'is_active': True,
                    'created_by': owner,
                },
            )
            budgets.append(budget)
        return budgets

    def create_expenses(self, organization, users, today):
        random.seed(2081)
        approved_templates = [
            ('FOOD', 'Himalayan Java', '[Demo] Client coffee meeting', 650, 1850),
            ('FOOD', 'Bajeko Sekuwa', '[Demo] Team lunch', 1800, 5200),
            ('TRANSPORT', 'Pathao Nepal', '[Demo] Ride to client office', 350, 1400),
            ('TRANSPORT', 'Nepal Oil Corporation', '[Demo] Fuel refill', 2500, 6500),
            ('OFFICE', 'SastoDeal Office', '[Demo] Office stationery purchase', 900, 3800),
            ('OFFICE', 'New Road Electronics', '[Demo] Keyboard and mouse set', 2200, 7200),
            ('UTILITIES', 'Nepal Electricity Authority', '[Demo] Electricity bill payment', 2800, 8600),
            ('UTILITIES', 'WorldLink', '[Demo] Internet subscription', 2200, 4500),
            ('MARKETING', 'Meta Ads', '[Demo] Facebook campaign boost', 2500, 9000),
            ('MARKETING', 'Printmandu', '[Demo] Brochure printing', 1800, 6800),
            ('OTHER', 'Daraz Business', '[Demo] Miscellaneous supplies', 700, 3600),
        ]

        expenses = []
        for index in range(56):
            category, vendor, title, min_amount, max_amount = approved_templates[index % len(approved_templates)]
            expense_date = today - timedelta(days=random.randint(0, 115))
            amount = Decimal(random.randint(min_amount, max_amount)).quantize(Decimal('1.00'))
            user = users[index % len(users)]
            expenses.append(Expense(
                organization=organization,
                user=user,
                title=f'{title} #{index + 1}',
                amount=amount,
                category=category,
                vendor=vendor,
                date=expense_date,
                description='Demo data for analytics, reporting, and dashboard review.',
                status='APPROVED',
            ))

        pending_rows = [
            ('[Demo] Pending laptop repair', 'OFFICE', 'IT Support Nepal', '14500.00', today - timedelta(days=1)),
            ('[Demo] Pending conference snacks', 'FOOD', 'Bhatbhateni Supermarket', '4200.00', today),
            ('[Demo] Pending taxi reimbursement', 'TRANSPORT', 'InDrive', '950.00', today - timedelta(days=2)),
            ('[Demo] Pending boosted campaign', 'MARKETING', 'Meta Ads', '7800.00', today - timedelta(days=3)),
            ('[Demo] Pending water jar supply', 'UTILITIES', 'Aqua Nepal', '1800.00', today - timedelta(days=4)),
            ('[Demo] Pending projector cable', 'OFFICE', 'New Road Electronics', '2600.00', today - timedelta(days=5)),
        ]
        for index, (title, category, vendor, amount, expense_date) in enumerate(pending_rows):
            expenses.append(Expense(
                organization=organization,
                user=users[(index + 1) % len(users)],
                title=title,
                amount=Decimal(amount),
                category=category,
                vendor=vendor,
                date=expense_date,
                description='Demo pending item for approval workflow.',
                status='PENDING',
            ))

        special_rows = [
            ('[Demo] High value office equipment purchase', 'OFFICE', 'New Road Electronics', '42000.00', today - timedelta(days=2), 'PENDING'),
            ('[Demo] Duplicate taxi claim A', 'TRANSPORT', 'Pathao Nepal', '1250.00', today - timedelta(days=1), 'PENDING'),
            ('[Demo] Duplicate taxi claim B', 'TRANSPORT', 'Pathao Nepal', '1250.00', today, 'APPROVED'),
            ('[Demo] Rejected personal dinner claim', 'FOOD', 'Roadhouse Cafe', '3500.00', today - timedelta(days=7), 'REJECTED'),
            ('[Demo] Rejected unsupported purchase', 'OTHER', 'Unknown Vendor', '2800.00', today - timedelta(days=14), 'REJECTED'),
        ]
        for index, (title, category, vendor, amount, expense_date, status) in enumerate(special_rows):
            expenses.append(Expense(
                organization=organization,
                user=users[index % len(users)],
                title=title,
                amount=Decimal(amount),
                category=category,
                vendor=vendor,
                date=expense_date,
                description='Demo edge case for anomaly, duplicate, or rejection workflows.',
                status=status,
            ))

        return Expense.objects.bulk_create(expenses)

    def create_budget_alerts(self, organization, budgets, month_start, month_end):
        alerts = []
        for budget in budgets:
            filters = {
                'organization': organization,
                'status': 'APPROVED',
                'date__gte': month_start,
                'date__lte': month_end,
            }
            if budget.category != 'ALL':
                filters['category'] = budget.category

            total = sum(expense.amount for expense in Expense.objects.filter(**filters))
            if total <= 0:
                continue

            percentage = int((total / budget.amount) * Decimal('100'))
            if percentage >= budget.alert_threshold:
                alert_type = 'EXCEEDED' if total > budget.amount else 'THRESHOLD'
                alerts.append(BudgetAlert(
                    budget=budget,
                    alert_type=alert_type,
                    percentage=percentage,
                    amount_spent=total,
                    message=f'[Demo] {budget.name} is at {percentage}% of budget.',
                    is_read=False,
                ))

        return BudgetAlert.objects.bulk_create(alerts)
