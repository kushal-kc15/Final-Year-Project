from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .serializers import RegisterSerializer, UserSerializer
from .auth_utils import generate_token, send_verification_email, check_password_strength

User = get_user_model()


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint with email verification.
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check password strength
        password = request.data.get('password')
        strength = check_password_strength(password)
        if strength['score'] < 2:
            return Response(
                {
                    'error': 'Password is too weak',
                    'feedback': strength['feedback']
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = serializer.save()
        
        # Generate verification token
        token = generate_token()
        user.email_verification_token = token
        user.save()
        
        # Send verification email
        send_verification_email(user, token)
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully. Please check your email to verify your account.'
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view with email, rate limiting, and remember me
    """
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        remember_me = request.data.get('remember_me', False)
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Check if account is locked
            if user.account_locked_until and timezone.now() < user.account_locked_until:
                remaining = (user.account_locked_until - timezone.now()).seconds // 60
                return Response(
                    {'error': f'Account is locked due to multiple failed login attempts. Try again in {remaining} minutes.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Verify password
            if not user.check_password(password):
                user.failed_login_attempts += 1
                
                # Lock account after 5 failed attempts for 15 minutes
                if user.failed_login_attempts >= 5:
                    user.account_locked_until = timezone.now() + timedelta(minutes=15)
                    user.save()
                    return Response(
                        {'error': 'Account locked due to multiple failed login attempts. Try again in 15 minutes.'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                user.save()
                
                attempts_left = 5 - user.failed_login_attempts
                return Response(
                    {
                        'error': 'Invalid email or password',
                        'attempts_left': attempts_left
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if email is verified
            if not user.email_verified:
                return Response(
                    {
                        'error': 'Please verify your email before logging in. Check your inbox for the verification link.',
                        'email_not_verified': True,
                        'email': user.email
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Reset failed login attempts
            user.failed_login_attempts = 0
            user.account_locked_until = None
            user.last_login_ip = get_client_ip(request)
            user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Extend token lifetime if remember_me is True (30 days instead of 7)
            if remember_me:
                refresh.set_exp(lifetime=timedelta(days=30))
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CurrentUserView(generics.RetrieveAPIView):
    """
    Get current authenticated user.
    GET /api/auth/me/
    """
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Update user profile.
    PUT/PATCH /api/auth/profile/
    """
    user = request.user
    data = request.data
    
    # Update allowed fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'email' in data:
        # Check if email is already taken by another user
        if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response(
                {'error': 'Email already in use'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.email = data['email']
    if 'business_name' in data:
        user.business_name = data['business_name']
    if 'phone_number' in data:
        user.phone_number = data['phone_number']
    
    user.save()
    
    return Response({
        'user': UserSerializer(user).data,
        'message': 'Profile updated successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password.
    POST /api/auth/change-password/
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'Both old and new passwords are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify old password
    if not user.check_password(old_password):
        return Response(
            {'error': 'Current password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate new password length
    if len(new_password) < 8:
        return Response(
            {'error': 'New password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({
        'message': 'Password changed successfully'
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    """
    Update user preferences.
    PUT/PATCH /api/auth/preferences/
    """
    user = request.user
    data = request.data
    
    # Update preference fields
    if 'default_currency' in data:
        if data['default_currency'] not in ['NPR', 'USD', 'EUR']:
            return Response(
                {'error': 'Invalid currency choice'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.default_currency = data['default_currency']
    
    if 'items_per_page' in data:
        try:
            items = int(data['items_per_page'])
            if items not in [10, 20, 50]:
                raise ValueError
            user.items_per_page = items
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid items per page value'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    if 'theme_preference' in data:
        if data['theme_preference'] not in ['light', 'dark', 'system']:
            return Response(
                {'error': 'Invalid theme preference'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.theme_preference = data['theme_preference']
    
    user.save()
    
    return Response({
        'user': UserSerializer(user).data,
        'message': 'Preferences updated successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_user_data(request):
    """
    Export user's expense data as JSON.
    GET /api/auth/export-data/
    """
    from expenses.models import Expense
    from expenses.serializers import ExpenseSerializer
    
    user = request.user
    expenses = Expense.objects.filter(user=user)
    
    export_data = {
        'user': UserSerializer(user).data,
        'expenses': ExpenseSerializer(expenses, many=True).data,
        'export_date': user.updated_at.isoformat(),
        'total_expenses': expenses.count()
    }
    
    return Response(export_data)
