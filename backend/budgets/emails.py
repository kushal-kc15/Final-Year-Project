"""
Email utilities for budget alerts
"""
import logging

from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _format_budget_period(budget, date_format):
    if budget.start_date and budget.end_date:
        return f"{budget.start_date.strftime(date_format)} to {budget.end_date.strftime(date_format)}"
    if budget.start_date:
        return f"From {budget.start_date.strftime(date_format)}"
    if budget.end_date:
        return f"Until {budget.end_date.strftime(date_format)}"
    return budget.get_period_display()


def send_budget_alert_email(budget, current_spending, recipients):
    """
    Send budget alert email when budget is exceeded
    
    Args:
        budget: Budget object
        current_spending: Current spending amount
        recipients: List of email addresses
    """
    # Convert to float for calculations
    current_spending = float(current_spending)
    budget_amount = float(budget.amount)
    
    percentage = (current_spending / budget_amount) * 100 if budget_amount > 0 else 0
    over_budget = current_spending - budget_amount
    plain_period = _format_budget_period(budget, '%B %d, %Y')
    html_period = _format_budget_period(budget, '%b %d, %Y')
    
    # Email subject
    subject = f"⚠️ Budget Alert: {budget.category} budget exceeded"
    
    # Email body (plain text)
    message = f"""
Budget Alert!

Your {budget.category} budget has been exceeded.

Budget Details:
- Category: {budget.category}
- Budget Amount: {budget.amount}
- Current Spending: {current_spending}
- Over Budget: {over_budget}
- Percentage Used: {percentage:.1f}%

Period: {plain_period}

Please review your expenses and take necessary action.

---
Vyapar Margadarshan
Expense Management System
    """.strip()
    
    # HTML email body
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #fee2e2; border-top: none; border-radius: 0 0 10px 10px; }}
            .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .stats {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .stat-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
            .stat-row:last-child {{ border-bottom: none; }}
            .stat-label {{ color: #6b7280; font-size: 14px; }}
            .stat-value {{ font-weight: bold; color: #111827; font-size: 14px; }}
            .over-budget {{ color: #ef4444; font-size: 18px; font-weight: bold; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">⚠️ Budget Alert</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your budget has been exceeded</p>
            </div>
            <div class="content">
                <div class="alert-box">
                    <strong>Action Required:</strong> Your <strong>{budget.category}</strong> budget has exceeded the allocated amount.
                </div>
                
                <div class="stats">
                    <div class="stat-row">
                        <span class="stat-label">Category</span>
                        <span class="stat-value">{budget.category}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Budget Amount</span>
                        <span class="stat-value">{budget.amount:,.2f}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Current Spending</span>
                        <span class="stat-value">{current_spending:,.2f}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Over Budget</span>
                        <span class="over-budget">+{over_budget:,.2f}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Percentage Used</span>
                        <span class="stat-value">{percentage:.1f}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Period</span>
                        <span class="stat-value">{html_period}</span>
                    </div>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    Please review your expenses in the <strong>{budget.category}</strong> category and take necessary action to control spending.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management System</p>
                <p>This is an automated alert. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        # Send email to all recipients
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.exception(
            'Failed to send budget alert email',
            extra={'budget_id': budget.id, 'organization_id': budget.organization_id},
        )
        return False
