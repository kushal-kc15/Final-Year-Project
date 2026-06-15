from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from .models import Organization, OrganizationMember, Invitation
from .serializers import (
    OrganizationSerializer,
    OrganizationMemberSerializer,
    InvitationSerializer
)
from .emails import send_invitation_email
from .permissions import IsInvitationOwner, IsOrganizationOwner
from .context import (
    build_workspace_payload,
    set_active_organization,
    accept_invitation_for_user,
)

User = get_user_model()


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    owner_action_names = {'invite', 'update_member_role', 'remove_member', 'statistics'}

    def get_permissions(self):
        if self.action in self.owner_action_names:
            return [IsAuthenticated(), IsOrganizationOwner()]
        return super().get_permissions()
    
    def get_queryset(self):
        # Return organizations where user is a member
        return Organization.objects.filter(
            members__user=self.request.user
        ).annotate(
            member_count_value=Count('members', distinct=True)
        ).distinct()

    def create(self, request, *args, **kwargs):
        if OrganizationMember.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'You already belong to an organization for this MVP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        organization = serializer.save()
        OrganizationMember.objects.create(
            organization=organization,
            user=self.request.user,
            role='OWNER'
        )
        set_active_organization(self.request.user, organization.id)

    @action(detail=False, methods=['get'])
    def memberships(self, request):
        """List all organizations the user belongs to with roles."""
        return Response(build_workspace_payload(request.user, request))

    @action(detail=True, methods=['post'])
    def switch(self, request, pk=None):
        """Set the active workspace to this organization."""
        organization = self.get_object()
        member = set_active_organization(request.user, organization.id)
        payload = build_workspace_payload(request.user, request)
        payload['message'] = f'Switched to {organization.name}'
        payload['membership_id'] = member.id
        return Response(payload)

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave an organization (self-removal)."""
        organization = self.get_object()
        try:
            member = OrganizationMember.objects.get(
                organization=organization,
                user=request.user,
            )
        except OrganizationMember.DoesNotExist:
            return Response({'error': 'You are not a member of this organization'}, status=status.HTTP_404_NOT_FOUND)

        if member.role == 'OWNER':
            owner_count = OrganizationMember.objects.filter(
                organization=organization,
                role='OWNER',
            ).count()
            if owner_count <= 1:
                return Response(
                    {'error': 'You are the last owner. Transfer ownership or delete the organization before leaving.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        member.delete()

        user = request.user
        if user.active_organization_id == organization.id:
            remaining = OrganizationMember.objects.filter(user=user).select_related('organization').first()
            user.active_organization = remaining.organization if remaining else None
            user.save(update_fields=['active_organization'])

        return Response({
            'message': f'You left {organization.name}',
            **build_workspace_payload(user, request),
        })
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of an organization"""
        organization = self.get_object()
        members = organization.members.select_related('user', 'organization')
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        """Create an invitation to join the organization"""
        organization = self.get_object()

        email = (request.data.get('email') or '').strip().lower()
        role = request.data.get('role', 'STAFF')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate role
        valid_roles = [choice[0] for choice in OrganizationMember.ROLE_CHOICES]
        if role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing_user = User.objects.filter(email__iexact=email).first()

        # Check if user already exists in organization
        existing_member = OrganizationMember.objects.filter(
            organization=organization,
            user__email__iexact=email
        ).exists()
        
        if existing_member:
            return Response(
                {'error': 'User is already a member'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if existing_user and OrganizationMember.objects.filter(user=existing_user).exists():
            return Response(
                {'error': 'This user already belongs to an organization for this MVP.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for pending invitation
        pending_invitation = Invitation.objects.filter(
            organization=organization,
            email__iexact=email,
            status='PENDING',
            is_used=False,
        ).exists()
        
        if pending_invitation:
            return Response(
                {'error': 'Invitation already sent to this email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create invitation
        invitation = Invitation.objects.create(
            organization=organization,
            email=email,
            role=role,
            invited_by=request.user,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Send invitation email
        email_sent = send_invitation_email(invitation, request)
        
        serializer = InvitationSerializer(invitation)
        response_data = serializer.data
        response_data['email_sent'] = email_sent
        response_data['recipient_exists'] = existing_user is not None
        response_data['delivery_mode'] = 'IN_APP_LINKAGE' if existing_user else 'REGISTRATION_LINK'
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def update_member_role(self, request, pk=None):
        """Update a member's role (only OWNER can do this)"""
        organization = self.get_object()
        
        # Check if requester is OWNER
        requester_member = OrganizationMember.objects.filter(
            organization=organization,
            user=request.user,
            role='OWNER'
        ).first()
        
        if not requester_member:
            return Response(
                {'error': 'Only owners can change member roles'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        member_id = request.data.get('member_id')
        new_role = request.data.get('role')
        
        if not member_id or not new_role:
            return Response(
                {'error': 'member_id and role are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate role
        valid_roles = [choice[0] for choice in OrganizationMember.ROLE_CHOICES]
        if new_role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = OrganizationMember.objects.get(
                id=member_id,
                organization=organization
            )
        except OrganizationMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent changing the last OWNER
        if member.role == 'OWNER' and new_role != 'OWNER':
            owner_count = OrganizationMember.objects.filter(
                organization=organization,
                role='OWNER'
            ).count()
            
            if owner_count <= 1:
                return Response(
                    {'error': 'Cannot change the role of the last owner'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update role
        member.role = new_role
        member.save()
        
        serializer = OrganizationMemberSerializer(member)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove a member from organization (only OWNER can do this)"""
        organization = self.get_object()
        
        # Check if requester is OWNER
        requester_member = OrganizationMember.objects.filter(
            organization=organization,
            user=request.user,
            role='OWNER'
        ).first()
        
        if not requester_member:
            return Response(
                {'error': 'Only owners can remove members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {'error': 'member_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = OrganizationMember.objects.get(
                id=member_id,
                organization=organization
            )
        except OrganizationMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent removing the last OWNER
        if member.role == 'OWNER':
            owner_count = OrganizationMember.objects.filter(
                organization=organization,
                role='OWNER'
            ).count()
            
            if owner_count <= 1:
                return Response(
                    {'error': 'Cannot remove the last owner'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Delete member
        member.delete()
        
        return Response(
            {'message': 'Member removed successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get organization statistics"""
        organization = self.get_object()
        
        # Member counts by role
        members = organization.members.all()
        owner_count = members.filter(role='OWNER').count()
        staff_count = members.filter(role='STAFF').count()
        
        # Pending invitations
        pending_invites = Invitation.objects.filter(
            organization=organization,
            status='PENDING'
        ).count()
        
        # Recent activity (last 30 days)
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        recent_members = members.filter(joined_at__gte=thirty_days_ago).count()
        
        return Response({
            'total_members': members.count(),
            'owner_count': owner_count,
            'staff_count': staff_count,
            'pending_invitations': pending_invites,
            'recent_joins': recent_members,
            'organization_name': organization.name,
            'created_at': organization.created_at
        })



class InvitationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {'cancel', 'resend'}:
            return [IsAuthenticated(), IsInvitationOwner()]
        return super().get_permissions()
    
    def get_queryset(self):
        # Return invitations for organizations where user is OWNER
        return Invitation.objects.filter(
            organization__members__user=self.request.user,
            organization__members__role='OWNER'
        ).select_related('organization', 'invited_by').distinct()
    
    @action(detail=True, methods=['delete'])
    def cancel(self, request, pk=None):
        """Cancel a pending invitation"""
        invitation = self.get_object()
        
        # Only allow canceling pending invitations
        if invitation.status != 'PENDING':
            return Response(
                {'error': 'Can only cancel pending invitations'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete the invitation
        invitation.delete()
        
        return Response(
            {'message': 'Invitation cancelled successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        """Resend invitation email"""
        invitation = self.get_object()
        
        # Only allow resending pending invitations
        if invitation.status != 'PENDING':
            return Response(
                {'error': 'Can only resend pending invitations'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if invitation has expired
        if invitation.expires_at < timezone.now():
            # Extend expiration by 7 more days
            invitation.expires_at = timezone.now() + timedelta(days=7)
            invitation.save()
        
        # Resend invitation email
        from .emails import send_invitation_email
        email_sent = send_invitation_email(invitation, request)
        
        return Response(
            {
                'message': 'Invitation resent successfully',
                'email_sent': email_sent,
                'expires_at': invitation.expires_at
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """List pending invitations addressed to a standalone user."""
        if OrganizationMember.objects.filter(user=request.user).exists():
            return Response(
                {'error': 'You already belong to an organization.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending_invites = Invitation.objects.filter(
            email__iexact=request.user.email,
            status='PENDING',
            is_used=False,
            expires_at__gt=timezone.now(),
        ).select_related('organization', 'invited_by')

        serializer = InvitationSerializer(pending_invites, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def accept(self, request):
        """Accept an invitation using the token"""
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        member = accept_invitation_for_user(request.user, token)
        serializer = OrganizationMemberSerializer(member)
        response_data = serializer.data
        response_data.update(build_workspace_payload(request.user, request))
        return Response(response_data, status=status.HTTP_201_CREATED)
