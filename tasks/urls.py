from django.urls import path

from .views import (
    TaskListCreateView,
    TaskDetailView,
    TaskStatusUpdateView,
    TaskDocumentListView,
    TaskDocumentUploadView,
    TaskDocumentDeleteView,
    MyTasksView
)

app_name = 'tasks'

urlpatterns = [
    # Tareas propias del usuario
    path('my-tasks/', MyTasksView.as_view(), name='my_tasks'),
    
    # Tareas por proyecto
    path('project/<int:project_id>/', TaskListCreateView.as_view(), name='list_create'),
    
    # Detalle de tarea
    path('<int:pk>/', TaskDetailView.as_view(), name='detail'),
    path('<int:pk>/status/', TaskStatusUpdateView.as_view(), name='update_status'),
    
    # Documentos
    path('<int:task_id>/documents/', TaskDocumentListView.as_view(), name='document_list'),
    path('<int:task_id>/documents/upload/', TaskDocumentUploadView.as_view(), name='document_upload'),
    path('documents/<int:pk>/delete/', TaskDocumentDeleteView.as_view(), name='document_delete'),
]
