from django.urls import path
from .views import (
    RegisterView, CurrentUserView, update_profile, 
    change_password, update_preferences, export_user_data,
    CustomTokenObtainPairView, GoogleLoginView, ThrottledTokenRefreshView,
    upload_profile_picture, delete_profile_picture
)
from .security_views import (
    resend_verification_email, verify_email,
    request_password_reset, reset_password,
    check_password_strength_api,
    enable_2fa, disable_2fa, send_2fa_code, verify_2fa_code,
)

urlpatterns = [
    # Registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # JWT Token endpoints (Email-based login)
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification
    path('resend-verification/', resend_verification_email, name='resend_verification'),
    path('verify-email/', verify_email, name='verify_email'),
    
    # Password reset
    path('request-password-reset/', request_password_reset, name='request_password_reset'),
    path('reset-password/', reset_password, name='reset_password'),
    path('check-password-strength/', check_password_strength_api, name='check_password_strength'),
    path('enable-2fa/', enable_2fa, name='enable_2fa'),
    path('disable-2fa/', disable_2fa, name='disable_2fa'),
    path('send-2fa-code/', send_2fa_code, name='send_2fa_code'),
    path('verify-2fa-code/', verify_2fa_code, name='verify_2fa_code'),
    
    # Current user
    path('me/', CurrentUserView.as_view(), name='current_user'),
    
    # Profile management
    path('profile/', update_profile, name='update_profile'),
    path('upload-avatar/', upload_profile_picture, name='upload_avatar'),
    path('delete-avatar/', delete_profile_picture, name='delete_avatar'),
    path('change-password/', change_password, name='change_password'),
    path('preferences/', update_preferences, name='update_preferences'),
    path('export-data/', export_user_data, name='export_data'),
]
