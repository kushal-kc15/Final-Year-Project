from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'user', 'user_details', 'title', 'amount', 'category', 'vendor',
            'date', 'description', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_details', 'status', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'business_name': obj.user.business_name
        }
