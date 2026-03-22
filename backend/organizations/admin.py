from django.contrib import admin
from .models import Organization, OrganizationMember, Invitation


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization', 'role', 'joined_at']
    list_filter = ['role', 'organization']
    search_fields = ['user__username', 'organization__name']


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'organization', 'role', 'status', 'created_at', 'expires_at']
    list_filter = ['status', 'role']
    search_fields = ['email', 'organization__name']
