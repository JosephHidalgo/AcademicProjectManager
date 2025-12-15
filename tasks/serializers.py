from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Task, TaskDocument
from projects.models import Membership

User = get_user_model()


class TaskDocumentSerializer(serializers.ModelSerializer):
    """Serializer para documentos de tareas."""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    filename = serializers.CharField(read_only=True)
    
    class Meta:
        model = TaskDocument
        fields = ['id', 'task', 'file', 'name', 'uploaded_by', 'uploaded_by_name', 'filename', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer para listar tareas."""
    
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'name', 'description', 'deadline', 'priority', 'priority_display',
            'status', 'status_display', 'assigned_to', 'assigned_to_name',
            'documents_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_documents_count(self, obj):
        return obj.documents.count()


class TaskDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de tarea."""
    
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    documents = TaskDocumentSerializer(many=True, read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_title', 'name', 'description', 'deadline',
            'priority', 'priority_display', 'status', 'status_display',
            'assigned_to', 'assigned_to_name', 'created_by', 'created_by_name',
            'documents', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'project', 'created_by', 'created_at', 'updated_at', 'completed_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear tareas."""
    
    class Meta:
        model = Task
        fields = ['name', 'description', 'deadline', 'priority', 'assigned_to']
    
    def validate_assigned_to(self, value):
        """Valida que el usuario asignado sea miembro del proyecto."""
        if value:
            project = self.context.get('project')
            if project and not Membership.objects.filter(project=project, user=value).exists():
                raise serializers.ValidationError(
                    'El usuario asignado debe ser miembro del proyecto.'
                )
        return value
    
    def validate_deadline(self, value):
        """Valida que la fecha límite no sea pasada."""
        if value < timezone.now().date():
            raise serializers.ValidationError(
                'La fecha límite no puede ser una fecha pasada.'
            )
        return value


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar tareas."""
    
    class Meta:
        model = Task
        fields = ['name', 'description', 'deadline', 'priority', 'assigned_to']
    
    def validate_assigned_to(self, value):
        """Valida que el usuario asignado sea miembro del proyecto."""
        if value:
            task = self.instance
            if not Membership.objects.filter(project=task.project, user=value).exists():
                raise serializers.ValidationError(
                    'El usuario asignado debe ser miembro del proyecto.'
                )
        return value


class TaskStatusSerializer(serializers.ModelSerializer):
    """Serializer para actualizar el estado de una tarea."""
    
    class Meta:
        model = Task
        fields = ['status']
    
    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)
        
        # Si se marca como completada, registrar la fecha
        if new_status == 'completed' and instance.status != 'completed':
            instance.completed_at = timezone.now()
        elif new_status != 'completed':
            instance.completed_at = None
        
        instance.status = new_status
        instance.save()
        return instance


class TaskDocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer para subir documentos a tareas."""
    
    class Meta:
        model = TaskDocument
        fields = ['file', 'name']
    
    def validate_name(self, value):
        if not value:
            # Si no se proporciona nombre, usar el nombre del archivo
            return self.initial_data.get('file', '').name if hasattr(self.initial_data.get('file', ''), 'name') else 'documento'
        return value
