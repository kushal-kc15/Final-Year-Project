from rest_framework import serializers
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
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

    def _get_period_date_range(self, period):
        today = timezone.now().date()

        if period == 'DAILY':
            return today, today
        if period == 'WEEKLY':
            start_date = today - timedelta(days=today.weekday())
            return start_date, start_date + timedelta(days=6)
        if period == 'MONTHLY':
            start_date = today.replace(day=1)
            if today.month == 12:
                return start_date, today.replace(day=31)
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            return start_date, end_date
        if period == 'YEARLY':
            return today.replace(month=1, day=1), today.replace(month=12, day=31)
        return None, None

    @classmethod
    def precompute_spent_amounts(cls, budgets):
        """
        Bulk precompute spent_amount for budgets, writing results into
        budget._spent_amount_cache to avoid per-budget Expense aggregates.

        Must preserve the exact semantics of _get_spent_amount:
        - organization_id
        - status='APPROVED'
        - date range derived from (start_date/end_date) or period fallback
        - category filter applied only when budget.category != 'ALL'
        """
        from expenses.models import Expense

        budgets = list(budgets)
        if not budgets:
            return

        today = timezone.now().date()

        def effective_period_range(budget):
            start_date = budget.start_date
            end_date = budget.end_date

            # Match existing fallback behavior from _get_spent_amount
            if not start_date or not end_date:
                ps, pe = cls()._get_period_date_range(budget.period)
                start_date = start_date or ps
                end_date = end_date or pe or timezone.now().date()

            # Final safety fallback consistent with _get_spent_amount
            start_date = start_date or today
            end_date = end_date or today
            return start_date, end_date

        groups = {}
        for budget in budgets:
            start_date, end_date = effective_period_range(budget)
            category_key = None if budget.category == 'ALL' else budget.category
            key = (budget.organization_id, start_date, end_date, category_key)
            groups.setdefault(key, []).append(budget)

        for (org_id, start_date, end_date, category_key), grouped_budgets in groups.items():
            expenses_qs = Expense.objects.filter(
                organization_id=org_id,
                status='APPROVED',
                date__gte=start_date,
                date__lte=end_date,
            )
            if category_key is not None:
                expenses_qs = expenses_qs.filter(category=category_key)

            total = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            total_float = float(total)

            for budget in grouped_budgets:
                budget._spent_amount_cache = total_float

    def validate(self, attrs):
        period = attrs.get('period') or getattr(self.instance, 'period', None)
        has_start_date = 'start_date' in attrs
        has_end_date = 'end_date' in attrs
        period_changed = self.instance is not None and 'period' in attrs and attrs['period'] != self.instance.period

        if self.instance is None and not has_start_date and not has_end_date:
            attrs['start_date'], attrs['end_date'] = self._get_period_date_range(period)
        elif period_changed and not has_start_date and not has_end_date:
            attrs['start_date'], attrs['end_date'] = self._get_period_date_range(period)

        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({'end_date': 'End date must be on or after start date.'})

        return attrs
    
    def _get_spent_amount(self, obj):
        cached_value = getattr(obj, '_spent_amount_cache', None)
        if cached_value is not None:
            return cached_value

        from expenses.models import Expense

        start_date = obj.start_date
        end_date = obj.end_date
        if not start_date or not end_date:
            start_date, end_date = self._get_period_date_range(obj.period)
            start_date = start_date or obj.start_date
            end_date = end_date or obj.end_date or timezone.now().date()
        
        expenses = Expense.objects.filter(
            organization_id=obj.organization_id,
            status='APPROVED',
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Filter by category if not ALL
        if obj.category != 'ALL':
            expenses = expenses.filter(category=obj.category)

        total = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total = float(total)
        obj._spent_amount_cache = total
        return total

    def get_spent_amount(self, obj):
        return self._get_spent_amount(obj)
    
    def get_percentage_used(self, obj):
        spent = self._get_spent_amount(obj)
        if float(obj.amount) > 0:
            return round((spent / float(obj.amount)) * 100, 1)
        return 0
    
    def get_remaining_amount(self, obj):
        spent = self._get_spent_amount(obj)
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
