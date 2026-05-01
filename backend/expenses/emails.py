"""
Email utilities for expense notifications
"""
from django.core.mail import send_mail
from django.conf import settings


def send_expense_rejection_email(expense, rejected_by, reason=''):
    """
    Send email notification when an expense is rejected
    
    Args:
        expense: Expense object
        rejected_by: User who rejected the expense
        reason: Optional rejection reason
    """
    recipient_email = expense.user.email
    
    if not recipient_email:
        print(f"No email address for user {expense.user.username}")
        return False
    
    # Email subject
    subject = f"Expense Rejected: {expense.title}"
    
    # Email body (plain text)
    message = f"""
Your expense has been rejected.

Expense Details:
- Title: {expense.title}
- Amount: रू {expense.amount}
- Category: {expense.category}
- Date: {expense.date.strftime('%B %d, %Y')}
- Rejected by: {rejected_by.get_full_name() or rejected_by.username}
"""
    
    if reason:
        message += f"\nRejection Reason:\n{reason}\n"
    
    message += """
You can review your expense and resubmit if needed.

---
Vyapar Margadarshan
Expense Management System
    """.strip()
    
    # HTML email body
    reason_html = ""
    if reason:
        reason_html = f"""
        <div class="reason-box">
            <strong>Rejection Reason:</strong>
            <p style="margin: 10px 0 0 0; color: #374151;">{reason}</p>
        </div>
        """
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', 'Plus Jakarta Sans', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #fee2e2; border-top: none; border-radius: 0 0 10px 10px; }}
            .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .expense-details {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .detail-label {{ color: #6b7280; font-size: 14px; }}
            .detail-value {{ font-weight: 600; color: #111827; font-size: 14px; }}
            .reason-box {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
            .status-badge {{ display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">❌ Expense Rejected</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your expense submission was not approved</p>
            </div>
            <div class="content">
                <div class="alert-box">
                    <strong>Status Update:</strong> Your expense "<strong>{expense.title}</strong>" has been rejected by {rejected_by.get_full_name() or rejected_by.username}.
                </div>
                
                <div class="expense-details">
                    <div style="margin-bottom: 15px;">
                        <span class="status-badge">REJECTED</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Title</span>
                        <span class="detail-value">{expense.title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount</span>
                        <span class="detail-value">रू {expense.amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category</span>
                        <span class="detail-value">{expense.category}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date</span>
                        <span class="detail-value">{expense.date.strftime('%B %d, %Y')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Rejected by</span>
                        <span class="detail-value">{rejected_by.get_full_name() or rejected_by.username}</span>
                    </div>
                </div>
                
                {reason_html}
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    You can review your expense details and resubmit if needed. Please ensure all information is accurate and receipts are attached.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management System</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
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
        print(f"Failed to send expense rejection email: {e}")
        return False


def send_expense_approval_email(expense, approved_by):
    """
    Send email notification when an expense is approved
    
    Args:
        expense: Expense object
        approved_by: User who approved the expense
    """
    recipient_email = expense.user.email
    
    if not recipient_email:
        print(f"No email address for user {expense.user.username}")
        return False
    
    # Email subject
    subject = f"Expense Approved: {expense.title}"
    
    # Email body (plain text)
    message = f"""
Great news! Your expense has been approved.

Expense Details:
- Title: {expense.title}
- Amount: रू {expense.amount}
- Category: {expense.category}
- Date: {expense.date.strftime('%B %d, %Y')}
- Approved by: {approved_by.get_full_name() or approved_by.username}

Your expense has been processed and will be reflected in the reports.

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
            body {{ font-family: 'Inter', 'Plus Jakarta Sans', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #d1fae5; border-top: none; border-radius: 0 0 10px 10px; }}
            .success-box {{ background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            .expense-details {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .detail-label {{ color: #6b7280; font-size: 14px; }}
            .detail-value {{ font-weight: 600; color: #111827; font-size: 14px; }}
            .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }}
            .status-badge {{ display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">✅ Expense Approved</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Your expense has been successfully approved</p>
            </div>
            <div class="content">
                <div class="success-box">
                    <strong>Good News!</strong> Your expense "<strong>{expense.title}</strong>" has been approved by {approved_by.get_full_name() or approved_by.username}.
                </div>
                
                <div class="expense-details">
                    <div style="margin-bottom: 15px;">
                        <span class="status-badge">APPROVED</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Title</span>
                        <span class="detail-value">{expense.title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount</span>
                        <span class="detail-value">रू {expense.amount:,.2f}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category</span>
                        <span class="detail-value">{expense.category}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date</span>
                        <span class="detail-value">{expense.date.strftime('%B %d, %Y')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Approved by</span>
                        <span class="detail-value">{approved_by.get_full_name() or approved_by.username}</span>
                    </div>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                    Your expense has been processed and will be reflected in the financial reports.
                </p>
            </div>
            <div class="footer">
                <p>Vyapar Margadarshan - Expense Management System</p>
                <p>This is an automated notification. Please do not reply to this email.</p>
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
        print(f"Failed to send expense approval email: {e}")
        return False
