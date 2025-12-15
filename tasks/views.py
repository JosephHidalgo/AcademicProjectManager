from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import Task, TaskDocument
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskStatusSerializer,
    TaskDocumentSerializer,
    TaskDocumentUploadSerializer
)
from projects.models import Project, Membership


class TaskListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear tareas de un proyecto."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskListSerializer
    
    def get_project(self):
        """Obtiene el proyecto y verifica membresía."""
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, pk=project_id)
        
        # Verificar membresía
        if not Membership.objects.filter(
            user=self.request.user,
            project=project
        ).exists():
            return None
        
        return project
    
    def get_queryset(self):
        project = self.get_project()
        if not project:
            return Task.objects.none()
        return Task.objects.filter(project=project).order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['project'] = self.get_project()
        return context
    
    def create(self, request, *args, **kwargs):
        project = self.get_project()
        
        if not project:
            return Response(
                {'error': 'No tienes acceso a este proyecto.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verificar que sea líder para crear tareas
        membership = Membership.objects.filter(
            user=request.user,
            project=project
        ).first()
        
        if membership.role != 'leader':
            return Response(
                {'error': 'Solo el líder puede crear tareas.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task = serializer.save(
            project=project,
            created_by=request.user
        )
        
        return Response(
            TaskDetailSerializer(task).data,
            status=status.HTTP_201_CREATED
        )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar una tarea."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            project__memberships__user=user
        ).distinct()
    
    def update(self, request, *args, **kwargs):
        """Solo el líder puede actualizar tareas."""
        task = self.get_object()
        membership = Membership.objects.filter(
            user=request.user,
            project=task.project
        ).first()
        
        if not membership or membership.role != 'leader':
            return Response(
                {'error': 'Solo el líder puede editar tareas.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Solo el líder puede eliminar tareas."""
        task = self.get_object()
        membership = Membership.objects.filter(
            user=request.user,
            project=task.project
        ).first()
        
        if not membership or membership.role != 'leader':
            return Response(
                {'error': 'Solo el líder puede eliminar tareas.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class TaskStatusUpdateView(APIView):
    """Vista para actualizar el estado de una tarea."""
    
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        
        # Verificar membresía
        membership = Membership.objects.filter(
            user=request.user,
            project=task.project
        ).first()
        
        if not membership:
            return Response(
                {'error': 'No tienes acceso a esta tarea.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Solo el asignado o el líder pueden cambiar el estado
        is_leader = membership.role == 'leader'
        is_assigned = task.assigned_to == request.user
        
        if not is_leader and not is_assigned:
            return Response(
                {'error': 'Solo el líder o la persona asignada pueden cambiar el estado.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskStatusSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            TaskDetailSerializer(task).data,
            status=status.HTTP_200_OK
        )


class TaskDocumentListView(generics.ListAPIView):
    """Vista para listar documentos de una tarea."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = TaskDocumentSerializer
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        # Verificar acceso
        task = get_object_or_404(Task, pk=task_id)
        if not Membership.objects.filter(
            user=user,
            project=task.project
        ).exists():
            return TaskDocument.objects.none()
        
        return TaskDocument.objects.filter(task_id=task_id)


class TaskDocumentUploadView(APIView):
    """Vista para subir documentos a una tarea."""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        
        # Verificar membresía
        membership = Membership.objects.filter(
            user=request.user,
            project=task.project
        ).first()
        
        if not membership:
            return Response(
                {'error': 'No tienes acceso a esta tarea.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Solo el asignado o el líder pueden subir documentos
        is_leader = membership.role == 'leader'
        is_assigned = task.assigned_to == request.user
        
        if not is_leader and not is_assigned:
            return Response(
                {'error': 'Solo el líder o la persona asignada pueden subir documentos.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Obtener nombre del archivo si no se proporciona
        file_obj = request.data.get('file')
        name = serializer.validated_data.get('name') or file_obj.name
        
        document = TaskDocument.objects.create(
            task=task,
            file=file_obj,
            name=name,
            uploaded_by=request.user
        )
        
        return Response(
            TaskDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )


class TaskDocumentDeleteView(APIView):
    """Vista para eliminar un documento de una tarea."""
    
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        document = get_object_or_404(TaskDocument, pk=pk)
        task = document.task
        
        # Verificar membresía
        membership = Membership.objects.filter(
            user=request.user,
            project=task.project
        ).first()
        
        if not membership:
            return Response(
                {'error': 'No tienes acceso a este documento.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Solo el que subió el documento o el líder pueden eliminarlo
        is_leader = membership.role == 'leader'
        is_uploader = document.uploaded_by == request.user
        
        if not is_leader and not is_uploader:
            return Response(
                {'error': 'Solo el líder o quien subió el documento pueden eliminarlo.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Eliminar archivo físico
        if document.file:
            document.file.delete(save=False)
        
        document.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyTasksView(generics.ListAPIView):
    """Vista para listar todas las tareas asignadas al usuario."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = TaskListSerializer
    
    def get_queryset(self):
        return Task.objects.filter(
            assigned_to=self.request.user
        ).order_by('-created_at')
