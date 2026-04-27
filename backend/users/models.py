from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


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
    
    CURRENCY_CHOICES = [
        ('NPR', 'रू (NPR)'),
        ('USD', '$ (USD)'),
        ('EUR', '€ (EUR)'),
    ]
    
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
    
    # Preferences
    default_currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='NPR',
        help_text="Preferred currency for display"
    )
    items_per_page = models.IntegerField(
        default=10,
        help_text="Number of items to display per page in tables"
    )
    theme_preference = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System')],
        default='system',
        help_text="UI theme preference"
    )
    
    # Security fields
    email_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's email has been verified"
    )
    email_verification_token = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Token for email verification"
    )
    two_factor_enabled = models.BooleanField(
        default=False,
        help_text="Whether 2FA is enabled for this user"
    )
    two_factor_secret = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Secret for 2FA OTP generation"
    )
    failed_login_attempts = models.IntegerField(
        default=0,
        help_text="Number of consecutive failed login attempts"
    )
    account_locked_until = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Account locked until this time due to failed login attempts"
    )
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of last login"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username



class PasswordResetToken(models.Model):
    """
    Model for password reset tokens
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is still valid"""
        return not self.used and timezone.now() < self.expires_at
    
    def __str__(self):
        return f"Reset token for {self.user.username}"


class TwoFactorOTP(models.Model):
    """
    Model for storing 2FA OTP codes
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='two_factor_otps')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'two_factor_otps'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if OTP is still valid"""
        return not self.used and timezone.now() < self.expires_at
    
    def __str__(self):
        return f"2FA OTP for {self.user.username}"
