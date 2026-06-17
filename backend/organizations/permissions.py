from rest_framework.permissions import BasePermission

from .models import Invitation, Organization, OrganizationMember


class IsOrganizationOwner(BasePermission):
    """Allow access only to owners of the target organization."""

    message = 'Only owners can perform this action.'

    def has_object_permission(self, request, view, obj):
        if request.user and (request.user.is_staff or request.user.is_superuser):
            return True
        if isinstance(obj, Organization):
            return OrganizationMember.objects.filter(
                organization=obj,
                user=request.user,
                role='OWNER',
            ).exists()
        return False


class IsInvitationOwner(BasePermission):
    """Allow access only to owners of the invitation's organization."""

    message = 'Only owners can manage this invitation.'

    def has_object_permission(self, request, view, obj):
        if request.user and (request.user.is_staff or request.user.is_superuser):
            return True
        if isinstance(obj, Invitation):
            return OrganizationMember.objects.filter(
                organization=obj.organization,
                user=request.user,
                role='OWNER',
            ).exists()
        return False
