from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """Modelo para salas de chat (grupales o privadas)."""
    
    ROOM_TYPE_CHOICES = [
        ('group', 'Grupal'),
        ('private', 'Privado'),
    ]
    
    name = models.CharField('nombre', max_length=255, blank=True)
    room_type = models.CharField(
        'tipo de sala',
        max_length=10,
        choices=ROOM_TYPE_CHOICES,
        default='group'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='chat_rooms',
        verbose_name='proyecto',
        null=True,
        blank=True
    )
    # Para chats privados, almacenamos los dos participantes
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='private_chats',
        verbose_name='participantes',
        blank=True
    )
    created_at = models.DateTimeField('fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('fecha de actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'sala de chat'
        verbose_name_plural = 'salas de chat'
        ordering = ['-updated_at']
    
    def __str__(self):
        if self.room_type == 'group' and self.project:
            return f'Chat grupal: {self.project.title}'
        elif self.room_type == 'private':
            participants = self.participants.all()
            if participants.count() == 2:
                names = [p.get_full_name() for p in participants]
                return f'Chat privado: {" - ".join(names)}'
        return self.name or f'Sala {self.id}'
    
    @classmethod
    def get_or_create_private_chat(cls, user1, user2, project):
        """Obtiene o crea un chat privado entre dos usuarios en un proyecto."""
        # Buscar chat privado existente entre estos dos usuarios en el proyecto
        existing_chat = cls.objects.filter(
            room_type='private',
            project=project,
            participants=user1
        ).filter(participants=user2).first()
        
        if existing_chat:
            return existing_chat, False
        
        # Crear nuevo chat privado
        chat_room = cls.objects.create(
            room_type='private',
            project=project,
            name=f'Chat privado'
        )
        chat_room.participants.add(user1, user2)
        return chat_room, True
    
    @classmethod
    def get_or_create_group_chat(cls, project):
        """Obtiene o crea el chat grupal de un proyecto."""
        chat_room, created = cls.objects.get_or_create(
            room_type='group',
            project=project,
            defaults={'name': f'Chat grupal - {project.title}'}
        )
        return chat_room, created


class Message(models.Model):
    """Modelo para mensajes de chat."""
    
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Texto'),
        ('file', 'Archivo'),
        ('image', 'Imagen'),
        ('system', 'Sistema'),
    ]
    
    chat_room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='sala de chat'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='remitente',
        null=True,
        blank=True  # Para mensajes del sistema
    )
    content = models.TextField('contenido')
    message_type = models.CharField(
        'tipo de mensaje',
        max_length=10,
        choices=MESSAGE_TYPE_CHOICES,
        default='text'
    )
    file = models.FileField(
        'archivo',
        upload_to='chat/files/%Y/%m/%d/',
        null=True,
        blank=True
    )
    is_read = models.BooleanField('leído', default=False)
    created_at = models.DateTimeField('fecha de envío', auto_now_add=True)
    
    class Meta:
        verbose_name = 'mensaje'
        verbose_name_plural = 'mensajes'
        ordering = ['created_at']
    
    def __str__(self):
        sender_name = self.sender.get_full_name() if self.sender else 'Sistema'
        return f'{sender_name}: {self.content[:50]}...'


class MessageRead(models.Model):
    """Modelo para rastrear qué usuarios han leído qué mensajes."""
    
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='read_by',
        verbose_name='mensaje'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='read_messages',
        verbose_name='usuario'
    )
    read_at = models.DateTimeField('fecha de lectura', auto_now_add=True)
    
    class Meta:
        verbose_name = 'lectura de mensaje'
        verbose_name_plural = 'lecturas de mensajes'
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f'{self.user.email} leyó mensaje {self.message.id}'
