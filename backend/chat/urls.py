from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, ProjectMembersForChatViewSet

router = DefaultRouter()
router.register(r'rooms', ChatRoomViewSet, basename='chatroom')
router.register(r'members', ProjectMembersForChatViewSet, basename='chat-members')

urlpatterns = [
    path('', include(router.urls)),
]
