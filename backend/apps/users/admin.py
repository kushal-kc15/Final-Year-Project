from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""

    list_display = ('username', 'email', 'business_name', 'phone_number', 'is_staff')
    search_fields = ('username', 'email', 'business_name')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Info', {'fields': ('business_name', 'phone_number')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Business Info', {'fields': ('business_name', 'phone_number')}),
    )
