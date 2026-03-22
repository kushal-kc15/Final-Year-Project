from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'category', 'date', 'status', 'user', 'created_at']
    list_filter = ['status', 'category', 'date']
    search_fields = ['title', 'description']
    date_hierarchy = 'date'
