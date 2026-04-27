"""
Authentication utility functions
"""
import secrets
import string
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings


def generate_otp(length=6):
    """Generate a random OTP code"""
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def generate_token(length=32):
    """Generate a random token for email verification or password reset"""
    return secrets.token_urlsafe(length)


def send_verification_email(user, token):
    """Send email verification link to user"""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    subject = "Verify Your Email - Vyapar Margadarshan"
    
    message = f"""
Hello {user.username},

Thank you for registering with Vyapar Margadarshan!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

---
Vyapar Margadarshan
Expense Management System
    """.strip()
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #3B5BDB 0%, #2845B8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #3B5BDB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">Welcome to Vyapar Margadarshan!</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>Thank you for registering with Vyapar Margadarshan!</p>
                <p>Please verify your email address by clicking the button below:</p>
                <div style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{verification_url}" style="color: #3B5BDB; word-break: break-all;">{verification_url}</a>
                </p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    This link will expire in 24 hours.
                </p>
                <p style="font-size: 14px; color: #6b7280;">
                    If you didn't create this account, please ignore this email.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False


def send_password_reset_email(user, token):
    """Send password reset link to user"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Reset Your Password - Vyapar Margadarshan"
    
    message = f"""
Hello {user.username},

We received a request to reset your password.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

---
Vyapar Margadarshan
Expense Management System
    """.strip()
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #3B5BDB 0%, #2845B8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #3B5BDB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>We received a request to reset your password.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{reset_url}" style="color: #3B5BDB; word-break: break-all;">{reset_url}</a>
                </p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    This link will expire in 1 hour.
                </p>
                <p style="font-size: 14px; color: #ef4444;">
                    If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        return False


def send_2fa_otp_email(user, otp):
    """Send 2FA OTP code to user"""
    subject = "Your Login Code - Vyapar Margadarshan"
    
    message = f"""
Hello {user.username},

Your login verification code is: {otp}

This code will expire in 10 minutes.

If you didn't try to log in, please secure your account immediately.

---
Vyapar Margadarshan
Expense Management System
    """.strip()
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #3B5BDB 0%, #2845B8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; }}
            .otp-code {{ font-size: 32px; font-weight: bold; color: #3B5BDB; text-align: center; letter-spacing: 8px; padding: 20px; background: #f1f5f9; border-radius: 8px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🔐 Login Verification</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{user.username}</strong>,</p>
                <p>Your login verification code is:</p>
                <div class="otp-code">{otp}</div>
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                    This code will expire in 10 minutes.
                </p>
                <p style="font-size: 14px; color: #ef4444; margin-top: 20px;">
                    If you didn't try to log in, please secure your account immediately.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send 2FA OTP email: {e}")
        return False


def check_password_strength(password):
    """
    Check password strength and return score and feedback
    Returns: (score, feedback_list)
    Score: 0-4 (0=very weak, 4=very strong)
    """
    score = 0
    feedback = []
    
    # Length check
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Password should be at least 8 characters long")
    
    if len(password) >= 12:
        score += 1
    
    # Uppercase check
    if any(c.isupper() for c in password):
        score += 1
    else:
        feedback.append("Add at least one uppercase letter")
    
    # Lowercase check
    if any(c.islower() for c in password):
        score += 1
    else:
        feedback.append("Add at least one lowercase letter")
    
    # Number check
    if any(c.isdigit() for c in password):
        score += 1
    else:
        feedback.append("Add at least one number")
    
    # Special character check
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if any(c in special_chars for c in password):
        score += 1
    else:
        feedback.append("Add at least one special character")
    
    # Normalize score to 0-4
    score = min(score, 4)
    
    strength_labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"]
    
    return {
        'score': score,
        'label': strength_labels[score],
        'feedback': feedback
    }
