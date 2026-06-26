from rest_framework import serializers
from .models import Organization, OrganizationMember, Invitation
from users.serializers import UserSerializer


class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'description', 'legal_name', 'industry',
            'registration_number', 'tax_id', 'contact_email', 'phone_number',
            'address', 'city', 'country', 'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        annotated_count = getattr(obj, 'member_count_value', None)
        if annotated_count is not None:
            return annotated_count
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
            'token', 'status', 'is_used', 'invited_by', 'invited_by_name',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'token', 'status', 'is_used', 'invited_by', 'created_at']
