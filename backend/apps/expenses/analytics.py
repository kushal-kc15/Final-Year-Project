"""
Expense analytics utilities and calculations
"""

from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.utils import timezone
from .models import Expense


class ExpenseAnalytics:
    """Analytics calculations for expenses"""
    
    def __init__(self, user):
        self.user = user
        self.queryset = Expense.objects.filter(user=user)
    
    def get_monthly_summary(self, year=None, month=None):
        """Get monthly expense summary"""
        if not year:
            year = timezone.now().year
        if not month:
            month = timezone.now().month
            
        monthly_expenses = self.queryset.filter(
            date__year=year,
            date__month=month
        )
        
        total_amount = monthly_expenses.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        total_count = monthly_expenses.count()
        
        category_breakdown = monthly_expenses.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Daily breakdown for the month
        daily_breakdown = monthly_expenses.extra(
            select={'day': 'strftime("%%d", date)'}
        ).values('day').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('day')
        
        return {
            'period': f"{year}-{month:02d}",
            'total_amount': total_amount,
            'total_count': total_count,
            'average_per_expense': total_amount / total_count if total_count > 0 else Decimal('0'),
            'category_breakdown': list(category_breakdown),
            'daily_breakdown': list(daily_breakdown)
        }
    
    def get_category_analytics(self, days=30):
        """Get category-wise analytics for the last N days"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        category_data = self.queryset.filter(
            date__gte=start_date
        ).values('category').annotate(
            total_amount=Sum('amount'),
            count=Count('id'),
            avg_amount=Avg('amount')
        ).order_by('-total_amount')
        
        # Calculate percentages
        total_spent = sum(item['total_amount'] for item in category_data)
        for item in category_data:
            item['percentage'] = (
                (item['total_amount'] / total_spent * 100) 
                if total_spent > 0 else 0
            )
        
        return {
            'period_days': days,
            'total_amount': total_spent,
            'categories': list(category_data)
        }
    
    def get_spending_trends(self, days=90):
        """Get spending trends over time"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Weekly trends
        weekly_data = self.queryset.filter(
            date__gte=start_date
        ).extra(
            select={
                'week': 'strftime("%%Y-%%W", date)'
            }
        ).values('week').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('week')
        
        # Monthly trends (last 12 months)
        monthly_start = timezone.now().date() - timedelta(days=365)
        monthly_data = self.queryset.filter(
            date__gte=monthly_start
        ).extra(
            select={
                'month': 'strftime("%%Y-%%m", date)'
            }
        ).values('month').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('month')
        
        return {
            'weekly_trends': list(weekly_data),
            'monthly_trends': list(monthly_data)
        }
    
    def get_top_expenses(self, limit=10, days=30):
        """Get top expenses by amount"""
        start_date = timezone.now().date() - timedelta(days=days)
        
        top_expenses = self.queryset.filter(
            date__gte=start_date
        ).order_by('-amount')[:limit]
        
        return [
            {
                'id': expense.id,
                'title': expense.title,
                'amount': expense.amount,
                'category': expense.category,
                'date': expense.date,
                'description': expense.description
            }
            for expense in top_expenses
        ]
    
    def get_dashboard_summary(self):
        """Get summary data for dashboard"""
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        
        # This month
        this_month_total = self.queryset.filter(
            date__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Last month
        last_month_total = self.queryset.filter(
            date__gte=last_month_start,
            date__lte=last_month_end
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Today
        today_total = self.queryset.filter(
            date=today
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # This week
        week_start = today - timedelta(days=today.weekday())
        this_week_total = self.queryset.filter(
            date__gte=week_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Calculate growth
        month_growth = 0
        if last_month_total > 0:
            month_growth = ((this_month_total - last_month_total) / last_month_total * 100)
        
        return {
            'today': {
                'total': today_total,
                'count': self.queryset.filter(date=today).count()
            },
            'this_week': {
                'total': this_week_total,
                'count': self.queryset.filter(date__gte=week_start).count()
            },
            'this_month': {
                'total': this_month_total,
                'count': self.queryset.filter(date__gte=this_month_start).count(),
                'growth_percentage': round(month_growth, 2)
            },
            'last_month': {
                'total': last_month_total,
                'count': self.queryset.filter(
                    date__gte=last_month_start,
                    date__lte=last_month_end
                ).count()
            }
        }