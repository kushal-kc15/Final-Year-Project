from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

# Admin branding (applies when Django loads this admin module)
admin.site.site_header = "Vyapar Margadarshan Admin"
admin.site.site_title = "Vyapar Admin"
admin.site.index_title = "Website Manager Console"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin (superuser / website manager only intent)"""

    list_display = [
        'username',
        'email',
        'business_name',
        'is_active',
        'is_staff',
        'is_superuser',
        'default_currency',
        'created_at',
        'last_login',
    ]
    list_filter = [
        'is_active',
        'is_staff',
        'is_superuser',
        'default_currency',
        'created_at',
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    fieldsets = list(BaseUserAdmin.fieldsets) + [
        ('Business Information', {'fields': ('business_name', 'phone_number')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    ]

    readonly_fields = ['created_at', 'updated_at']
