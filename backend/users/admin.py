from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""
    list_display = ['username', 'email', 'business_name', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'business_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Business Information', {'fields': ('business_name', 'phone_number')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']
