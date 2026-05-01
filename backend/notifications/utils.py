"""
Utility functions for creating notifications
"""
from .models import Notification


def create_notification(
    user,
    notification_type,
    title,
    message,
    organization=None,
    priority='MEDIUM',
    related_object_type=None,
    related_object_id=None,
    action_url=None
):
    """
    Create a notification for a user.
    
    Args:
        user: User object to receive the notification
        notification_type: Type of notification (from TYPE_CHOICES)
        title: Short title for the notification
        message: Detailed message
        organization: Organization object (optional)
        priority: Priority level (LOW, MEDIUM, HIGH, URGENT)
        related_object_type: Type of related object (e.g., 'expense', 'budget')
        related_object_id: ID of related object
        action_url: Frontend URL for action button
    
    Returns:
        Notification object
    """
    return Notification.objects.create(
        user=user,
        organization=organization,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=priority,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
        action_url=action_url
    )


def notify_expense_approved(expense, approved_by):
    """Notify user when their expense is approved"""
    # Create in-app notification
    notification = create_notification(
        user=expense.user,
        notification_type='EXPENSE_APPROVED',
        title='Expense Approved ✓',
        message=f'Your expense "{expense.title}" (रू {expense.amount}) has been approved by {approved_by.get_full_name() or approved_by.username}.',
        organization=expense.organization,
        priority='MEDIUM',
        related_object_type='expense',
        related_object_id=expense.id,
        action_url='/expenses'
    )
    
    # Send email notification
    from expenses.emails import send_expense_approval_email
    try:
        send_expense_approval_email(expense, approved_by)
    except Exception as e:
        print(f"Failed to send approval email: {e}")
    
    return notification


def notify_expense_rejected(expense, rejected_by, reason=''):
    """Notify user when their expense is rejected"""
    message = f'Your expense "{expense.title}" (रू {expense.amount}) has been rejected by {rejected_by.get_full_name() or rejected_by.username}.'
    if reason:
        message += f' Reason: {reason}'
    
    # Create in-app notification
    notification = create_notification(
        user=expense.user,
        notification_type='EXPENSE_REJECTED',
        title='Expense Rejected',
        message=message,
        organization=expense.organization,
        priority='HIGH',
        related_object_type='expense',
        related_object_id=expense.id,
        action_url='/expenses'
    )
    
    # Send email notification
    from expenses.emails import send_expense_rejection_email
    try:
        send_expense_rejection_email(expense, rejected_by, reason)
    except Exception as e:
        print(f"Failed to send rejection email: {e}")
    
    return notification


def notify_pending_approval(managers, expense):
    """Notify managers about pending expense approval"""
    notifications = []
    for manager in managers:
        notif = create_notification(
            user=manager.user,
            notification_type='EXPENSE_PENDING',
            title='New Expense Pending',
            message=f'{expense.user.get_full_name() or expense.user.username} submitted "{expense.title}" (रू {expense.amount}) for approval.',
            organization=expense.organization,
            priority='MEDIUM',
            related_object_type='expense',
            related_object_id=expense.id,
            action_url='/approvals'
        )
        notifications.append(notif)
    return notifications


def notify_budget_alert(user, budget, current_spending, percentage):
    """Notify user about budget threshold reached"""
    return create_notification(
        user=user,
        notification_type='BUDGET_ALERT',
        title='Budget Alert ⚠️',
        message=f'Your {budget.category} budget has reached {percentage:.1f}% (रू {current_spending} of रू {budget.amount}).',
        organization=budget.organization,
        priority='HIGH',
        related_object_type='budget',
        related_object_id=budget.id,
        action_url='/budgets'
    )


def notify_budget_exceeded(user, budget, current_spending, percentage):
    """Notify user about budget exceeded"""
    over_amount = float(current_spending) - float(budget.amount)
    return create_notification(
        user=user,
        notification_type='BUDGET_EXCEEDED',
        title='Budget Exceeded! 🚨',
        message=f'Your {budget.category} budget has been exceeded by रू {over_amount:.2f} ({percentage:.1f}% used).',
        organization=budget.organization,
        priority='URGENT',
        related_object_type='budget',
        related_object_id=budget.id,
        action_url='/budgets'
    )


def notify_member_joined(managers, new_member):
    """Notify managers when a new member joins"""
    notifications = []
    for manager in managers:
        notif = create_notification(
            user=manager.user,
            notification_type='MEMBER_JOINED',
            title='New Team Member',
            message=f'{new_member.user.get_full_name() or new_member.user.username} has joined your organization as {new_member.role}.',
            organization=new_member.organization,
            priority='LOW',
            action_url='/team'
        )
        notifications.append(notif)
    return notifications
