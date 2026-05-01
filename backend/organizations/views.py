from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import Organization, OrganizationMember, Invitation
from .serializers import (
    OrganizationSerializer,
    OrganizationMemberSerializer,
    InvitationSerializer
)
from .emails import send_invitation_email


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return organizations where user is a member
        return Organization.objects.filter(
            members__user=self.request.user
        ).distinct()
    
    def perform_create(self, serializer):
        # Check if user already belongs to an organization (ONE ORG RULE)
        existing_membership = OrganizationMember.objects.filter(user=self.request.user).first()
        if existing_membership:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f'You are already a member of {existing_membership.organization.name}. Users can only belong to one organization.')
        
        # Create organization and add creator as OWNER
        organization = serializer.save()
        OrganizationMember.objects.create(
            organization=organization,
            user=self.request.user,
            role='OWNER'
        )
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of an organization"""
        organization = self.get_object()
        members = organization.members.all()
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        """Create an invitation to join the organization"""
        organization = self.get_object()
        
        # Check if user is OWNER
        member = OrganizationMember.objects.filter(
            organization=organization,
            user=request.user
        ).first()
        
        if not member or member.role != 'OWNER':
            return Response(
                {'error': 'Only owners can invite members'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        role = request.data.get('role', 'STAFF')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists in organization
        existing_member = OrganizationMember.objects.filter(
            organization=organization,
            user__email=email
        ).exists()
        
        if existing_member:
            return Response(
                {'error': 'User is already a member'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for pending invitation
        pending_invitation = Invitation.objects.filter(
            organization=organization,
            email=email,
            status='PENDING'
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
    
    def get_queryset(self):
        # Return invitations for organizations where user is OWNER
        return Invitation.objects.filter(
            organization__members__user=self.request.user,
            organization__members__role='OWNER'
        ).distinct()
    
    @action(detail=True, methods=['delete'])
    def cancel(self, request, pk=None):
        """Cancel a pending invitation"""
        try:
            invitation = self.get_object()
        except Invitation.DoesNotExist:
            return Response(
                {'error': 'Invitation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission (OWNER only)
        member = OrganizationMember.objects.filter(
            organization=invitation.organization,
            user=request.user,
            role='OWNER'
        ).first()
        
        if not member:
            return Response(
                {'error': 'Only owners can cancel invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
        try:
            invitation = self.get_object()
        except Invitation.DoesNotExist:
            return Response(
                {'error': 'Invitation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has permission (OWNER only)
        member = OrganizationMember.objects.filter(
            organization=invitation.organization,
            user=request.user,
            role='OWNER'
        ).first()
        
        if not member:
            return Response(
                {'error': 'Only owners can resend invitations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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
    
    @action(detail=False, methods=['post'])
    def accept(self, request):
        """Accept an invitation using the token"""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invitation = Invitation.objects.get(token=token)
        except Invitation.DoesNotExist:
            return Response(
                {'error': 'Invalid invitation token'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if invitation is still valid
        if invitation.status != 'PENDING':
            return Response(
                {'error': 'Invitation is no longer valid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if invitation.expires_at < timezone.now():
            invitation.status = 'EXPIRED'
            invitation.save()
            return Response(
                {'error': 'Invitation has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user email matches invitation
        if request.user.email != invitation.email:
            return Response(
                {'error': 'This invitation is for a different email address'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user already belongs to ANY organization (ONE ORG RULE)
        existing_membership = OrganizationMember.objects.filter(user=request.user).first()
        if existing_membership:
            return Response(
                {'error': f'You are already a member of {existing_membership.organization.name}. Users can only belong to one organization.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a member of THIS organization
        existing_member = OrganizationMember.objects.filter(
            organization=invitation.organization,
            user=request.user
        ).exists()
        
        if existing_member:
            return Response(
                {'error': 'You are already a member of this organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership
        member = OrganizationMember.objects.create(
            organization=invitation.organization,
            user=request.user,
            role=invitation.role
        )
        
        # Update invitation status
        invitation.status = 'ACCEPTED'
        invitation.save()
        
        serializer = OrganizationMemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
