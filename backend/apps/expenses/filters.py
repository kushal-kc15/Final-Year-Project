"""
Custom filters for expense queries
"""

import django_filters
from django.db.models import Q
from .models import Expense


class ExpenseFilter(django_filters.FilterSet):
    """
    Advanced filtering for expenses with date ranges, amount ranges, and search.
    """
    
    # Date range filters
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte', label='Date from')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte', label='Date to')
    
    # Amount range filters
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte', label='Minimum amount')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte', label='Maximum amount')
    
    # Category filter (exact match or multiple)
    category = django_filters.MultipleChoiceFilter(
        choices=Expense.CATEGORY_CHOICES,
        label='Categories'
    )
    
    # Text search across title and description
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    # Ordering
    ordering = django_filters.OrderingFilter(
        fields=(
            ('date', 'date'),
            ('amount', 'amount'),
            ('created_at', 'created_at'),
            ('title', 'title'),
        ),
        field_labels={
            'date': 'Date',
            'amount': 'Amount',
            'created_at': 'Created date',
            'title': 'Title',
        }
    )
    
    class Meta:
        model = Expense
        fields = ['category', 'date_from', 'date_to', 'min_amount', 'max_amount', 'search']
    
    def filter_search(self, queryset, name, value):
        """
        Search across title and description fields.
        Case-insensitive search.
        """
        if not value:
            return queryset
        
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )