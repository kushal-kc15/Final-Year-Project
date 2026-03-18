import json
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User
from apps.expenses.models import Expense


class ExpensePropertyTests(TestCase):
    """Property-based unit tests for expense management."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testowner',
            password='testpassword123',
            business_name='Test Business',
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('expense-list')

    # --- Property 6: Decimal Amount Precision ---
    def test_decimal_precision_small(self):
        """Verify small decimal amounts are stored precisely."""
        self._assert_amount_precision(Decimal('0.01'))

    def test_decimal_precision_large(self):
        """Verify large decimal amounts are stored precisely."""
        self._assert_amount_precision(Decimal('999999.99'))

    def test_decimal_precision_typical(self):
        """Verify typical business amounts are stored precisely."""
        self._assert_amount_precision(Decimal('150.75'))

    def _assert_amount_precision(self, amount):
        data = {
            'title': 'Precision Test',
            'amount': str(amount),
            'category': 'OTHER',
            'date': '2024-01-01',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['amount']), amount)

    # --- Property 7: Category Validation ---
    def test_valid_categories_accepted(self):
        """All predefined categories should be accepted."""
        for cat_code, _ in Expense.CATEGORY_CHOICES:
            data = {
                'title': f'Test {cat_code}',
                'amount': '100.00',
                'category': cat_code,
                'date': '2024-01-01',
            }
            response = self.client.post(self.url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Category {cat_code} was rejected")

    def test_invalid_category_rejected(self):
        """Invalid category values should be rejected with 400."""
        for bad in ['INVALID', 'food', '', 'TRAVEL', '123']:
            data = {
                'title': 'Bad Category',
                'amount': '100.00',
                'category': bad,
                'date': '2024-01-01',
            }
            response = self.client.post(self.url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, f"Category '{bad}' was accepted")

    # --- Property 8: CRUD Operations Completeness ---
    def test_crud_operations(self):
        """Full create → read → update → delete cycle."""
        # Create
        data = {'title': 'CRUD Test', 'amount': '200.00', 'category': 'RENT', 'date': '2024-03-01'}
        resp = self.client.post(self.url, data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        expense_id = resp.data['id']

        # Read
        resp = self.client.get(f'{self.url}{expense_id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['title'], 'CRUD Test')

        # Update
        resp = self.client.put(f'{self.url}{expense_id}/', {
            'title': 'Updated CRUD', 'amount': '300.00', 'category': 'SALARY', 'date': '2024-03-02'
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['title'], 'Updated CRUD')

        # Delete
        resp = self.client.delete(f'{self.url}{expense_id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    # --- Property 4: User Data Isolation ---
    def test_user_data_isolation(self):
        """User A should never see User B's expenses."""
        other_user = User.objects.create_user(username='otheruser', password='otherpass123')
        Expense.objects.create(
            user=other_user,
            title='Hidden Expense',
            amount=Decimal('500.00'),
            category='RENT',
            date='2024-02-01',
        )
        # self.user sees 0 records
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)

    # --- Property 3: Authentication Requirement Enforcement ---
    def test_authentication_enforcement(self):
        """Unauthenticated requests to protected endpoints should get 401."""
        anon_client = APIClient()
        response = anon_client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Property 14: Data Validation Enforcement ---
    def test_missing_required_fields(self):
        """Missing mandatory fields should return 400 with descriptive errors."""
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_amount_rejected(self):
        """Negative amounts should be rejected."""
        data = {'title': 'Negative', 'amount': '-10.00', 'category': 'OTHER', 'date': '2024-01-01'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_zero_amount_rejected(self):
        """Zero amounts should be rejected."""
        data = {'title': 'Zero', 'amount': '0.00', 'category': 'OTHER', 'date': '2024-01-01'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
