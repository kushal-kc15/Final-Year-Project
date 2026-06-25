from django.contrib import admin

from .models import Budget, BudgetAlert


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'organization',
        'category',
        'amount',
        'period',
        'is_active',
        'start_date',
        'end_date',
        'created_at',
    ]
    list_filter = ['organization', 'category', 'period', 'is_active', 'created_at']
    search_fields = ['name', 'organization__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BudgetAlert)
class BudgetAlertAdmin(admin.ModelAdmin):
    list_display = ['budget', 'alert_type', 'percentage', 'is_read', 'created_at']
    list_filter = ['budget__organization', 'alert_type', 'is_read', 'created_at']
    search_fields = ['budget__name', 'message']
    readonly_fields = ['created_at']
