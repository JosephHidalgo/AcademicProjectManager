from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Project, Membership
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer,
    JoinProjectSerializer,
    MembershipSerializer
)


class ProjectListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear proyectos."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProjectCreateUpdateSerializer
        return ProjectListSerializer
    
    def get_queryset(self):
        """Retorna proyectos donde el usuario es miembro."""
        user = self.request.user
        return Project.objects.filter(
            memberships__user=user
        ).distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        """Crea el proyecto y asigna al creador como líder."""
        project = serializer.save(created_by=self.request.user)
        Membership.objects.create(
            user=self.request.user,
            project=project,
            role='leader'
        )
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Retornar el proyecto con el serializer de detalle
        project = Project.objects.get(pk=serializer.instance.pk)
        return Response(
            ProjectDetailSerializer(project, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar un proyecto."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer
    
    def get_queryset(self):
        """Retorna proyectos donde el usuario es miembro."""
        user = self.request.user
        return Project.objects.filter(memberships__user=user).distinct()
    
    def update(self, request, *args, **kwargs):
        """Solo el líder puede actualizar el proyecto."""
        project = self.get_object()
        membership = Membership.objects.filter(
            user=request.user,
            project=project
        ).first()
        
        if not membership or membership.role != 'leader':
            return Response(
                {'error': 'Solo el líder puede editar el proyecto.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Solo el líder puede eliminar el proyecto."""
        project = self.get_object()
        membership = Membership.objects.filter(
            user=request.user,
            project=project
        ).first()
        
        if not membership or membership.role != 'leader':
            return Response(
                {'error': 'Solo el líder puede eliminar el proyecto.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class JoinProjectView(APIView):
    """Vista para unirse a un proyecto mediante código."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = JoinProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        project = Project.objects.get(code=code)
        
        # Verificar si ya es miembro
        if Membership.objects.filter(user=request.user, project=project).exists():
            return Response(
                {'error': 'Ya eres miembro de este proyecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear membresía
        Membership.objects.create(
            user=request.user,
            project=project,
            role='member'
        )
        
        return Response({
            'message': 'Te has unido al proyecto exitosamente.',
            'project': ProjectDetailSerializer(project, context={'request': request}).data
        }, status=status.HTTP_200_OK)


class LeaveProjectView(APIView):
    """Vista para abandonar un proyecto."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        membership = Membership.objects.filter(
            user=request.user,
            project=project
        ).first()
        
        if not membership:
            return Response(
                {'error': 'No eres miembro de este proyecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # El líder no puede abandonar, debe transferir liderazgo o eliminar
        if membership.role == 'leader':
            return Response(
                {'error': 'El líder no puede abandonar el proyecto. Transfiere el liderazgo o elimina el proyecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership.delete()
        
        return Response({
            'message': 'Has abandonado el proyecto exitosamente.'
        }, status=status.HTTP_200_OK)


class ProjectMembersView(generics.ListAPIView):
    """Vista para listar miembros de un proyecto."""
    
    permission_classes = [IsAuthenticated]
    serializer_class = MembershipSerializer
    
    def get_queryset(self):
        project_id = self.kwargs.get('pk')
        user = self.request.user
        
        # Verificar que el usuario sea miembro
        if not Membership.objects.filter(user=user, project_id=project_id).exists():
            return Membership.objects.none()
        
        return Membership.objects.filter(project_id=project_id)


class TransferLeadershipView(APIView):
    """Vista para transferir el liderazgo a otro miembro."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar que sea el líder actual
        current_membership = Membership.objects.filter(
            user=request.user,
            project=project,
            role='leader'
        ).first()
        
        if not current_membership:
            return Response(
                {'error': 'Solo el líder puede transferir el liderazgo.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_leader_id = request.data.get('user_id')
        if not new_leader_id:
            return Response(
                {'error': 'Debes especificar el ID del nuevo líder.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el nuevo líder sea miembro
        new_leader_membership = Membership.objects.filter(
            user_id=new_leader_id,
            project=project
        ).first()
        
        if not new_leader_membership:
            return Response(
                {'error': 'El usuario debe ser miembro del proyecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Transferir liderazgo
        current_membership.role = 'member'
        current_membership.save()
        
        new_leader_membership.role = 'leader'
        new_leader_membership.save()
        
        return Response({
            'message': 'Liderazgo transferido exitosamente.'
        }, status=status.HTTP_200_OK)


class RemoveMemberView(APIView):
    """Vista para que el líder remueva un miembro."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar que sea el líder
        leader_membership = Membership.objects.filter(
            user=request.user,
            project=project,
            role='leader'
        ).first()
        
        if not leader_membership:
            return Response(
                {'error': 'Solo el líder puede remover miembros.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'Debes especificar el ID del usuario a remover.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # No puede removerse a sí mismo
        if str(user_id) == str(request.user.id):
            return Response(
                {'error': 'No puedes removerte a ti mismo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar membresía del usuario a remover
        membership_to_remove = Membership.objects.filter(
            user_id=user_id,
            project=project
        ).first()
        
        if not membership_to_remove:
            return Response(
                {'error': 'El usuario no es miembro del proyecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        membership_to_remove.delete()
        
        return Response({
            'message': 'Miembro removido exitosamente.'
        }, status=status.HTTP_200_OK)
