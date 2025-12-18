import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, MessageRead


User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """Consumer para WebSocket de chat."""
    
    async def connect(self):
        """Manejar conexión WebSocket."""
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']
        
        # Verificar autenticación
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
        
        # Verificar que el usuario tiene acceso a la sala
        has_access = await self.check_room_access()
        if not has_access:
            await self.close()
            return
        
        # Unirse al grupo de la sala
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notificar que el usuario se conectó
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_join',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name(),
            }
        )
    
    async def disconnect(self, close_code):
        """Manejar desconexión WebSocket."""
        if hasattr(self, 'room_group_name'):
            # Notificar que el usuario se desconectó
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user_id': self.user.id,
                    'user_name': self.user.get_full_name(),
                }
            )
            
            # Salir del grupo
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Recibir mensaje del WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')
            
            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'mark_read':
                await self.handle_mark_read(data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Formato de mensaje inválido'
            }))
    
    async def handle_chat_message(self, data):
        """Manejar mensaje de chat."""
        content = data.get('content', '').strip()
        msg_type = data.get('message_type', 'text')
        
        if not content:
            return
        
        # Guardar mensaje en base de datos
        message = await self.save_message(content, msg_type)
        
        # Enviar mensaje a todos en la sala
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'content': message.content,
                'message_type': message.message_type,
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name(),
                'sender_email': self.user.email,
                'created_at': message.created_at.isoformat(),
            }
        )
    
    async def handle_typing(self, data):
        """Manejar indicador de escritura."""
        is_typing = data.get('is_typing', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name(),
                'is_typing': is_typing,
            }
        )
    
    async def handle_mark_read(self, data):
        """Marcar mensajes como leídos."""
        message_ids = data.get('message_ids', [])
        await self.mark_messages_read(message_ids)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'messages_read',
                'user_id': self.user.id,
                'message_ids': message_ids,
            }
        )
    
    # Event handlers para group_send
    async def chat_message(self, event):
        """Enviar mensaje de chat al WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message_id': event['message_id'],
            'content': event['content'],
            'message_type': event['message_type'],
            'sender': {
                'id': event['sender_id'],
                'name': event['sender_name'],
                'email': event['sender_email'],
            },
            'created_at': event['created_at'],
            'is_own_message': event['sender_id'] == self.user.id,
        }))
    
    async def typing_indicator(self, event):
        """Enviar indicador de escritura al WebSocket."""
        # No enviar al mismo usuario
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing'],
            }))
    
    async def messages_read(self, event):
        """Notificar que mensajes fueron leídos."""
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'user_id': event['user_id'],
            'message_ids': event['message_ids'],
        }))
    
    async def user_join(self, event):
        """Notificar que un usuario se unió."""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_join',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
            }))
    
    async def user_leave(self, event):
        """Notificar que un usuario se fue."""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_leave',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
            }))
    
    # Database operations
    @database_sync_to_async
    def check_room_access(self):
        """Verificar si el usuario tiene acceso a la sala."""
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            
            if room.room_type == 'group':
                # Para chat grupal, verificar membresía en el proyecto
                return room.project.memberships.filter(user=self.user).exists()
            else:
                # Para chat privado, verificar si es participante
                return room.participants.filter(id=self.user.id).exists()
        except ChatRoom.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content, message_type):
        """Guardar mensaje en la base de datos."""
        room = ChatRoom.objects.get(id=self.room_id)
        message = Message.objects.create(
            chat_room=room,
            sender=self.user,
            content=content,
            message_type=message_type
        )
        # Actualizar timestamp de la sala
        room.save()
        return message
    
    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        """Marcar mensajes como leídos."""
        messages = Message.objects.filter(
            id__in=message_ids,
            chat_room_id=self.room_id
        ).exclude(sender=self.user)
        
        for message in messages:
            MessageRead.objects.get_or_create(
                message=message,
                user=self.user
            )


class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer para notificaciones en tiempo real."""
    
    async def connect(self):
        """Manejar conexión WebSocket para notificaciones."""
        self.user = self.scope['user']
        
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
        
        self.notification_group_name = f'notifications_{self.user.id}'
        
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Manejar desconexión."""
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    async def new_message_notification(self, event):
        """Enviar notificación de nuevo mensaje."""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'room_id': event['room_id'],
            'room_name': event['room_name'],
            'sender_name': event['sender_name'],
            'content_preview': event['content_preview'],
        }))
