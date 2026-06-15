"""
Scoped throttles for authentication and account-security endpoints.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'auth_register'


class LoginRateThrottle(AnonRateThrottle):
    scope = 'auth_login'


class GoogleLoginRateThrottle(AnonRateThrottle):
    scope = 'auth_google'


class TokenRefreshRateThrottle(AnonRateThrottle):
    scope = 'auth_refresh'


class ResendVerificationRateThrottle(AnonRateThrottle):
    scope = 'auth_resend_verification'


class VerifyEmailRateThrottle(AnonRateThrottle):
    scope = 'auth_verify_email'


class PasswordResetRequestRateThrottle(AnonRateThrottle):
    scope = 'auth_password_reset'


class PasswordResetConfirmRateThrottle(AnonRateThrottle):
    scope = 'auth_password_reset_confirm'


class PasswordStrengthRateThrottle(AnonRateThrottle):
    scope = 'auth_password_strength'


class OTPSendRateThrottle(AnonRateThrottle):
    scope = 'auth_otp_send'


class OTPVerifyRateThrottle(AnonRateThrottle):
    scope = 'auth_otp_verify'


class AuthenticatedSecurityRateThrottle(UserRateThrottle):
    scope = 'auth_security_user'
