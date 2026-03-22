from django.db import models
from django.conf import settings
import uuid


class Organization(models.Model):
    """
    Organization model for multi-user business management.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """
    Membership model linking users to organizations with roles.
    """
    ROLE_CHOICES = [
        ('OWNER', 'Owner'),
        ('MANAGER', 'Manager'),
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
        unique_together = ['organization', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.organization.name} ({self.role})"


class Invitation(models.Model):
    """
    Invitation model for inviting users to join an organization.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('EXPIRED', 'Expired'),
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
    
    def __str__(self):
        return f"Invitation to {self.email} for {self.organization.name}"
