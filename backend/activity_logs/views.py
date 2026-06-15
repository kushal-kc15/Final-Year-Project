from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from organizations.context import get_active_membership


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        member = get_active_membership(user, self.request)
        if not member:
            return ActivityLog.objects.none()

        queryset = ActivityLog.objects.filter(
            organization=member.organization
        ).select_related('user', 'organization')
        
        # Filter by action type if provided
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Search in description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(description__icontains=search)
        
        return queryset

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent activities (last 50)"""
        queryset = self.get_queryset()[:50]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def action_types(self, request):
        """Get available action types"""
        return Response([
            {'value': choice[0], 'label': choice[1]}
            for choice in ActivityLog.ACTION_TYPES
        ])
