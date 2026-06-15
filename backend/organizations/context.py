"""
Active organization context helpers for multi-org workspace support.
"""
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import OrganizationMember, Invitation


def get_org_id_from_request(request):
    """Read organization id from header or query param."""
    if request is None:
        return None
    org_id = request.headers.get('X-Organization-Id') or request.query_params.get('organization_id')
    if org_id:
        try:
            return int(org_id)
        except (ValueError, TypeError):
            return None
    return None


def get_user_memberships(user):
    """All organization memberships for a user."""
    if not user or not user.is_authenticated:
        return OrganizationMember.objects.none()
    return OrganizationMember.objects.select_related('organization').filter(user=user)


def set_active_organization(user, organization_id):
    """Persist the user's active workspace."""
    member = OrganizationMember.objects.select_related('organization').get(
        user=user,
        organization_id=organization_id,
    )
    if user.active_organization_id != organization_id:
        user.active_organization_id = organization_id
        user.save(update_fields=['active_organization'])
    return member


def get_active_membership(user, request=None):
    """
    Resolve the membership for the user's current workspace.
    Priority: X-Organization-Id header → user.active_organization → first membership.
    """
    if not user or not user.is_authenticated:
        return None

    memberships = get_user_memberships(user)
    if not memberships.exists():
        return None

    org_id = get_org_id_from_request(request)

    if org_id:
        member = memberships.filter(organization_id=org_id).first()
        if member:
            if user.active_organization_id != org_id:
                user.active_organization_id = org_id
                user.save(update_fields=['active_organization'])
            return member

    if user.active_organization_id:
        member = memberships.filter(organization_id=user.active_organization_id).first()
        if member:
            return member
        user.active_organization = None
        user.save(update_fields=['active_organization'])

    member = memberships.first()
    if member:
        user.active_organization = member.organization
        user.save(update_fields=['active_organization'])
    return member


def require_active_membership(user, request=None):
    """Return active membership or raise ValidationError."""
    member = get_active_membership(user, request)
    if not member:
        raise ValidationError('You are not a member of any organization. Create or join one first.')
    return member


def require_owner_membership(user, request=None):
    """Return active membership if user is OWNER in the active org."""
    member = require_active_membership(user, request)
    if member.role != 'OWNER':
        raise PermissionDenied('Only owners can perform this action in the active organization.')
    return member


def build_workspace_payload(user, request=None):
    """Serialize memberships + active org for API responses."""
    memberships = get_user_memberships(user)
    active_member = get_active_membership(user, request)

    membership_data = [
        {
            'id': m.id,
            'organization_id': m.organization_id,
            'organization_name': m.organization.name,
            'role': m.role,
            'joined_at': m.joined_at,
        }
        for m in memberships
    ]

    active_org = None
    role = None
    if active_member:
        active_org = {
            'id': active_member.organization_id,
            'name': active_member.organization.name,
        }
        role = active_member.role

    return {
        'memberships': membership_data,
        'active_organization': active_org,
        'role': role,
    }


def accept_invitation_for_user(user, token):
    """
    Accept a pending invitation for the given user.
    Returns the new OrganizationMember.
    """
    try:
        invitation = Invitation.objects.select_related('organization').get(token=token)
    except Invitation.DoesNotExist:
        raise ValidationError('Invalid invitation token')

    if invitation.status != 'PENDING':
        raise ValidationError('Invitation is no longer valid')

    if invitation.expires_at < timezone.now():
        invitation.status = 'EXPIRED'
        invitation.save(update_fields=['status'])
        raise ValidationError('Invitation has expired')

    if user.email.lower() != invitation.email.lower():
        raise ValidationError('This invitation was sent to a different email address')

    if OrganizationMember.objects.filter(
        organization=invitation.organization,
        user=user,
    ).exists():
        raise ValidationError('You are already a member of this organization')

    if OrganizationMember.objects.filter(user=user).exists():
        raise ValidationError('You already belong to an organization for this MVP')

    member = OrganizationMember.objects.create(
        organization=invitation.organization,
        user=user,
        role=invitation.role,
    )
    invitation.status = 'ACCEPTED'
    invitation.is_used = True
    invitation.save(update_fields=['status', 'is_used'])
    set_active_organization(user, invitation.organization_id)
    return member
