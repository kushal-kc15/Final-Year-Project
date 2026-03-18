from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import User


class AuthenticationTests(TestCase):
    """Tests for Properties 1, 2, 3: Token generation, refresh, and auth enforcement."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.user = User.objects.create_user(
            username='business_owner',
            password='securepassword123',
            business_name='My Shop',
        )

    # --- Property 1: Authentication Token Generation ---
    def test_login_returns_access_and_refresh(self):
        """Valid credentials should return both access and refresh tokens in JSON."""
        response = self.client.post(self.login_url, {
            'username': 'business_owner',
            'password': 'securepassword123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_password(self):
        """Wrong password should return 401."""
        response = self.client.post(self.login_url, {
            'username': 'business_owner',
            'password': 'wrongpassword',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        """Non-existent user should return 401."""
        response = self.client.post(self.login_url, {
            'username': 'nobody',
            'password': 'anything',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Property 2: Token Refresh Functionality ---
    def test_refresh_returns_new_access_token(self):
        """A valid refresh token should return a new access token."""
        login_resp = self.client.post(self.login_url, {
            'username': 'business_owner',
            'password': 'securepassword123',
        }, format='json')
        refresh_token = login_resp.data['refresh']

        refresh_resp = self.client.post(self.refresh_url, {
            'refresh': refresh_token,
        }, format='json')
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_resp.data)

    def test_refresh_with_invalid_token(self):
        """An invalid refresh token should return 401."""
        response = self.client.post(self.refresh_url, {
            'refresh': 'invalidtoken123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserRegistrationTests(TestCase):
    """Tests for user registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user_register')

    def test_register_creates_user(self):
        """Valid registration data should create a user and return 201."""
        response = self.client.post(self.register_url, {
            'username': 'new_owner',
            'email': 'owner@test.com',
            'password': 'strongpass123',
            'password_confirm': 'strongpass123',
            'business_name': 'New Shop',
            'phone_number': '9841234567',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'new_owner')
        self.assertTrue(User.objects.filter(username='new_owner').exists())

    def test_register_password_mismatch(self):
        """Mismatched passwords should return 400."""
        response = self.client.post(self.register_url, {
            'username': 'new_owner',
            'password': 'strongpass123',
            'password_confirm': 'differentpass',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        """Duplicate username should return 400."""
        User.objects.create_user(username='existing', password='testpass123')
        response = self.client.post(self.register_url, {
            'username': 'existing',
            'password': 'strongpass123',
            'password_confirm': 'strongpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserModelTests(TestCase):
    """Property 5: Expense Record Completeness (User Association)"""

    def test_user_str_with_business(self):
        user = User.objects.create_user(username='test', password='pass', business_name='My Biz')
        self.assertEqual(str(user), 'test (My Biz)')

    def test_user_str_without_business(self):
        user = User.objects.create_user(username='test', password='pass')
        self.assertEqual(str(user), 'test')
