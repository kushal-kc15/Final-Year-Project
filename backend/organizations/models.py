from django.db import models
from django.conf import settings
import uuid


class Organization(models.Model):
    """
    Organization model for multi-user business management.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    legal_name = models.CharField(max_length=255, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    contact_email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True, default='Nepal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Membership(models.Model):
    """
    Membership model linking a user to an organization.

    A user can belong to multiple organizations, with a different role in each.
    """
    ROLE_CHOICES = [
        ('OWNER', 'Owner'),
        ('STAFF', 'Staff'),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organization_memberships'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'organization_members'
        ordering = ['-joined_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'organization'], name='unique_user_organization_membership'),
        ]
        indexes = [
            models.Index(fields=['organization', 'role'], name='mem_org_role_idx'),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.organization.name} ({self.role})"


# Backwards-compatible import name for the existing API/view layer.
OrganizationMember = Membership


class Invitation(models.Model):
    """
    Invitation model for inviting users to join an organization.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=10,
        choices=OrganizationMember.ROLE_CHOICES
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    is_used = models.BooleanField(default=False)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'invitations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'status', 'is_used', 'expires_at'], name='inv_email_status_idx'),
            models.Index(fields=['organization', 'status', 'is_used'], name='inv_org_status_idx'),
        ]
    
    def __str__(self):
        return f"Invitation to {self.email} for {self.organization.name}"
