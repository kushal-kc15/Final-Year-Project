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
]
