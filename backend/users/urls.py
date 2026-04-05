from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, CurrentUserView, update_profile, 
    change_password, update_preferences, export_user_data
)

urlpatterns = [
    # Registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # JWT Token endpoints
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Current user
    path('me/', CurrentUserView.as_view(), name='current_user'),
    
    # Profile management
    path('profile/', update_profile, name='update_profile'),
    path('change-password/', change_password, name='change_password'),
    path('preferences/', update_preferences, name='update_preferences'),
    path('export-data/', export_user_data, name='export_data'),
]
