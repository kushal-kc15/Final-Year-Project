from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Budget, BudgetAlert
from .serializers import BudgetSerializer, BudgetAlertSerializer


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
        
        # Only OWNER/MANAGER can create budgets
        if not member or member.role not in ['OWNER', 'MANAGER']:
            raise PermissionError('Only owners and managers can create budgets')
        
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
        
        # Only OWNER/MANAGER can update budgets
        if not member or member.role not in ['OWNER', 'MANAGER']:
            raise PermissionError('Only owners and managers can update budgets')
        
        serializer.save()
        
        # Check if budget needs alert after update
        self.check_budget_alerts(serializer.instance)
    
    def check_budget_alerts(self, budget):
        """Check if budget has crossed threshold and create alerts"""
        serializer = BudgetSerializer(budget)
        percentage_used = serializer.data['percentage_used']
        spent_amount = serializer.data['spent_amount']
        
        # Check if threshold reached
        if percentage_used >= budget.alert_threshold:
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
                    message=f"Budget '{budget.name}' has reached {percentage_used}% of its limit (रू {spent_amount} of रू {budget.amount})"
                )
        
        # Check if budget exceeded
        if percentage_used > 100:
            # Check if exceeded alert already exists
            existing_exceeded = BudgetAlert.objects.filter(
                budget=budget,
                alert_type='EXCEEDED'
            ).exists()
            
            if not existing_exceeded:
                BudgetAlert.objects.create(
                    budget=budget,
                    alert_type='EXCEEDED',
                    percentage=int(percentage_used),
                    amount_spent=spent_amount,
                    message=f"Budget '{budget.name}' has been exceeded! Spent रू {spent_amount} of रू {budget.amount} ({percentage_used}%)"
                )
    
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
