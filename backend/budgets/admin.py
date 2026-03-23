from django.contrib import admin
from .models import Budget, BudgetAlert


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'amount', 'period', 'category', 'is_active', 'created_at']
    list_filter = ['period', 'category', 'is_active', 'created_at']
    search_fields = ['name', 'organization__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'name', 'amount', 'period', 'category')
        }),
        ('Alert Settings', {
            'fields': ('alert_threshold', 'is_active')
        }),
        ('Date Range (Optional)', {
            'fields': ('start_date', 'end_date'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BudgetAlert)
class BudgetAlertAdmin(admin.ModelAdmin):
    list_display = ['budget', 'alert_type', 'percentage', 'amount_spent', 'is_read', 'created_at']
    list_filter = ['alert_type', 'is_read', 'created_at']
    search_fields = ['budget__name', 'message']
    readonly_fields = ['created_at']
