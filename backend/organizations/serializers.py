from rest_framework import serializers
from .models import Organization, OrganizationMember, Invitation
from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'description', 'member_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = ['id', 'organization', 'organization_name', 'user', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class InvitationSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.username', read_only=True)
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'organization', 'organization_name', 'email', 'role',
            'token', 'status', 'invited_by', 'invited_by_name',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'token', 'status', 'invited_by', 'created_at']
