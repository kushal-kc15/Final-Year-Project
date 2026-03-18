import logging

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Expense
from .serializers import ExpenseSerializer

logger = logging.getLogger(__name__)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing expenses.
    Ensures users can only access their own expense records.
    """

    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only the authenticated user's expenses."""
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate the expense with the authenticated user."""
        logger.info(f"User {self.request.user.id} creating expense: {serializer.validated_data.get('title')}")
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Log expense update."""
        logger.info(f"User {self.request.user.id} updating expense {serializer.instance.id}")
        serializer.save()

    def perform_destroy(self, instance):
        """Log expense deletion."""
        logger.info(f"User {self.request.user.id} deleting expense {instance.id}")
        instance.delete()
