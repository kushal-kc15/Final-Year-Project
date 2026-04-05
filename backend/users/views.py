from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


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
