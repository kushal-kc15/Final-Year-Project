from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
import re

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (for responses)"""
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'business_name', 'phone_number', 
                  'first_name', 'last_name', 'default_currency', 'items_per_page',
                  'theme_preference', 'two_factor_enabled', 'profile_picture',
                  'profile_picture_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'profile_picture_url', 'two_factor_enabled']
    
    def get_profile_picture_url(self, obj):
        """Get full URL for profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password2',
                  'business_name', 'phone_number', 'first_name', 'last_name']

    def _generate_username(self, email):
        local_part = (email or '').split('@')[0].strip().lower()
        base = re.sub(r'[^a-z0-9_.+-]+', '_', local_part).strip('._-+')
        if not base:
            base = 'user'
        base = base[:140]

        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{suffix}"
            suffix += 1
        return username

    def validate_email(self, value):
        email = (value or '').strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                'An account with this email already exists. Please sign in.'
            )
        return email

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        validated_data['username'] = self._generate_username(validated_data.get('email'))
        user = User.objects.create_user(**validated_data)
        return user
