from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, TruncDay
from datetime import datetime, timedelta
from expenses.models import Expense
from organizations.models import OrganizationMember


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spending_trends(request):
    """
    Get spending trends over time with configurable period (daily, weekly, monthly)
    """
    user = request.user
    period = request.query_params.get('period', 'daily')  # daily, weekly, monthly
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Get user's organization and role
    try:
        member = OrganizationMember.objects.get(user=user)
        organization = member.organization
        role = member.role
    except OrganizationMember.DoesNotExist:
        return Response({'error': 'User not part of any organization'}, status=400)
    
    # Base queryset
    if role in ['OWNER', 'MANAGER']:
        expenses = Expense.objects.filter(
            organization=organization,
            status='APPROVED'
        )
    else:
        expenses = Expense.objects.filter(user=user)
    
    # Apply date filters
    if start_date:
        expenses = expenses.filter(date__gte=start_date)
    if end_date:
        expenses = expenses.filter(date__lte=end_date)
    
    # Group by period
    if period == 'daily':
        trunc_func = TruncDay
    elif period == 'weekly':
        trunc_func = TruncWeek
    else:  # monthly
        trunc_func = TruncMonth
    
    trends = expenses.annotate(
        period=trunc_func('date')
    ).values('period').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('period')
    
    return Response({
        'period': period,
        'trends': list(trends)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_breakdown(request):
    """
    Get spending breakdown by category
    """
    user = request.user
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Get user's organization and role
    try:
        member = OrganizationMember.objects.get(user=user)
        organization = member.organization
        role = member.role
    except OrganizationMember.DoesNotExist:
        return Response({'error': 'User not part of any organization'}, status=400)
    
    # Base queryset
    if role in ['OWNER', 'MANAGER']:
        expenses = Expense.objects.filter(
            organization=organization,
            status='APPROVED'
        )
    else:
        expenses = Expense.objects.filter(user=user)
    
    # Apply date filters
    if start_date:
        expenses = expenses.filter(date__gte=start_date)
    if end_date:
        expenses = expenses.filter(date__lte=end_date)
    
    # Group by category
    breakdown = expenses.values('category').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')
    
    # Calculate total for percentages
    total_amount = expenses.aggregate(total=Sum('amount'))['total'] or 0
    
    # Add percentage to each category
    breakdown_list = list(breakdown)
    for item in breakdown_list:
        if total_amount > 0:
            item['percentage'] = round((item['total'] / total_amount) * 100, 2)
        else:
            item['percentage'] = 0
    
    return Response({
        'breakdown': breakdown_list,
        'total_amount': total_amount
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def period_comparison(request):
    """
    Compare spending between two periods (current vs previous)
    """
    user = request.user
    period_type = request.query_params.get('period_type', 'month')  # week, month, year
    
    # Get user's organization and role
    try:
        member = OrganizationMember.objects.get(user=user)
        organization = member.organization
        role = member.role
    except OrganizationMember.DoesNotExist:
        return Response({'error': 'User not part of any organization'}, status=400)
    
    # Calculate date ranges
    today = datetime.now().date()
    
    if period_type == 'day':
        current_start = today
        current_end = today
        previous_start = today - timedelta(days=1)
        previous_end = today - timedelta(days=1)
    elif period_type == 'week':
        current_start = today - timedelta(days=today.weekday())
        current_end = today
        previous_start = current_start - timedelta(days=7)
        previous_end = current_start - timedelta(days=1)
    elif period_type == 'year':
        current_start = today.replace(month=1, day=1)
        current_end = today
        previous_start = current_start.replace(year=current_start.year - 1)
        previous_end = current_start - timedelta(days=1)
    else:  # month
        current_start = today.replace(day=1)
        current_end = today
        if current_start.month == 1:
            previous_start = current_start.replace(year=current_start.year - 1, month=12)
        else:
            previous_start = current_start.replace(month=current_start.month - 1)
        previous_end = current_start - timedelta(days=1)
    
    # Base queryset
    if role in ['OWNER', 'MANAGER']:
        base_expenses = Expense.objects.filter(
            organization=organization,
            status='APPROVED'
        )
    else:
        base_expenses = Expense.objects.filter(user=user)
    
    # Current period
    current_expenses = base_expenses.filter(
        date__gte=current_start,
        date__lte=current_end
    )
    current_total = current_expenses.aggregate(total=Sum('amount'))['total'] or 0
    current_count = current_expenses.count()
    
    # Previous period
    previous_expenses = base_expenses.filter(
        date__gte=previous_start,
        date__lte=previous_end
    )
    previous_total = previous_expenses.aggregate(total=Sum('amount'))['total'] or 0
    previous_count = previous_expenses.count()
    
    # Calculate change
    if previous_total > 0:
        change_percentage = round(((current_total - previous_total) / previous_total) * 100, 2)
    else:
        change_percentage = 0 if current_total == 0 else 100
    
    return Response({
        'period_type': period_type,
        'current_period': {
            'start': current_start,
            'end': current_end,
            'total': current_total,
            'count': current_count
        },
        'previous_period': {
            'start': previous_start,
            'end': previous_end,
            'total': previous_total,
            'count': previous_count
        },
        'change_percentage': change_percentage
    })
