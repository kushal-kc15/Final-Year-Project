from django.contrib import admin
from .models import Receipt


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['id', 'vendor_name', 'total_amount', 'receipt_date', 'status', 'user', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['vendor_name', 'raw_text', 'user__username']
    readonly_fields = ['created_at', 'updated_at', 'processed_at']
