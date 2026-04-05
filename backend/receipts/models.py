from django.db import models
from django.conf import settings
from organizations.models import Organization


class Receipt(models.Model):
    """
    Model for storing uploaded receipt images and OCR extraction results
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Processing'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('VERIFIED', 'Verified'),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='receipts'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='receipts'
    )
    
    # File storage
    image = models.ImageField(upload_to='receipts/%Y/%m/')
    
    # OCR extracted data
    vendor_name = models.CharField(max_length=255, blank=True, null=True)
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    receipt_date = models.DateField(blank=True, null=True)
    
    # Raw OCR text
    raw_text = models.TextField(blank=True)
    
    # Confidence scores (0-100)
    vendor_confidence = models.IntegerField(default=0)
    amount_confidence = models.IntegerField(default=0)
    date_confidence = models.IntegerField(default=0)
    
    # Line items (JSON array)
    line_items = models.JSONField(default=list, blank=True)
    
    # Processing status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    error_message = models.TextField(blank=True)
    
    # Linked expense (if created)
    expense = models.OneToOneField(
        'expenses.Expense',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='receipt'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'receipts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Receipt {self.id} - {self.vendor_name or 'Unknown'} - {self.user.username}"
