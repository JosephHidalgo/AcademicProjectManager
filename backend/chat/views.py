from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import ChatRoom, Message, MessageRead
from .serializers import (
    ChatRoomSerializer, ChatRoomDetailSerializer,
    MessageSerializer, CreatePrivateChatSerializer,
    SendMessageSerializer
)
from projects.models import Project, Membership


User = get_user_model()


class ChatRoomViewSet(viewsets.ModelViewSet):
    """ViewSet para salas de chat."""
    
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Obtener salas de chat del usuario."""
        user = self.request.user
        
        # Obtener proyectos donde el usuario es miembro
        user_projects = Project.objects.filter(memberships__user=user)
        
        # Salas grupales de sus proyectos + salas privadas donde es participante
        return ChatRoom.objects.filter(
            Q(room_type='group', project__in=user_projects) |
            Q(room_type='private', participants=user)
        ).distinct().order_by('-updated_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatRoomDetailSerializer
        return ChatRoomSerializer
    
    @action(detail=False, methods=['get'])
    def by_project(self, request):
        """Obtener salas de chat de un proyecto específico."""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'Se requiere project_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar membresía
        project = get_object_or_404(Project, id=project_id)
        if not project.memberships.filter(user=request.user).exists():
            return Response(
                {'error': 'No tienes acceso a este proyecto'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener o crear chat grupal
        group_chat, _ = ChatRoom.get_or_create_group_chat(project)
        
        # Obtener chats privados del usuario en este proyecto
        private_chats = ChatRoom.objects.filter(
            room_type='private',
            project=project,
            participants=request.user
        )
        
        # Combinar resultados
        all_chats = [group_chat] + list(private_chats)
        serializer = self.get_serializer(all_chats, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_private(self, request):
        """Crear o obtener un chat privado."""
        serializer = CreatePrivateChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        other_user_id = serializer.validated_data['other_user_id']
        project_id = serializer.validated_data['project_id']
        
        # Verificar que no sea el mismo usuario
        if other_user_id == request.user.id:
            return Response(
                {'error': 'No puedes crear un chat contigo mismo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        other_user = get_object_or_404(User, id=other_user_id)
        project = get_object_or_404(Project, id=project_id)
        
        # Verificar que ambos usuarios sean miembros del proyecto
        if not project.memberships.filter(user=request.user).exists():
            return Response(
                {'error': 'No eres miembro de este proyecto'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not project.memberships.filter(user=other_user).exists():
            return Response(
                {'error': 'El otro usuario no es miembro de este proyecto'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener o crear chat privado
        chat_room, created = ChatRoom.get_or_create_private_chat(
            request.user, other_user, project
        )
        
        response_serializer = ChatRoomDetailSerializer(
            chat_room, context={'request': request}
        )
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Obtener mensajes de una sala con paginación."""
        chat_room = self.get_object()
        
        # Verificar acceso
        if chat_room.room_type == 'group':
            if not chat_room.project.memberships.filter(user=request.user).exists():
                return Response(
                    {'error': 'No tienes acceso a esta sala'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            if not chat_room.participants.filter(id=request.user.id).exists():
                return Response(
                    {'error': 'No tienes acceso a esta sala'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Paginación
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 50))
        offset = (page - 1) * page_size
        
        messages = chat_room.messages.all().order_by('-created_at')[offset:offset + page_size]
        serializer = MessageSerializer(
            messages, many=True, context={'request': request}
        )
        
        return Response({
            'count': chat_room.messages.count(),
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Enviar un mensaje via REST API (alternativa a WebSocket)."""
        chat_room = self.get_object()
        
        # Verificar acceso
        if chat_room.room_type == 'group':
            if not chat_room.project.memberships.filter(user=request.user).exists():
                return Response(
                    {'error': 'No tienes acceso a esta sala'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            if not chat_room.participants.filter(id=request.user.id).exists():
                return Response(
                    {'error': 'No tienes acceso a esta sala'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = Message.objects.create(
            chat_room=chat_room,
            sender=request.user,
            content=serializer.validated_data['content'],
            message_type=serializer.validated_data.get('message_type', 'text'),
            file=serializer.validated_data.get('file')
        )
        
        # Actualizar timestamp de la sala
        chat_room.save()
        
        response_serializer = MessageSerializer(
            message, context={'request': request}
        )
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar todos los mensajes de la sala como leídos."""
        chat_room = self.get_object()
        
        # Obtener mensajes no leídos que no son del usuario actual
        unread_messages = chat_room.messages.exclude(
            sender=request.user
        ).exclude(
            read_by__user=request.user
        )
        
        # Crear registros de lectura
        for message in unread_messages:
            MessageRead.objects.get_or_create(
                message=message,
                user=request.user
            )
        
        return Response({'status': 'Mensajes marcados como leídos'})


class ProjectMembersForChatViewSet(viewsets.ViewSet):
    """ViewSet para obtener miembros disponibles para chat."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Listar miembros de un proyecto disponibles para chat privado."""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'error': 'Se requiere project_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        project = get_object_or_404(Project, id=project_id)
        
        # Verificar membresía
        if not project.memberships.filter(user=request.user).exists():
            return Response(
                {'error': 'No tienes acceso a este proyecto'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener otros miembros
        memberships = project.memberships.exclude(user=request.user).select_related('user')
        
        members = []
        for membership in memberships:
            user = membership.user
            # Verificar si ya existe chat privado
            existing_chat = ChatRoom.objects.filter(
                room_type='private',
                project=project,
                participants=request.user
            ).filter(participants=user).first()
            
            members.append({
                'id': user.id,
                'email': user.email,
                'full_name': user.get_full_name(),
                'role': membership.get_role_display(),
                'has_private_chat': existing_chat is not None,
                'chat_room_id': existing_chat.id if existing_chat else None
            })
        
        return Response(members)
