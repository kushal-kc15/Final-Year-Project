from .models import ActivityLog


def log_activity(organization, user, action_type, description, metadata=None):
    """
    Helper function to create activity logs
    
    Args:
        organization: Organization instance
        user: User instance
        action_type: One of ActivityLog.ACTION_TYPES
        description: Human-readable description
        metadata: Optional dict with additional data
    """
    if metadata is None:
        metadata = {}
    
    ActivityLog.objects.create(
        organization=organization,
        user=user,
        action_type=action_type,
        description=description,
        metadata=metadata
    )
