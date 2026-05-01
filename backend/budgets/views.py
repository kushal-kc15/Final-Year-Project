from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Budget, BudgetAlert
from .serializers import BudgetSerializer, BudgetAlertSerializer
from .emails import send_budget_alert_email
from notifications.utils import notify_budget_alert, notify_budget_exceeded


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return budgets for user's organization"""
        user = self.request.user
        from organizations.models import OrganizationMember
        
        member = OrganizationMember.objects.filter(user=user).first()
        if member:
            return Budget.objects.filter(organization=member.organization)
        return Budget.objects.none()
    
    def perform_create(self, serializer):
        """Create budget and associate with user's organization"""
        user = self.request.user
        from organizations.models import OrganizationMember
        
        member = OrganizationMember.objects.filter(user=user).first()
        
        # Only OWNER can create budgets
        if not member or member.role != 'OWNER':
            raise PermissionError('Only owners can create budgets')
        
        serializer.save(
            organization=member.organization,
            created_by=user
        )
        
        # Check if budget needs alert
        self.check_budget_alerts(serializer.instance)
    
    def perform_update(self, serializer):
        """Update budget"""
        user = self.request.user
        from organizations.models import OrganizationMember
        
        member = OrganizationMember.objects.filter(user=user).first()
        
        # Only OWNER can update budgets
        if not member or member.role != 'OWNER':
            raise PermissionError('Only owners can update budgets')
        
        serializer.save()
        
        # Check if budget needs alert after update
        self.check_budget_alerts(serializer.instance)
    
    def check_budget_alerts(self, budget):
        """Check if budget has crossed threshold and create alerts"""
        serializer = BudgetSerializer(budget)
        percentage_used = serializer.data['percentage_used']
        spent_amount = serializer.data['spent_amount']
        
        # Check if budget exceeded
        if percentage_used > 100:
            # Check if exceeded alert already exists
            existing_exceeded = BudgetAlert.objects.filter(
                budget=budget,
                alert_type='EXCEEDED'
            ).exists()
            
            if not existing_exceeded:
                # Create alert
                BudgetAlert.objects.create(
                    budget=budget,
                    alert_type='EXCEEDED',
                    percentage=int(percentage_used),
                    amount_spent=spent_amount,
                    message=f"Budget '{budget.name}' has been exceeded! Spent {spent_amount} of {budget.amount} ({percentage_used}%)"
                )
                
                # Send email to owners
                from organizations.models import OrganizationMember
                recipients = OrganizationMember.objects.filter(
                    organization=budget.organization,
                    role='OWNER'
                ).values_list('user__email', flat=True)
                
                if recipients:
                    send_budget_alert_email(budget, spent_amount, list(recipients))
                
                # Create in-app notifications
                owners = OrganizationMember.objects.filter(
                    organization=budget.organization,
                    role='OWNER'
                )
                for owner in owners:
                    notify_budget_exceeded(owner.user, budget, spent_amount, percentage_used)
        
        # Check if threshold reached (warning before exceeding)
        elif percentage_used >= budget.alert_threshold:
            # Check if alert already exists for this threshold
            existing_alert = BudgetAlert.objects.filter(
                budget=budget,
                alert_type='THRESHOLD',
                percentage=budget.alert_threshold
            ).exists()
            
            if not existing_alert:
                BudgetAlert.objects.create(
                    budget=budget,
                    alert_type='THRESHOLD',
                    percentage=int(percentage_used),
                    amount_spent=spent_amount,
                    message=f"Budget '{budget.name}' has reached {percentage_used}% of its limit ({spent_amount} of {budget.amount})"
                )
                
                # Create in-app notifications for threshold
                from organizations.models import OrganizationMember
                owners = OrganizationMember.objects.filter(
                    organization=budget.organization,
                    role='OWNER'
                )
                for owner in owners:
                    notify_budget_alert(owner.user, budget, spent_amount, percentage_used)
    
    @action(detail=False, methods=['post'])
    def check_all_alerts(self, request):
        """Manually trigger alert check for all active budgets (OWNER only)"""
        user = request.user
        from organizations.models import OrganizationMember
        
        member = OrganizationMember.objects.filter(user=user).first()
        
        # Only OWNER can trigger this
        if not member or member.role != 'OWNER':
            return Response(
                {'error': 'Only owners can trigger budget alert checks'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all active budgets for this organization
        budgets = Budget.objects.filter(
            organization=member.organization,
            is_active=True
        )
        
        alerts_created = 0
        budgets_checked = 0
        
        for budget in budgets:
            budgets_checked += 1
            before_count = BudgetAlert.objects.filter(budget=budget).count()
            self.check_budget_alerts(budget)
            after_count = BudgetAlert.objects.filter(budget=budget).count()
            alerts_created += (after_count - before_count)
        
        return Response({
            'message': 'Budget alert check completed',
            'budgets_checked': budgets_checked,
            'alerts_created': alerts_created
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get budget summary for dashboard"""
        budgets = self.get_queryset().filter(is_active=True)
        
        total_budgets = budgets.count()
        total_allocated = sum(float(b.amount) for b in budgets)
        
        serializer = self.get_serializer(budgets, many=True)
        total_spent = sum(b['spent_amount'] for b in serializer.data)
        
        # Count budgets by status
        at_risk = sum(1 for b in serializer.data if b['percentage_used'] >= 80 and b['percentage_used'] < 100)
        exceeded = sum(1 for b in serializer.data if b['percentage_used'] >= 100)
        
        return Response({
            'total_budgets': total_budgets,
            'total_allocated': total_allocated,
            'total_spent': total_spent,
            'at_risk_count': at_risk,
            'exceeded_count': exceeded,
            'budgets': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def category_breakdown(self, request):
        """Get spending breakdown by category with budget comparison"""
        from expenses.models import Expense
        from organizations.models import OrganizationMember
        from django.db.models import Sum, Count
        from decimal import Decimal
        
        user = request.user
        member = OrganizationMember.objects.filter(user=user).first()
        
        if not member:
            return Response({'error': 'User not in organization'}, status=400)
        
        # Get all categories
        categories = [
            'FOOD', 'TRANSPORT', 'OFFICE', 'UTILITIES',
            'SALARY', 'RENT', 'MARKETING', 'OTHER'
        ]
        
        category_data = []
        
        for category in categories:
            # Get expenses for this category
            expenses = Expense.objects.filter(
                organization=member.organization,
                category=category,
                status='APPROVED'
            )
            
            spent = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            count = expenses.count()
            
            # Get budget for this category (if exists)
            budget = Budget.objects.filter(
                organization=member.organization,
                category=category,
                is_active=True
            ).first()
            
            category_info = {
                'category': category,
                'spent': float(spent),
                'expense_count': count,
                'has_budget': budget is not None,
            }
            
            if budget:
                serializer = BudgetSerializer(budget)
                category_info['budget'] = {
                    'id': budget.id,
                    'name': budget.name,
                    'amount': float(budget.amount),
                    'percentage_used': serializer.data['percentage_used'],
                    'remaining': serializer.data['remaining_amount']
                }
            
            category_data.append(category_info)
        
        return Response({
            'categories': category_data,
            'total_categories': len(categories),
            'categories_with_budgets': sum(1 for c in category_data if c['has_budget'])
        })


class BudgetAlertViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BudgetAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return alerts for user's organization budgets"""
        user = self.request.user
        from organizations.models import OrganizationMember
        
        member = OrganizationMember.objects.filter(user=user).first()
        if member:
            return BudgetAlert.objects.filter(budget__organization=member.organization)
        return BudgetAlert.objects.none()
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark alert as read"""
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
