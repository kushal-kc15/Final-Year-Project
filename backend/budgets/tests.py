from decimal import Decimal
from datetime import timedelta

from django.core import mail
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from budgets.emails import send_budget_alert_email
from budgets.models import Budget
from budgets.serializers import BudgetSerializer
from organizations.models import Organization, OrganizationMember
from users.models import User


class BudgetAlertEmailTests(TestCase):
    def test_send_budget_alert_email_handles_missing_dates(self):
        user = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='pass12345',
        )
        organization = Organization.objects.create(name='Test Organization')
        budget = Budget.objects.create(
            organization=organization,
            created_by=user,
            name='Monthly Food Budget',
            amount=Decimal('1000.00'),
            period='MONTHLY',
            category='FOOD',
            start_date=None,
            end_date=None,
        )

        sent = send_budget_alert_email(
            budget=budget,
            current_spending=Decimal('1250.00'),
            recipients=['owner@example.com'],
        )

        self.assertTrue(sent)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Period: Monthly', mail.outbox[0].body)
        self.assertIn('Monthly', mail.outbox[0].alternatives[0][0])


class BudgetSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='pass12345',
        )
        self.organization = Organization.objects.create(name='Test Organization')

    def test_create_budget_defaults_dates_from_period(self):
        serializer = BudgetSerializer(data={
            'name': 'Monthly Food Budget',
            'amount': '1000.00',
            'period': 'MONTHLY',
            'category': 'FOOD',
            'alert_threshold': 80,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        budget = serializer.save(
            organization=self.organization,
            created_by=self.user,
        )

        today = timezone.now().date()
        expected_start = today.replace(day=1)
        if today.month == 12:
            expected_end = today.replace(day=31)
        else:
            expected_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)

        self.assertEqual(budget.start_date, expected_start)
        self.assertEqual(budget.end_date, expected_end)

    def test_budget_date_range_must_be_ordered(self):
        serializer = BudgetSerializer(data={
            'name': 'Invalid Budget',
            'amount': '1000.00',
            'period': 'MONTHLY',
            'category': 'FOOD',
            'start_date': '2026-02-01',
            'end_date': '2026-01-01',
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('end_date', serializer.errors)


class BudgetPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='budgetowner',
            email='budgetowner@example.com',
            password='pass12345',
        )
        self.staff = User.objects.create_user(
            username='budgetstaff',
            email='budgetstaff@example.com',
            password='pass12345',
        )
        self.organization = Organization.objects.create(name='Budget Org')
        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.owner,
            role='OWNER',
        )
        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.staff,
            role='STAFF',
        )
        self.owner.active_organization = self.organization
        self.owner.save(update_fields=['active_organization'])
        self.staff.active_organization = self.organization
        self.staff.save(update_fields=['active_organization'])
        self.budget = Budget.objects.create(
            organization=self.organization,
            created_by=self.owner,
            name='Monthly Food Budget',
            amount=Decimal('1000.00'),
            period='MONTHLY',
            category='FOOD',
        )

    def test_staff_cannot_delete_budget(self):
        self.client.force_authenticate(user=self.staff)

        response = self.client.delete(
            f'/api/budgets/{self.budget.id}/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Budget.objects.filter(id=self.budget.id).exists())

    def test_owner_can_delete_budget(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(
            f'/api/budgets/{self.budget.id}/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Budget.objects.filter(id=self.budget.id).exists())
