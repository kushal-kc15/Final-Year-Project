from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from organizations.models import OrganizationMember
from .models import Receipt
from .serializers import ReceiptSerializer, ReceiptUploadSerializer
from .ocr_processor import OCRProcessor

import os


class ReceiptViewSet(viewsets.ModelViewSet):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        try:
            member = OrganizationMember.objects.get(user=user)
            return Receipt.objects.filter(organization=member.organization)
        except OrganizationMember.DoesNotExist:
            return Receipt.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Upload receipt image and process with OCR
        """
        user = request.user
        
        # Get user's organization (first one if multiple)
        try:
            member = OrganizationMember.objects.filter(user=user).first()
            if not member:
                return Response(
                    {'error': 'User is not part of any organization'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            organization = member.organization
        except Exception as e:
            return Response(
                {'error': f'Error getting organization: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        
        # Process OCR in background (for now, synchronously)
        try:
            image_path = receipt.image.path
            processor = OCRProcessor(image_path)
            extracted_data = processor.process()
            
            # Update receipt with extracted data
            receipt.raw_text = extracted_data['raw_text']
            receipt.vendor_name = extracted_data['vendor_name']
            receipt.vendor_confidence = extracted_data['vendor_confidence']
            receipt.total_amount = extracted_data['total_amount']
            receipt.amount_confidence = extracted_data['amount_confidence']
            receipt.receipt_date = extracted_data['receipt_date']
            receipt.date_confidence = extracted_data['date_confidence']
            receipt.category = extracted_data.get('category', 'OTHER')
            receipt.description = extracted_data.get('description', '')
            receipt.line_items = extracted_data['line_items']
            receipt.status = 'COMPLETED'
            receipt.processed_at = timezone.now()
            receipt.save()
            
        except Exception as e:
            receipt.status = 'FAILED'
            receipt.error_message = str(e)
            receipt.save()
            return Response(
                {'error': f'OCR processing failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Return processed receipt
        output_serializer = ReceiptSerializer(receipt)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify and correct OCR extracted data
        """
        receipt = self.get_object()
        
        # Update with verified data
        if 'vendor_name' in request.data:
            receipt.vendor_name = request.data['vendor_name']
            receipt.vendor_confidence = 100
        
        if 'total_amount' in request.data:
            receipt.total_amount = request.data['total_amount']
            receipt.amount_confidence = 100
        
        if 'receipt_date' in request.data:
            receipt.receipt_date = request.data['receipt_date']
            receipt.date_confidence = 100
        
        if 'category' in request.data:
            receipt.category = request.data['category']
        
        if 'description' in request.data:
            receipt.description = request.data['description']
        
        if 'line_items' in request.data:
            receipt.line_items = request.data['line_items']
        
        receipt.status = 'VERIFIED'
        receipt.save()
        
        serializer = self.get_serializer(receipt)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def create_expense(self, request, pk=None):
        """
        Create an expense from verified receipt data
        """
        from expenses.models import Expense
        from activity_logs.utils import log_activity
        
        receipt = self.get_object()
        user = request.user
        
        # Get organization
        try:
            member = OrganizationMember.objects.filter(user=user).first()
            if not member:
                return Response(
                    {'error': 'User is not part of any organization'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            organization = member.organization
        except OrganizationMember.DoesNotExist:
            return Response(
                {'error': 'User is not part of any organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if expense already exists
        if receipt.expense:
            return Response(
                {'error': 'Expense already created for this receipt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create expense from receipt data
        expense_data = {
            'title': request.data.get('title', f'Receipt from {receipt.vendor_name or "Unknown"}'),
            'amount': request.data.get('amount', receipt.total_amount),
            'category': request.data.get('category', receipt.category or 'OTHER'),
            'vendor': request.data.get('vendor', receipt.vendor_name),
            'date': request.data.get('date', receipt.receipt_date),
            'description': request.data.get('description', receipt.description or f'Auto-created from receipt OCR'),
        }
        
        # Determine status based on role
        if member.role == 'STAFF':
            expense_data['status'] = 'PENDING'
        else:
            expense_data['status'] = 'APPROVED'
        
        expense = Expense.objects.create(
            organization=organization,
            user=user,
            **expense_data
        )
        
        # Link receipt to expense
        receipt.expense = expense
        receipt.save()
        
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
