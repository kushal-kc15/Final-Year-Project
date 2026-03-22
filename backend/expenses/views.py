from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'date']
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']
    
    def get_queryset(self):
        """
        Return expenses based on user role:
        - OWNER/MANAGER: All organization expenses
        - STAFF: Only their own expenses
        """
        user = self.request.user
        
        # Get user's role
        from organizations.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user).first()
        
        if member and member.role in ['OWNER', 'MANAGER']:
            # OWNER/MANAGER can see all organization expenses
            return Expense.objects.filter(organization=member.organization)
        else:
            # STAFF can only see their own expenses
            return Expense.objects.filter(user=user)
    
    def perform_create(self, serializer):
        # Get user's role in their organization
        user = self.request.user
        
        # Find user's organization membership
        from organizations.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user).first()
        
        # Set status based on role
        if member and member.role == 'STAFF':
            # Staff expenses need approval
            serializer.save(
                user=user,
                organization=member.organization,
                status='PENDING'
            )
        else:
            # Owner/Manager expenses are auto-approved
            if member:
                serializer.save(
                    user=user,
                    organization=member.organization,
                    status='APPROVED'
                )
            else:
                # User without organization (shouldn't happen, but handle it)
                serializer.save(user=user, status='APPROVED')
    
    @action(detail=False, methods=['get'])
    def dashboard_metrics(self, request):
        """
        Calculate dashboard metrics:
        - OWNER/MANAGER: Organization-wide metrics
        - STAFF: Personal metrics only
        """
        user = request.user
        today = timezone.now().date()
        
        # Get user's role
        from organizations.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user).first()
        
        # Determine which expenses to include
        if member and member.role in ['OWNER', 'MANAGER']:
            # OWNER/MANAGER see all organization expenses (only APPROVED)
            base_filter = Q(organization=member.organization, status='APPROVED')
        else:
            # STAFF see only their own expenses
            base_filter = Q(user=user)
        
        # Today's metrics
        today_expenses = Expense.objects.filter(
            base_filter,
            date=today
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        # Yesterday's metrics for comparison
        yesterday = today - timedelta(days=1)
        yesterday_expenses = Expense.objects.filter(
            base_filter,
            date=yesterday
        ).aggregate(
            total=Sum('amount')
        )
        
        # This week's metrics
        week_start = today - timedelta(days=today.weekday())
        week_expenses = Expense.objects.filter(
            base_filter,
            date__gte=week_start,
            date__lte=today
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        # Last week's metrics for comparison
        last_week_start = week_start - timedelta(days=7)
        last_week_end = week_start - timedelta(days=1)
        last_week_expenses = Expense.objects.filter(
            base_filter,
            date__gte=last_week_start,
            date__lte=last_week_end
        ).aggregate(
            total=Sum('amount')
        )
        
        # This month's metrics
        month_start = today.replace(day=1)
        month_expenses = Expense.objects.filter(
            base_filter,
            date__gte=month_start,
            date__lte=today
        ).aggregate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        # Last month's metrics for comparison
        last_month_end = month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        last_month_expenses = Expense.objects.filter(
            base_filter,
            date__gte=last_month_start,
            date__lte=last_month_end
        ).aggregate(
            total=Sum('amount')
        )
        
        # Calculate growth percentages
        def calculate_growth(current, previous):
            if previous and previous > 0:
                return round(((current - previous) / previous) * 100, 1)
            return 0
        
        today_total = float(today_expenses['total'] or 0)
        yesterday_total = float(yesterday_expenses['total'] or 0)
        week_total = float(week_expenses['total'] or 0)
        last_week_total = float(last_week_expenses['total'] or 0)
        month_total = float(month_expenses['total'] or 0)
        last_month_total = float(last_month_expenses['total'] or 0)
        
        return Response({
            'today': {
                'total': today_total,
                'count': today_expenses['count'] or 0,
                'growth': calculate_growth(today_total, yesterday_total)
            },
            'week': {
                'total': week_total,
                'count': week_expenses['count'] or 0,
                'growth': calculate_growth(week_total, last_week_total)
            },
            'month': {
                'total': month_total,
                'count': month_expenses['count'] or 0,
                'growth': calculate_growth(month_total, last_month_total)
            }
        })
    
    @action(detail=False, methods=['get'])
    def my_expenses(self, request):
        """Get current user's expenses with status breakdown"""
        user = request.user
        
        # Get all user's expenses
        expenses = self.get_queryset()
        
        # Count by status
        pending_count = expenses.filter(status='PENDING').count()
        approved_count = expenses.filter(status='APPROVED').count()
        rejected_count = expenses.filter(status='REJECTED').count()
        
        # Calculate totals
        pending_total = expenses.filter(status='PENDING').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        approved_total = expenses.filter(status='APPROVED').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'pending': {
                'count': pending_count,
                'total': float(pending_total)
            },
            'approved': {
                'count': approved_count,
                'total': float(approved_total)
            },
            'rejected': {
                'count': rejected_count
            },
            'total_count': expenses.count()
        })
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get all pending expenses in the organization for approval (OWNER/MANAGER only)"""
        user = request.user
        
        # Get user's role
        from organizations.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user).first()
        
        if not member or member.role not in ['OWNER', 'MANAGER']:
            return Response(
                {'error': 'Only owners and managers can view pending approvals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all pending expenses in the organization (excluding own expenses)
        pending_expenses = Expense.objects.filter(
            organization=member.organization,
            status='PENDING'
        ).exclude(user=user).order_by('-date', '-created_at')
        
        serializer = self.get_serializer(pending_expenses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending expense (OWNER/MANAGER only)"""
        user = request.user
        
        # Get user's role
        from organizations.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user).first()
        
        if not member or member.role not in ['OWNER', 'MANAGER']:
            return Response(
                {'error': 'Only owners and managers can approve expenses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get expense from organization (not filtered by user)
        try:
            expense = Expense.objects.get(pk=pk, organization=member.organization)
        except Expense.DoesNotExist:
            return Response(
                {'error': 'Expense not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent self-approval
        if expense.user == user:
            return Response(
                {'error': 'You cannot approve your own expenses'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expense is pending
        if expense.status != 'PENDING':
            return Response(
                {'error': 'Only pending expenses can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the expense
        expense.status = 'APPROVED'
        expense.save()
        
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending expense with reason (OWNER/MANAGER only)"""
        user = request.user
        rejection_reason = request.data.get('reason', '')
        
        # Get user's role
        from organizations.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user).first()
        
        if not member or member.role not in ['OWNER', 'MANAGER']:
            return Response(
                {'error': 'Only owners and managers can reject expenses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get expense from organization (not filtered by user)
        try:
            expense = Expense.objects.get(pk=pk, organization=member.organization)
        except Expense.DoesNotExist:
            return Response(
                {'error': 'Expense not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Prevent self-rejection
        if expense.user == user:
            return Response(
                {'error': 'You cannot reject your own expenses'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expense is pending
        if expense.status != 'PENDING':
            return Response(
                {'error': 'Only pending expenses can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reject the expense
        expense.status = 'REJECTED'
        # Note: We'll add rejection_reason field to model later if needed
        # For now, just change status
        expense.save()
        
        serializer = self.get_serializer(expense)
        return Response(serializer.data)
