import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vyapar_margadarshan.settings.development')
django.setup()

from budgets.models import Budget, BudgetAlert
from budgets.serializers import BudgetSerializer
from expenses.models import Expense
from django.utils import timezone

print('=' * 60)
print('BUDGET ALERT DIAGNOSTIC')
print('=' * 60)

# Get all active budgets
budgets = Budget.objects.filter(is_active=True)
print(f'\n📊 Active Budgets: {budgets.count()}')

for budget in budgets[:10]:  # Check first 10
    serializer = BudgetSerializer(budget)
    data = serializer.data
    
    print(f'\n--- Budget: {budget.name} ---')
    print(f'  Category: {budget.category}')
    print(f'  Period: {budget.period}')
    print(f'  Amount: रू {budget.amount}')
    print(f'  Spent: रू {data["spent_amount"]:.2f}')
    print(f'  Percentage: {data["percentage_used"]}%')
    print(f'  Alert Threshold: {budget.alert_threshold}%')
    print(f'  Start: {budget.start_date}, End: {budget.end_date}')
    
    # Check if should have alert
    if data['percentage_used'] >= budget.alert_threshold:
        print(f'  ⚠️  SHOULD HAVE ALERT (>= {budget.alert_threshold}%)')
        
        # Check if alert exists
        alerts = BudgetAlert.objects.filter(budget=budget)
        print(f'  Existing alerts: {alerts.count()}')
        for alert in alerts:
            print(f'    - {alert.alert_type}: {alert.percentage}%')
    else:
        print(f'  ✓ Below threshold')

# Check expenses in current period
print(f'\n\n📝 Expense Check:')
today = timezone.now().date()
month_start = today.replace(day=1)

expenses = Expense.objects.filter(
    status='APPROVED',
    date__gte=month_start,
    date__lte=today
)
print(f'  Approved expenses this month: {expenses.count()}')
print(f'  Total amount: रू {sum(float(e.amount) for e in expenses):.2f}')

# Check by category
print(f'\n  By category:')
for cat in ['FOOD', 'TRANSPORT', 'OFFICE', 'UTILITIES', 'SALARY', 'RENT', 'MARKETING', 'OTHER']:
    cat_expenses = expenses.filter(category=cat)
    if cat_expenses.exists():
        total = sum(float(e.amount) for e in cat_expenses)
        print(f'    {cat}: {cat_expenses.count()} expenses, रू {total:.2f}')

print('\n' + '=' * 60)
print('DIAGNOSTIC COMPLETE')
print('=' * 60)
