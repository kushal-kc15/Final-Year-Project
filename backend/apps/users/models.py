from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for business owners."""

    business_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Name of the business",
    )
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        help_text="Contact phone number",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.business_name})" if self.business_name else self.username
