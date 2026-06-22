from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    reviewed_by_details = serializers.SerializerMethodField()
    receipt_id = serializers.SerializerMethodField()
    receipt_url = serializers.SerializerMethodField()
    receipt = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id',
            'user',
            'user_details',
            'title',
            'amount',
            'category',
            'vendor',
            'date',
            'description',
            'status',

            # Decision metadata (read-only)
            'reviewed_by',
            'reviewed_by_details',
            'reviewed_at',
            'rejection_reason',

            # Receipt metadata
            'receipt_id',
            'receipt_url',
            'receipt',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'user_details',
            'status',

            'reviewed_by',
            'reviewed_by_details',
            'reviewed_at',
            'rejection_reason',

            'receipt_id',
            'receipt_url',
            'receipt',
            'created_at',
            'updated_at',
        ]

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'business_name': obj.user.business_name,
        }

    def get_reviewed_by_details(self, obj):
        reviewed_by = getattr(obj, 'reviewed_by', None)
        if not reviewed_by:
            return None
        return {
            'id': reviewed_by.id,
            'username': reviewed_by.username,
            'business_name': getattr(reviewed_by, 'business_name', None),
        }

    def get_receipt_id(self, obj):
        receipt = getattr(obj, 'receipt', None)
        return receipt.id if receipt else None

    def get_receipt_url(self, obj):
        receipt = getattr(obj, 'receipt', None)
        if not receipt or not receipt.image:
            return None

        url = receipt.image.url
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url

    def get_receipt(self, obj):
        return self.get_receipt_url(obj)
