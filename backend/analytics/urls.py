from django.urls import path
from . import views

urlpatterns = [
    path('spending-trends/', views.spending_trends, name='spending-trends'),
    path('category-breakdown/', views.category_breakdown, name='category-breakdown'),
    path('period-comparison/', views.period_comparison, name='period-comparison'),
]
