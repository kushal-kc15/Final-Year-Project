from rest_framework import serializers
from .models import Budget, BudgetAlert


class BudgetSerializer(serializers.ModelSerializer):
    spent_amount = serializers.SerializerMethodField()
    percentage_used = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'organization', 'name', 'amount', 'period', 'category',
            'alert_threshold', 'start_date', 'end_date', 'is_active',
            'created_by', 'created_at', 'updated_at',
            'spent_amount', 'percentage_used', 'remaining_amount'
        ]
        read_only_fields = ['id', 'organization', 'created_by', 'created_at', 'updated_at']
    
    def get_spent_amount(self, obj):
        from expenses.models import Expense
        from django.utils import timezone
        from datetime import timedelta
        
        # Calculate date range based on period
        today = timezone.now().date()
        
        if obj.period == 'DAILY':
            start_date = today
            end_date = today
        elif obj.period == 'WEEKLY':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
        elif obj.period == 'MONTHLY':
            start_date = today.replace(day=1)
            # Get last day of month
            if today.month == 12:
                end_date = today.replace(day=31)
            else:
                end_date = (today.replace(month=today.month + 1, day=1) - timedelta(days=1))
        elif obj.period == 'YEARLY':
            start_date = today.replace(month=1, day=1)
            end_date = today.replace(month=12, day=31)
        else:
            start_date = obj.start_date
            end_date = obj.end_date or today
        
        # Filter expenses
        expenses = Expense.objects.filter(
            organization=obj.organization,
            status='APPROVED',
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Filter by category if not ALL
        if obj.category != 'ALL':
            expenses = expenses.filter(category=obj.category)
        
        total = sum(float(exp.amount) for exp in expenses)
        return total
    
    def get_percentage_used(self, obj):
        spent = self.get_spent_amount(obj)
        if float(obj.amount) > 0:
            return round((spent / float(obj.amount)) * 100, 1)
        return 0
    
    def get_remaining_amount(self, obj):
        spent = self.get_spent_amount(obj)
        return float(obj.amount) - spent


class BudgetAlertSerializer(serializers.ModelSerializer):
    budget_name = serializers.CharField(source='budget.name', read_only=True)
    
    class Meta:
        model = BudgetAlert
        fields = [
            'id', 'budget', 'budget_name', 'alert_type', 'percentage',
            'amount_spent', 'message', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
