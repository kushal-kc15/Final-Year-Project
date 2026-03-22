from django.test import TestCase
from django.contrib.auth import get_user_model
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
        
        from django.utils import timezone
        from datetime import timedelta
        
        invitation = Invitation.objects.create(
            organization=org,
            email='test@example.com',
            role='MANAGER',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Accept invitation
        data = {'token': str(invitation.token)}
        response = self.client.post('/api/invitations/accept/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check membership was created
        member = OrganizationMember.objects.get(organization=org, user=self.user)
        self.assertEqual(member.role, 'MANAGER')
