from rest_framework import serializers
from .models import ChatRoom, Message, MessageRead
from users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer para mensajes."""
    
    sender = UserSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    is_own_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'chat_room', 'sender', 'sender_id', 'content',
            'message_type', 'file', 'is_read', 'created_at', 'is_own_message'
        ]
        read_only_fields = ['id', 'created_at', 'sender']
    
    def get_is_own_message(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender_id == request.user.id
        return False


class ChatRoomSerializer(serializers.ModelSerializer):
    """Serializer para salas de chat."""
    
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    
    class Meta:
        model = ChatRoom
        fields = [
            'id', 'name', 'room_type', 'project', 'project_title',
            'project_code', 'participants', 'last_message', 'unread_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content[:100],
                'sender_name': last_msg.sender.get_full_name() if last_msg.sender else 'Sistema',
                'created_at': last_msg.created_at,
                'message_type': last_msg.message_type
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.exclude(
                read_by__user=request.user
            ).exclude(sender=request.user).count()
        return 0


class ChatRoomDetailSerializer(ChatRoomSerializer):
    """Serializer detallado para sala de chat con mensajes."""
    
    messages = serializers.SerializerMethodField()
    
    class Meta(ChatRoomSerializer.Meta):
        fields = ChatRoomSerializer.Meta.fields + ['messages']
    
    def get_messages(self, obj):
        messages = obj.messages.all().order_by('-created_at')[:50]
        return MessageSerializer(
            messages,
            many=True,
            context=self.context
        ).data


class CreatePrivateChatSerializer(serializers.Serializer):
    """Serializer para crear un chat privado."""
    
    other_user_id = serializers.IntegerField()
    project_id = serializers.IntegerField()
    
    def validate_other_user_id(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError('El usuario no existe.')
        return value
    
    def validate_project_id(self, value):
        from projects.models import Project
        if not Project.objects.filter(id=value).exists():
            raise serializers.ValidationError('El proyecto no existe.')
        return value


class SendMessageSerializer(serializers.Serializer):
    """Serializer para enviar mensajes via REST API."""
    
    content = serializers.CharField(max_length=5000)
    message_type = serializers.ChoiceField(
        choices=Message.MESSAGE_TYPE_CHOICES,
        default='text'
    )
    file = serializers.FileField(required=False)
