from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'action_type', 'description', 'metadata', 'timestamp', 'user_name', 'user_email']
        read_only_fields = ['id', 'timestamp', 'user_name', 'user_email']
