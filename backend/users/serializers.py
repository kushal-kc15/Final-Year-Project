from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (for responses)"""
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'business_name', 'phone_number', 
                  'first_name', 'last_name', 'default_currency', 'items_per_page',
                  'theme_preference', 'profile_picture', 'profile_picture_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'profile_picture_url']
    
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
        fields = ['username', 'email', 'password', 'password2', 
                  'business_name', 'phone_number', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user
