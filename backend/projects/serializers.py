from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, Membership

User = get_user_model()


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer para membresías."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = Membership
        fields = ['id', 'user', 'user_email', 'user_name', 'role', 'role_display', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer para listar proyectos."""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    members_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'priority', 'priority_display',
            'start_date', 'end_date', 'code', 'created_by', 'created_by_name',
            'members_count', 'user_role', 'created_at'
        ]
        read_only_fields = ['id', 'code', 'created_by', 'created_at']
    
    def get_members_count(self, obj):
        return obj.memberships.count()
    
    def get_user_role(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            membership = obj.memberships.filter(user=request.user).first()
            if membership:
                return membership.get_role_display()
        return None


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de proyecto."""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    members = MembershipSerializer(source='memberships', many=True, read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'general_objectives', 'specific_objectives',
            'priority', 'priority_display', 'start_date', 'end_date', 'code',
            'created_by', 'created_by_name', 'members', 'tasks_count',
            'completed_tasks_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'code', 'created_by', 'created_at', 'updated_at']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()
    
    def get_completed_tasks_count(self, obj):
        return obj.tasks.filter(status='completed').count()


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar proyectos."""
    
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'general_objectives', 'specific_objectives',
            'priority', 'start_date', 'end_date'
        ]
    
    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'La fecha de fin debe ser posterior a la fecha de inicio.'
            })
        return attrs


class JoinProjectSerializer(serializers.Serializer):
    """Serializer para unirse a un proyecto mediante código."""
    
    code = serializers.CharField(max_length=6, min_length=6)
    
    def validate_code(self, value):
        value = value.upper()
        if not Project.objects.filter(code=value).exists():
            raise serializers.ValidationError('No existe un proyecto con este código.')
        return value
