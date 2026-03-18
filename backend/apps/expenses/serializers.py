from decimal import Decimal

from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model with custom validation."""

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'amount', 'category', 'date',
            'description', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        """Ensure amount is a positive decimal."""
        if value <= Decimal('0'):
            raise serializers.ValidationError("Amount must be a positive number.")
        return value

    def validate_category(self, value):
        """Ensure category is one of the predefined choices."""
        valid_categories = [choice[0] for choice in Expense.CATEGORY_CHOICES]
        if value not in valid_categories:
            raise serializers.ValidationError(
                f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        return value
