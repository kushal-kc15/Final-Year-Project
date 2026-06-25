from django.contrib import admin

from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'organization',
        'user',
        'amount',
        'category',
        'status',
        'date',
        'reviewed_by',
        'reviewed_at',
    ]
    list_filter = [
        'status',
        'category',
        'organization',
        'date',
        'reviewed_at',
    ]
    search_fields = [
        'title',
        'description',
        'vendor',
        'user__username',
        'user__email',
        'organization__name',
    ]
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at', 'reviewed_by', 'reviewed_at']
