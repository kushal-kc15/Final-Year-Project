"""
Email utilities for organization invitations
"""
import logging

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_invitation_email(invitation, request=None):
    """
    Send invitation email to the invited user
    
    Args:
        invitation: Invitation object
        request: HTTP request object (optional, not used - kept for compatibility)
    """
    recipient_email = (invitation.email or '').strip().lower()
    if not recipient_email:
        logger.error(
            'Invitation email has no recipient',
            extra={'invitation_id': invitation.id, 'organization_id': invitation.organization_id},
        )
        return False

    # Always use FRONTEND_URL for invitation links
    base_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:5173'
    
    invitation_url = f"{base_url}/invite?token={invitation.token}"
    
    # Email subject
    subject = f"You've been invited to join {invitation.organization.name}"
    
    # Email body (plain text)
    message = f"""
Hello!

You've been invited to join {invitation.organization.name} on Vyapar Margadarshan.

You will be added as a {invitation.role} member.

Click the link below to accept the invitation:
{invitation_url}

This invitation will expire on {invitation.expires_at.strftime('%B %d, %Y at %I:%M %p')}.

If you don't have an account yet, you'll be able to create one when you click the link.

---
Vyapar Margadarshan
Expense Management Made Simple
    """.strip()
    
    # HTML email body (optional, for better formatting)
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
            .info-box {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">📧 You've Been Invited!</h1>
            </div>
            <div class="content">
                <p>Hello!</p>
                
                <p>You've been invited to join <strong>{invitation.organization.name}</strong> on Vyapar Margadarshan.</p>
                
                <div class="info-box">
                    <strong>Role:</strong> {invitation.role}<br>
                    <strong>Invited by:</strong> {invitation.invited_by.get_full_name() or invitation.invited_by.username}<br>
                    <strong>Expires:</strong> {invitation.expires_at.strftime('%B %d, %Y at %I:%M %p')}
                </div>
                
                <p>Click the button below to accept the invitation:</p>
                
                <div style="text-align: center;">
                    <a href="{invitation_url}" class="button">Accept Invitation</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">
                    Or copy and paste this link into your browser:<br>
                    <a href="{invitation_url}" style="color: #667eea; word-break: break-all;">{invitation_url}</a>
                </p>
                
                <p style="font-size: 14px; color: #6b7280;">
                    If you don't have an account yet, you'll be able to create one when you click the link.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management Made Simple</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.exception(
            'Failed to send invitation email',
            extra={'invitation_id': invitation.id, 'organization_id': invitation.organization_id},
        )
        return False
