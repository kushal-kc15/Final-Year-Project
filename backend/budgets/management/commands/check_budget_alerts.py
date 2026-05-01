from django.core.management.base import BaseCommand
from budgets.models import Budget
from budgets.views import BudgetViewSet


class Command(BaseCommand):
    help = 'Check all active budgets and generate alerts if needed'

    def handle(self, *args, **options):
        self.stdout.write('Checking all active budgets for alerts...\n')
        
        budgets = Budget.objects.filter(is_active=True)
        total = budgets.count()
        checked = 0
        alerts_created = 0
        
        budget_viewset = BudgetViewSet()
        
        for budget in budgets:
            checked += 1
            self.stdout.write(f'[{checked}/{total}] Checking: {budget.name}...')
            
            # Get current alert count
            from budgets.models import BudgetAlert
            before_count = BudgetAlert.objects.filter(budget=budget).count()
            
            # Check and create alerts if needed
            try:
                budget_viewset.check_budget_alerts(budget)
                
                # Check if new alerts were created
                after_count = BudgetAlert.objects.filter(budget=budget).count()
                new_alerts = after_count - before_count
                
                if new_alerts > 0:
                    alerts_created += new_alerts
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Created {new_alerts} alert(s)')
                    )
                else:
                    self.stdout.write('  - No alerts needed')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Error: {str(e)}')
                )
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Checked {checked} budgets, created {alerts_created} alerts'
            )
        )
        self.stdout.write('='*60)
