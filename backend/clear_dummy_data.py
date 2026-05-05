#!/usr/bin/env python
"""
Clear all dummy data from the database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vyapar_margadarshan.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization, OrganizationMember, Invitation
from expenses.models import Expense
from budgets.models import Budget, BudgetAlert
from receipts.models import Receipt

User = get_user_model()

print("\n" + "=" * 60)
print("CLEARING DUMMY DATA")
print("=" * 60)

# Delete all expenses
expense_count = Expense.objects.all().count()
Expense.objects.all().delete()
print(f"✅ Deleted {expense_count} expenses")

# Delete all budgets and alerts
budget_count = Budget.objects.all().count()
Budget.objects.all().delete()
print(f"✅ Deleted {budget_count} budgets")

alert_count = BudgetAlert.objects.all().count()
BudgetAlert.objects.all().delete()
print(f"✅ Deleted {alert_count} budget alerts")

# Delete all receipts
receipt_count = Receipt.objects.all().count()
Receipt.objects.all().delete()
print(f"✅ Deleted {receipt_count} receipts")

# Delete all invitations
invitation_count = Invitation.objects.all().count()
Invitation.objects.all().delete()
print(f"✅ Deleted {invitation_count} invitations")

# Delete dummy users (keep only real users)
dummy_users = ['staff_member', 'repofoot', 'testuser123', 'kishmarkc5']
deleted_users = 0
for username in dummy_users:
    try:
        user = User.objects.get(username=username)
        user.delete()
        deleted_users += 1
        print(f"✅ Deleted user: {username}")
    except User.DoesNotExist:
        pass

print(f"\n📊 Summary:")
print(f"   Expenses deleted: {expense_count}")
print(f"   Budgets deleted: {budget_count}")
print(f"   Budget alerts deleted: {alert_count}")
print(f"   Receipts deleted: {receipt_count}")
print(f"   Invitations deleted: {invitation_count}")
print(f"   Dummy users deleted: {deleted_users}")

# Show remaining users
remaining_users = User.objects.all()
print(f"\n👥 Remaining users ({remaining_users.count()}):")
for user in remaining_users:
    memberships = OrganizationMember.objects.filter(user=user)
    if memberships.exists():
        for m in memberships:
            print(f"   - {user.username} ({user.email}) - {m.organization.name} ({m.role})")
    else:
        print(f"   - {user.username} ({user.email}) - No organization")

print("\n" + "=" * 60)
print("✨ Database cleaned! Ready for fresh data.")
print("=" * 60 + "\n")
