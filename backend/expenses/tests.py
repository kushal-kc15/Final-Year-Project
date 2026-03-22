from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from .models import Expense

User = get_user_model()


class ExpenseDashboardMetricsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test expenses
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Today's expenses
        Expense.objects.create(
            user=self.user,
            title='Lunch',
            amount=Decimal('500.00'),
            category='FOOD',
            date=today
        )
        Expense.objects.create(
            user=self.user,
            title='Taxi',
            amount=Decimal('300.00'),
            category='TRANSPORT',
            date=today
        )
        
        # Yesterday's expense
        Expense.objects.create(
            user=self.user,
            title='Office supplies',
            amount=Decimal('1000.00'),
            category='OFFICE',
            date=yesterday
        )
    
    def test_dashboard_metrics_endpoint(self):
        response = self.client.get('/api/expenses/dashboard_metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertIn('today', data)
        self.assertIn('week', data)
        self.assertIn('month', data)
    
    def test_today_metrics(self):
        response = self.client.get('/api/expenses/dashboard_metrics/')
        data = response.json()
        
        self.assertEqual(data['today']['total'], 800.0)
        self.assertEqual(data['today']['count'], 2)

    
    def test_expense_list_endpoint(self):
        response = self.client.get('/api/expenses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.json())
    
    def test_expense_filtering_by_category(self):
        response = self.client.get('/api/expenses/?category=FOOD')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        for expense in data['results']:
            self.assertEqual(expense['category'], 'FOOD')
    
    def test_expense_search(self):
        response = self.client.get('/api/expenses/?search=Lunch')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(len(data['results']) > 0)
    
    def test_expense_pagination(self):
        # Create more expenses
        for i in range(25):
            Expense.objects.create(
                user=self.user,
                title=f'Test Expense {i}',
                amount=Decimal('100.00'),
                category='OTHER',
                date=date.today()
            )
        
        response = self.client.get('/api/expenses/')
        data = response.json()
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('results', data)
        self.assertLessEqual(len(data['results']), 20)

    
    def test_create_expense(self):
        data = {
            'title': 'New Test Expense',
            'amount': '500.00',
            'category': 'FOOD',
            'date': date.today().isoformat(),
            'description': 'Test description'
        }
        response = self.client.post('/api/expenses/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['title'], 'New Test Expense')
    
    def test_create_expense_validation(self):
        # Test with invalid amount
        data = {
            'title': 'Invalid Expense',
            'amount': '-100.00',
            'category': 'FOOD',
            'date': date.today().isoformat()
        }
        response = self.client.post('/api/expenses/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
