from django.test import TestCase, override_settings
from django.core import mail
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

    @override_settings(
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
        DEFAULT_FROM_EMAIL='sender@example.com',
    )
    def test_invite_email_is_sent_to_invitation_email(self):
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(
            organization=org,
            user=self.user,
            role='OWNER'
        )

        response = self.client.post(
            f'/api/organizations/{org.id}/invite/',
            {'email': 'Invited@Example.com', 'role': 'STAFF'},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['email_sent'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['invited@example.com'])
        self.assertEqual(mail.outbox[0].from_email, 'sender@example.com')
        self.assertNotIn(self.user.email, mail.outbox[0].to)
        self.assertNotIn('sender@example.com', mail.outbox[0].to)
    
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

    def test_owner_can_cancel_pending_invitation(self):
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='OWNER')
        invitation = Invitation.objects.create(
            organization=org,
            email='newmember@example.com',
            role='STAFF',
            invited_by=self.user,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post(f'/api/invitations/{invitation.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'CANCELLED')
        self.assertFalse(invitation.is_used)

    def test_staff_cannot_cancel_invitation(self):
        org = Organization.objects.create(name='Test Org')
        owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass123')
        OrganizationMember.objects.create(organization=org, user=owner, role='OWNER')
        OrganizationMember.objects.create(organization=org, user=self.user, role='STAFF')
        invitation = Invitation.objects.create(
            organization=org,
            email='newmember@example.com',
            role='STAFF',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post(f'/api/invitations/{invitation.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'PENDING')

    def test_non_member_cannot_cancel_invitation(self):
        org = Organization.objects.create(name='Test Org')
        owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass123')
        OrganizationMember.objects.create(organization=org, user=owner, role='OWNER')
        invitation = Invitation.objects.create(
            organization=org,
            email='newmember@example.com',
            role='STAFF',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post(f'/api/invitations/{invitation.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'PENDING')

    def test_cannot_cancel_accepted_invitation(self):
        org = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='OWNER')
        invitation = Invitation.objects.create(
            organization=org,
            email='newmember@example.com',
            role='STAFF',
            invited_by=self.user,
            status='ACCEPTED',
            is_used=True,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post(f'/api/invitations/{invitation.id}/cancel/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'ACCEPTED')
        self.assertTrue(invitation.is_used)

    def test_cancelled_invitation_cannot_be_accepted(self):
        org = Organization.objects.create(name='Test Org')
        owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass123')
        OrganizationMember.objects.create(organization=org, user=owner, role='OWNER')
        invitation = Invitation.objects.create(
            organization=org,
            email=self.user.email,
            role='STAFF',
            invited_by=owner,
            status='CANCELLED',
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post('/api/invitations/accept/', {'token': str(invitation.token)})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(OrganizationMember.objects.filter(organization=org, user=self.user).exists())
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'CANCELLED')

    def test_recipient_can_check_cancelled_invitation_status(self):
        org = Organization.objects.create(name='Test Org')
        owner = User.objects.create_user(username='owner', email='owner@example.com', password='pass123')
        OrganizationMember.objects.create(organization=org, user=owner, role='OWNER')
        invitation = Invitation.objects.create(
            organization=org,
            email=self.user.email,
            role='STAFF',
            invited_by=owner,
            status='CANCELLED',
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.get(f'/api/invitations/status/?token={invitation.token}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'CANCELLED')
        self.assertNotIn('token', response.data)

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

    def test_user_can_have_two_memberships_with_different_roles(self):
        org_a = Organization.objects.create(name='Owner Org')
        org_b = Organization.objects.create(name='Staff Org')
        owner_membership = OrganizationMember.objects.create(
            organization=org_a,
            user=self.user,
            role='OWNER',
        )
        staff_membership = OrganizationMember.objects.create(
            organization=org_b,
            user=self.user,
            role='STAFF',
        )

        self.assertEqual(OrganizationMember.objects.filter(user=self.user).count(), 2)
        self.assertEqual(owner_membership.role, 'OWNER')
        self.assertEqual(staff_membership.role, 'STAFF')

    def test_user_can_create_second_organization_and_it_becomes_active(self):
        org1 = Organization.objects.create(name='First Org')
        OrganizationMember.objects.create(organization=org1, user=self.user, role='OWNER')
        self.user.active_organization = org1
        self.user.save(update_fields=['active_organization'])

        data = {'name': 'Second Org', 'description': 'Another workspace'}
        response = self.client.post('/api/organizations/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        second_org = Organization.objects.get(name='Second Org')
        self.assertEqual(OrganizationMember.objects.filter(user=self.user).count(), 2)
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=second_org,
                user=self.user,
                role='OWNER',
            ).exists()
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.active_organization_id, second_org.id)

    def test_owner_can_invite_existing_user_from_another_organization(self):
        org = Organization.objects.create(name='Target Org')
        other_org = Organization.objects.create(name='Other Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='OWNER')
        existing_user = User.objects.create_user(
            username='existingmember',
            email='existing-member@example.com',
            password='testpass123',
        )
        OrganizationMember.objects.create(organization=other_org, user=existing_user, role='STAFF')

        response = self.client.post(
            f'/api/organizations/{org.id}/invite/',
            {'email': existing_user.email, 'role': 'STAFF'},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['recipient_exists'])
        self.assertEqual(response.data['delivery_mode'], 'IN_APP_LINKAGE')
        self.assertTrue(Invitation.objects.filter(organization=org, email=existing_user.email).exists())

    def test_owner_cannot_invite_user_already_in_target_organization(self):
        org = Organization.objects.create(name='Target Org')
        OrganizationMember.objects.create(organization=org, user=self.user, role='OWNER')
        existing_user = User.objects.create_user(
            username='targetmember',
            email='target-member@example.com',
            password='testpass123',
        )
        OrganizationMember.objects.create(organization=org, user=existing_user, role='STAFF')

        response = self.client.post(
            f'/api/organizations/{org.id}/invite/',
            {'email': existing_user.email, 'role': 'STAFF'},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'User is already a member')

    def test_existing_user_can_accept_invite_to_second_organization(self):
        current_org = Organization.objects.create(name='Current Org')
        invited_org = Organization.objects.create(name='Invited Org')
        owner = User.objects.create_user(
            username='inviteowner',
            email='invite-owner@example.com',
            password='testpass123',
        )
        OrganizationMember.objects.create(organization=current_org, user=self.user, role='OWNER')
        OrganizationMember.objects.create(organization=invited_org, user=owner, role='OWNER')
        self.user.active_organization = current_org
        self.user.save(update_fields=['active_organization'])
        invitation = Invitation.objects.create(
            organization=invited_org,
            email=self.user.email,
            role='STAFF',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post('/api/invitations/accept/', {'token': str(invitation.token)})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(OrganizationMember.objects.filter(user=self.user).count(), 2)
        self.assertTrue(
            OrganizationMember.objects.filter(
                organization=invited_org,
                user=self.user,
                role='STAFF',
            ).exists()
        )
        self.user.refresh_from_db()
        invitation.refresh_from_db()
        self.assertEqual(self.user.active_organization_id, invited_org.id)
        self.assertEqual(response.data['active_organization']['id'], invited_org.id)
        self.assertEqual(response.data['role'], 'STAFF')
        self.assertEqual(invitation.status, 'ACCEPTED')
        self.assertTrue(invitation.is_used)

    def test_existing_user_cannot_accept_invite_to_organization_they_already_joined(self):
        org = Organization.objects.create(name='Already Joined Org')
        owner = User.objects.create_user(
            username='alreadyowner',
            email='already-owner@example.com',
            password='testpass123',
        )
        OrganizationMember.objects.create(organization=org, user=owner, role='OWNER')
        OrganizationMember.objects.create(organization=org, user=self.user, role='STAFF')
        invitation = Invitation.objects.create(
            organization=org,
            email=self.user.email,
            role='STAFF',
            invited_by=owner,
            expires_at=timezone.now() + timedelta(days=7),
        )

        response = self.client.post('/api/invitations/accept/', {'token': str(invitation.token)})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data[0], 'You are already a member of this organization')
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'PENDING')
        self.assertFalse(invitation.is_used)


class OrganizationOwnerPermissionTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            username='orgowner',
            email='orgowner@example.com',
            password='testpass123',
        )
        self.staff = User.objects.create_user(
            username='orgstaff',
            email='orgstaff@example.com',
            password='testpass123',
        )
        self.organization = Organization.objects.create(name='Original Org')
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
        self.staff.active_organization = self.organization
        self.staff.save(update_fields=['active_organization'])
        self.client.force_authenticate(user=self.staff)

    def test_staff_cannot_update_organization(self):
        response = self.client.patch(
            f'/api/organizations/{self.organization.id}/',
            {'name': 'Renamed Org'},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.organization.refresh_from_db()
        self.assertEqual(self.organization.name, 'Original Org')

    def test_staff_can_list_own_organization_members(self):
        response = self.client.get(
            f'/api/organizations/{self.organization.id}/members/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = {item['user']['email'] for item in response.data}
        self.assertIn(self.owner.email, emails)
        self.assertIn(self.staff.email, emails)

    def test_non_member_cannot_list_organization_members(self):
        outsider = User.objects.create_user(
            username='outsider',
            email='outsider@example.com',
            password='testpass123',
        )
        self.client.force_authenticate(outsider)

        response = self.client.get(
            f'/api/organizations/{self.organization.id}/members/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_cannot_update_member_role(self):
        response = self.client.patch(
            f'/api/organizations/{self.organization.id}/update_member_role/',
            {'member_id': self.staff.organization_memberships.get().id, 'role': 'OWNER'},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.staff.organization_memberships.get().refresh_from_db()
        self.assertEqual(self.staff.organization_memberships.get().role, 'STAFF')

    def test_staff_cannot_remove_members(self):
        response = self.client.delete(
            f'/api/organizations/{self.organization.id}/remove_member/',
            {'member_id': self.owner.organization_memberships.get().id},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(OrganizationMember.objects.filter(organization=self.organization, user=self.owner).exists())

    def test_staff_cannot_delete_organization(self):
        response = self.client.delete(
            f'/api/organizations/{self.organization.id}/',
            HTTP_X_ORGANIZATION_ID=str(self.organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Organization.objects.filter(id=self.organization.id).exists())

    def test_owner_in_one_org_cannot_use_owner_actions_where_they_are_staff(self):
        multi_role_user = User.objects.create_user(
            username='multirole',
            email='multi-role@example.com',
            password='testpass123',
        )
        owner_org = Organization.objects.create(name='Owner Org')
        staff_org = Organization.objects.create(name='Staff Org')
        target_member = User.objects.create_user(
            username='targetstaff',
            email='target-staff@example.com',
            password='testpass123',
        )
        OrganizationMember.objects.create(organization=owner_org, user=multi_role_user, role='OWNER')
        OrganizationMember.objects.create(organization=staff_org, user=multi_role_user, role='STAFF')
        target_membership = OrganizationMember.objects.create(
            organization=staff_org,
            user=target_member,
            role='STAFF',
        )
        multi_role_user.active_organization = owner_org
        multi_role_user.save(update_fields=['active_organization'])
        self.client.force_authenticate(multi_role_user)

        invite_response = self.client.post(
            f'/api/organizations/{staff_org.id}/invite/',
            {'email': 'new-staff@example.com', 'role': 'STAFF'},
            HTTP_X_ORGANIZATION_ID=str(owner_org.id),
        )
        role_response = self.client.patch(
            f'/api/organizations/{staff_org.id}/update_member_role/',
            {'member_id': target_membership.id, 'role': 'OWNER'},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(owner_org.id),
        )
        remove_response = self.client.delete(
            f'/api/organizations/{staff_org.id}/remove_member/',
            {'member_id': target_membership.id},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(owner_org.id),
        )

        self.assertEqual(invite_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(role_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(remove_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(OrganizationMember.objects.filter(id=target_membership.id).exists())
