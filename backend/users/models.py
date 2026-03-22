from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds business-specific fields for  financial management.
    """
    USER_CHOICES={
        ("owner", "Owner"),
        ('manager', 'Manager'),
        ("staff", "Staff"),
    }
    business_name = models.CharField(
        max_length=255, 
        blank=True,
        help_text="Name of the business/company"
    )
    phone_number = models.CharField(
        max_length=15, 
        blank=True,
        help_text="Contact phone number"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
