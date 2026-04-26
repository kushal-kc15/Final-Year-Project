from rest_framework import serializers
from .models import Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'image', 'vendor_name', 'total_amount', 'receipt_date',
            'category', 'description', 'raw_text', 'vendor_confidence', 
            'amount_confidence', 'date_confidence', 'line_items', 'status', 
            'error_message', 'expense', 'user_name', 'created_at', 'updated_at', 
            'processed_at'
        ]
        read_only_fields = [
            'vendor_name', 'total_amount', 'receipt_date', 'category', 
            'description', 'raw_text', 'vendor_confidence', 'amount_confidence', 
            'date_confidence', 'line_items', 'status', 'error_message', 'processed_at'
        ]


class ReceiptUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ['image']
