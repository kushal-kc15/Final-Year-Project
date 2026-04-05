from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['action_type', 'user', 'organization', 'timestamp']
    list_filter = ['action_type', 'organization', 'timestamp']
    search_fields = ['description', 'user__username', 'user__email']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def has_add_permission(self, request):
        # Activity logs should only be created programmatically
        return False
    
    def has_change_permission(self, request, obj=None):
        # Activity logs should not be edited
        return False
