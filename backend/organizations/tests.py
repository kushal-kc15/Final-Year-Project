from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import Organization, OrganizationMember, Invitation

User = get_user_model()


class OrganizationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_organization(self):
        data = {
            'name': 'Test Organization',
            'description': 'Test description'
        }
        response = self.client.post('/api/organizations/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check if user is automatically added as OWNER
        org = Organization.objects.get(name='Test Organization')
        member = OrganizationMember.objects.get(organization=org, user=self.user)
        self.assertEqual(member.role, 'OWNER')
    
    def test_invite_member(self):
        # Create organization
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(
            organization=org,
            user=self.user,
            role='OWNER'
        )
        
        # Send invitation
        data = {
            'email': 'newmember@example.com',
            'role': 'STAFF'
        }
        response = self.client.post(f'/api/organizations/{org.id}/invite/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check invitation was created
        invitation = Invitation.objects.get(email='newmember@example.com')
        self.assertEqual(invitation.organization, org)
        self.assertEqual(invitation.role, 'STAFF')
    
    def test_accept_invitation(self):
        # Create organization and invitation
        org = Organization.objects.create(name='Test Org')
        owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='pass123'
        )
        OrganizationMember.objects.create(
            organization=org,
            user=owner,
            role='OWNER'
        )
        
        invitation = Invitation.objects.create(
            organization=org,
            email='test@example.com',
            role='STAFF',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Accept invitation
        data = {'token': str(invitation.token)}
        response = self.client.post('/api/invitations/accept/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check membership was created
        member = OrganizationMember.objects.get(organization=org, user=self.user)
        self.assertEqual(member.role, 'STAFF')
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'ACCEPTED')
        self.assertTrue(invitation.is_used)

    def test_staff_cannot_invite_member(self):
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='STAFF')

        response = self.client.post(
            f'/api/organizations/{org.id}/invite/',
            {'email': 'newmember@example.com', 'role': 'STAFF'},
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Invitation.objects.filter(email='newmember@example.com').exists())

    def test_invite_existing_standalone_user_uses_in_app_delivery_mode(self):
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='OWNER')
        standalone = User.objects.create_user(
            username='standalone',
            email='standalone@example.com',
            password='testpass123',
        )

        response = self.client.post(
            f'/api/organizations/{org.id}/invite/',
            {'email': standalone.email, 'role': 'STAFF'},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['recipient_exists'])
        self.assertEqual(response.data['delivery_mode'], 'IN_APP_LINKAGE')

    def test_standalone_user_can_poll_pending_invitations(self):
        org = Organization.objects.create(name='Test Org')
        owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='pass123',
        )
        OrganizationMember.objects.create(organization=org, user=owner, role='OWNER')
        invitation = Invitation.objects.create(
            organization=org,
            email=self.user.email,
            role='STAFF',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.get('/api/invitations/pending/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], invitation.id)

    def test_member_cannot_poll_pending_invitations(self):
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='STAFF')

        response = self.client.get('/api/invitations/pending/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_second_organization_is_rejected(self):
        org1 = Organization.objects.create(name='First Org')
        OrganizationMember.objects.create(organization=org1, user=self.user, role='OWNER')

        data = {'name': 'Second Org', 'description': 'Another workspace'}
        response = self.client.post('/api/organizations/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(OrganizationMember.objects.filter(user=self.user).count(), 1)
        self.user.refresh_from_db()
        self.assertIsNone(self.user.active_organization)
