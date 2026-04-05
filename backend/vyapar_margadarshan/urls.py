"""
URL configuration for vyapar_margadarshan project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/auth/', include('users.urls')),
    
    # Expenses endpoints
    path('api/', include('expenses.urls')),
    
    # Organizations endpoints
    path('api/', include('organizations.urls')),
    
    # Budgets endpoints
    path('api/', include('budgets.urls')),
    
    # Analytics endpoints
    path('api/analytics/', include('analytics.urls')),
    
    # Activity logs endpoints
    path('api/activity-logs/', include('activity_logs.urls')),
    
    # Receipts endpoints
    path('api/receipts/', include('receipts.urls')),
]
