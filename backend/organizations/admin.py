from django.contrib import admin

from .models import Invitation, Organization, OrganizationMember


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'contact_email', 'created_at']
    search_fields = ['name', 'legal_name', 'tax_id', 'contact_email']
    list_filter = ['industry', 'created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ['organization', 'user', 'role', 'joined_at']
    search_fields = ['user__username', 'user__email', 'organization__name']
    list_filter = ['role', 'organization']
    readonly_fields = ['joined_at']


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'organization', 'role', 'status', 'is_used', 'expires_at', 'created_at']
    search_fields = ['email', 'organization__name']
    list_filter = ['status', 'role', 'organization', 'is_used']
    readonly_fields = ['token', 'created_at']
