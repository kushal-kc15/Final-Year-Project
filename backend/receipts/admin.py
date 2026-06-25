from django.contrib import admin

from .models import Receipt


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = [
        'expense',
        'organization',
        'user',
        'vendor_name',
        'total_amount',
        'status',
        'receipt_date',
        'created_at',
    ]
    list_filter = ['status', 'organization', 'category', 'receipt_date', 'created_at']
    search_fields = [
        'vendor_name',
        'user__username',
        'user__email',
        'organization__name',
        'error_message',
    ]
    readonly_fields = [
        'raw_text',
        'line_items',
        'ocr_validation_warnings',
        'error_message',
        'ocr_provider',
        'ocr_model',
        'vendor_confidence',
        'amount_confidence',
        'date_confidence',
        'created_at',
        'updated_at',
        'processed_at',
    ]
