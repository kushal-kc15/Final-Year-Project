import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Expense
from .serializers import ExpenseSerializer
from .analytics import ExpenseAnalytics
from .filters import ExpenseFilter

logger = logging.getLogger(__name__)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing expenses with analytics endpoints.
    Ensures users can only access their own expense records.
    
    Supports filtering by:
    - date_from, date_to: Date range
    - min_amount, max_amount: Amount range
    - category: One or more categories
    - search: Text search in title and description
    - ordering: Sort by date, amount, created_at, or title
    """

    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ExpenseFilter
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'amount', 'created_at', 'title']
    ordering = ['-date']  # Default ordering

    def get_queryset(self):
        """Return only the authenticated user's expenses."""
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate the expense with the authenticated user."""
        logger.info(f"User {self.request.user.id} creating expense: {serializer.validated_data.get('title')}")
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Log expense update."""
        logger.info(f"User {self.request.user.id} updating expense {serializer.instance.id}")
        serializer.save()

    def perform_destroy(self, instance):
        """Log expense deletion."""
        logger.info(f"User {self.request.user.id} deleting expense {instance.id}")
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard summary data."""
        analytics = ExpenseAnalytics(request.user)
        summary = analytics.get_dashboard_summary()
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly expense summary."""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if year:
            try:
                year = int(year)
            except ValueError:
                return Response(
                    {'error': 'Invalid year parameter'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if month:
            try:
                month = int(month)
                if month < 1 or month > 12:
                    raise ValueError
            except ValueError:
                return Response(
                    {'error': 'Invalid month parameter (1-12)'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        analytics = ExpenseAnalytics(request.user)
        summary = analytics.get_monthly_summary(year, month)
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def category_analytics(self, request):
        """Get category-wise analytics."""
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
            if days < 1:
                raise ValueError
        except ValueError:
            return Response(
                {'error': 'Invalid days parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analytics = ExpenseAnalytics(request.user)
        data = analytics.get_category_analytics(days)
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def spending_trends(self, request):
        """Get spending trends over time."""
        days = request.query_params.get('days', 90)
        try:
            days = int(days)
            if days < 1:
                raise ValueError
        except ValueError:
            return Response(
                {'error': 'Invalid days parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analytics = ExpenseAnalytics(request.user)
        trends = analytics.get_spending_trends(days)
        return Response(trends)
    
    @action(detail=False, methods=['get'])
    def top_expenses(self, request):
        """Get top expenses by amount."""
        limit = request.query_params.get('limit', 10)
        days = request.query_params.get('days', 30)
        
        try:
            limit = int(limit)
            days = int(days)
            if limit < 1 or days < 1:
                raise ValueError
        except ValueError:
            return Response(
                {'error': 'Invalid limit or days parameter'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        analytics = ExpenseAnalytics(request.user)
        top_expenses = analytics.get_top_expenses(limit, days)
        return Response({'expenses': top_expenses})
