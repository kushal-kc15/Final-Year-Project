from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from activity_logs.models import ActivityLog
from budgets.models import Budget
from expenses.models import Expense
from notifications.models import Notification
from organizations.models import Invitation, Organization, OrganizationMember
from receipts.models import Receipt

User = get_user_model()


class MultiTenantAccessTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.owner_a = User.objects.create_user(
            username='owner_a',
            email='owner-a@example.com',
            password='StrongPass123!',
            email_verified=True,
        )
        self.owner_b = User.objects.create_user(
            username='owner_b',
            email='owner-b@example.com',
            password='StrongPass123!',
            email_verified=True,
        )
        self.org_a = Organization.objects.create(name='Org A')
        self.org_b = Organization.objects.create(name='Org B')
        OrganizationMember.objects.create(user=self.owner_a, organization=self.org_a, role='OWNER')
        OrganizationMember.objects.create(user=self.owner_b, organization=self.org_b, role='OWNER')
        self.owner_a.active_organization = self.org_a
        self.owner_a.save(update_fields=['active_organization'])

        self.other_expense = Expense.objects.create(
            organization=self.org_b,
            user=self.owner_b,
            title='Other org expense',
            amount=Decimal('123.45'),
            category='OTHER',
            date=date.today(),
            status='PENDING',
        )
        self.other_budget = Budget.objects.create(
            organization=self.org_b,
            name='Other org budget',
            amount=Decimal('1000.00'),
            period='MONTHLY',
            category='OTHER',
            start_date=date.today().replace(day=1),
            end_date=date.today() + timedelta(days=30),
            created_by=self.owner_b,
        )
        self.other_receipt = Receipt.objects.create(
            organization=self.org_b,
            user=self.owner_b,
            image='receipts/test-other.jpg',
            status='COMPLETED',
        )
        self.other_invitation = Invitation.objects.create(
            organization=self.org_b,
            email='invitee@example.com',
            role='STAFF',
            invited_by=self.owner_b,
            expires_at=timezone.now() + timedelta(days=7),
        )
        self.other_notification = Notification.objects.create(
            user=self.owner_b,
            organization=self.org_b,
            notification_type='SYSTEM',
            title='Other org notification',
            message='Private notification',
        )
        self.other_log = ActivityLog.objects.create(
            organization=self.org_b,
            user=self.owner_b,
            action_type='EXPENSE_CREATED',
            description='Other org activity',
        )

        self.client.force_authenticate(self.owner_a)

    def assert_not_found(self, response):
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_expense_detail_and_actions_do_not_cross_org_boundary(self):
        list_response = self.client.get('/api/expenses/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.other_expense.id, ids)

        self.assert_not_found(self.client.get(f'/api/expenses/{self.other_expense.id}/'))
        self.assert_not_found(self.client.patch(
            f'/api/expenses/{self.other_expense.id}/',
            {'title': 'Leaked update'},
            format='json',
        ))
        self.assert_not_found(self.client.delete(f'/api/expenses/{self.other_expense.id}/'))
        self.assert_not_found(self.client.post(f'/api/expenses/{self.other_expense.id}/approve/'))
        self.assert_not_found(self.client.post(
            f'/api/expenses/{self.other_expense.id}/reject/',
            {'reason': 'Nope'},
            format='json',
        ))

    def test_budget_detail_and_alerts_do_not_cross_org_boundary(self):
        list_response = self.client.get('/api/budgets/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.other_budget.id, ids)

        self.assert_not_found(self.client.get(f'/api/budgets/{self.other_budget.id}/'))
        self.assert_not_found(self.client.patch(
            f'/api/budgets/{self.other_budget.id}/',
            {'name': 'Leaked budget'},
            format='json',
        ))
        self.assert_not_found(self.client.delete(f'/api/budgets/{self.other_budget.id}/'))

    def test_receipt_detail_and_actions_do_not_cross_org_boundary(self):
        list_response = self.client.get('/api/receipts/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.other_receipt.id, ids)

        self.assert_not_found(self.client.get(f'/api/receipts/{self.other_receipt.id}/'))
        self.assert_not_found(self.client.post(
            f'/api/receipts/{self.other_receipt.id}/verify/',
            {'vendor_name': 'Leaked vendor'},
            format='json',
        ))
        self.assert_not_found(self.client.post(f'/api/receipts/{self.other_receipt.id}/create_expense/'))

    def test_invitation_detail_and_owner_actions_do_not_cross_org_boundary(self):
        list_response = self.client.get('/api/invitations/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.other_invitation.id, ids)

        self.assert_not_found(self.client.get(f'/api/invitations/{self.other_invitation.id}/'))
        self.assert_not_found(self.client.post(f'/api/invitations/{self.other_invitation.id}/cancel/'))
        self.assert_not_found(self.client.post(f'/api/invitations/{self.other_invitation.id}/resend/'))

    def test_notifications_are_scoped_to_authenticated_user(self):
        list_response = self.client.get('/api/notifications/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.other_notification.id, ids)

        self.assert_not_found(self.client.get(f'/api/notifications/{self.other_notification.id}/'))
        self.assert_not_found(self.client.post(f'/api/notifications/{self.other_notification.id}/mark_read/'))

    def test_activity_logs_are_scoped_to_active_organization(self):
        list_response = self.client.get('/api/activity-logs/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in list_response.data['results']]
        self.assertNotIn(self.other_log.id, ids)

        self.assert_not_found(self.client.get(f'/api/activity-logs/{self.other_log.id}/'))
