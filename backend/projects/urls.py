from django.urls import path

from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    JoinProjectView,
    LeaveProjectView,
    ProjectMembersView,
    TransferLeadershipView,
    RemoveMemberView
)

app_name = 'projects'

urlpatterns = [
    # Proyectos CRUD
    path('', ProjectListCreateView.as_view(), name='list_create'),
    path('<int:pk>/', ProjectDetailView.as_view(), name='detail'),
    
    # Membresía
    path('join/', JoinProjectView.as_view(), name='join'),
    path('<int:pk>/leave/', LeaveProjectView.as_view(), name='leave'),
    path('<int:pk>/members/', ProjectMembersView.as_view(), name='members'),
    path('<int:pk>/transfer-leadership/', TransferLeadershipView.as_view(), name='transfer_leadership'),
    path('<int:pk>/remove-member/', RemoveMemberView.as_view(), name='remove_member'),
]
