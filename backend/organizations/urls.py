from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, InvitationViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'invitations', InvitationViewSet, basename='invitation')

urlpatterns = [
    path('', include(router.urls)),
]
