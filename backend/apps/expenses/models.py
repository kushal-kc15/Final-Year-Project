from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models

User = get_user_model()


class Expense(models.Model):
    """Financial expense record for a business owner."""

    CATEGORY_CHOICES = [
        ('FOOD', 'Food'),
        ('RENT', 'Rent'),
        ('SALARY', 'Salary'),
        ('SUPPLIES', 'Supplies'),
        ('OTHER', 'Other'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses',
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Amount in local currency",
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='OTHER',
    )
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses_expense'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['user', 'category']),
        ]

    def clean(self):
        """Validate that the amount is positive."""
        if self.amount is not None and self.amount <= Decimal('0'):
            raise ValidationError({'amount': 'Amount must be a positive number.'})

    def __str__(self):
        return f"{self.title} - {self.amount} ({self.category})"
