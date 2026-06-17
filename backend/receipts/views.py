from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from organizations.context import get_active_membership
from .models import Receipt
from .serializers import ReceiptSerializer, ReceiptUploadSerializer, ReceiptVerifySerializer
from .tasks import enqueue_receipt_ocr, PUBLIC_OCR_ERROR
from expenses.serializers import ExpenseSerializer

import logging

logger = logging.getLogger(__name__)


class ReceiptViewSet(viewsets.ModelViewSet):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Receipt.objects.all().select_related('user', 'organization', 'expense')

        member = get_active_membership(self.request.user, self.request)
        if member:
            queryset = Receipt.objects.filter(
                organization=member.organization
            ).select_related('user', 'organization', 'expense')
            if member.role == 'OWNER':
                return queryset
            return queryset.filter(user=self.request.user)
        return Receipt.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Upload receipt image and process with OCR
        """
        user = request.user
        
        member = get_active_membership(user, request)
        if not member:
            return Response(
                {'error': 'User is not part of any organization. Select or join a workspace first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        organization = member.organization
        
        # Validate image upload
        serializer = ReceiptUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create receipt record
        receipt = Receipt.objects.create(
            organization=organization,
            user=user,
            image=serializer.validated_data['image'],
            status='PROCESSING'
        )

        try:
            queue_mode = enqueue_receipt_ocr(receipt.id)
            receipt.refresh_from_db()
        except Exception:
            logger.exception(
                'Receipt OCR enqueue failed',
                extra={
                    'receipt_id': receipt.id,
                    'organization_id': organization.id,
                    'user_id': user.id,
                },
            )
            receipt.status = 'FAILED'
            receipt.error_message = PUBLIC_OCR_ERROR
            receipt.save(update_fields=['status', 'error_message', 'updated_at'])
            return Response(
                {
                    'error': 'OCR processing failed',
                    'message': PUBLIC_OCR_ERROR,
                    'receipt_id': receipt.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        output_serializer = ReceiptSerializer(receipt)
        response_status = status.HTTP_201_CREATED if receipt.status == 'COMPLETED' else status.HTTP_202_ACCEPTED
        response_data = output_serializer.data
        response_data['queue_mode'] = queue_mode
        return Response(response_data, status=response_status)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify and correct OCR extracted data
        """
        receipt = self.get_object()
        serializer = ReceiptVerifySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Update with verified data
        if 'vendor_name' in data:
            receipt.vendor_name = data['vendor_name']
            receipt.vendor_confidence = 100
        
        if 'total_amount' in data:
            receipt.total_amount = data['total_amount']
            receipt.amount_confidence = 100
        
        if 'receipt_date' in data:
            receipt.receipt_date = data['receipt_date']
            receipt.date_confidence = 100
        
        if 'category' in data:
            receipt.category = data['category']
        
        if 'description' in data:
            receipt.description = data['description']
        
        if 'line_items' in data:
            receipt.line_items = data['line_items']
        
        receipt.status = 'VERIFIED'
        receipt.ocr_validation_warnings = []
        receipt.save()
        
        serializer = self.get_serializer(receipt)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_expense(self, request, pk=None):
        """
        Create an expense from verified receipt data
        """
        from activity_logs.utils import log_activity
        
        user = request.user
        
        member = get_active_membership(user, request)
        if not member:
            return Response(
                {'error': 'User is not part of any organization. Select or join a workspace first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        organization = member.organization

        with transaction.atomic():
            try:
                receipt = self.get_queryset().select_for_update().get(pk=pk)
            except Receipt.DoesNotExist:
                return Response(
                    {'detail': 'Not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if expense already exists
            if receipt.expense_id:
                return Response(
                    {'error': 'Expense already created for this receipt'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if receipt.status != 'VERIFIED':
                return Response(
                    {'error': 'Verify this receipt before creating an expense.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not receipt.total_amount or not receipt.receipt_date:
                return Response(
                    {'error': 'Verified receipt is missing amount or date.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create expense from receipt data
            expense_data = {
                'title': request.data.get('title', f'Receipt from {receipt.vendor_name or "Unknown"}'),
                'amount': request.data.get('amount', receipt.total_amount),
                'category': request.data.get('category', receipt.category or 'OTHER'),
                'vendor': request.data.get('vendor', receipt.vendor_name),
                'date': request.data.get('date', receipt.receipt_date),
                'description': request.data.get('description', receipt.description or 'Auto-created from receipt OCR'),
            }

            expense_serializer = ExpenseSerializer(data=expense_data)
            expense_serializer.is_valid(raise_exception=True)
            
            # Determine status based on role
            expense_status = 'PENDING' if member.role == 'STAFF' else 'APPROVED'
            
            expense = expense_serializer.save(
                organization=organization,
                user=user,
                status=expense_status,
            )
            
            # Link receipt to expense
            receipt.expense = expense
            receipt.save(update_fields=['expense', 'updated_at'])
            
            # Log activity
            log_activity(
                organization=organization,
                user=user,
                action_type='EXPENSE_CREATED',
                description=f'{user.username} created expense from receipt: {expense.title}',
                metadata={'expense_id': expense.id, 'receipt_id': receipt.id}
            )
        
        return Response({
            'message': 'Expense created successfully',
            'expense_id': expense.id,
            'receipt_id': receipt.id
        }, status=status.HTTP_201_CREATED)
