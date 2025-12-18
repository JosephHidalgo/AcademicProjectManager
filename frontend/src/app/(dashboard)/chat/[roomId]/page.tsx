'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Send,
    Users,
    User,
    MoreVertical,
    UserPlus,
    Info,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { chatService, ChatRoom, ChatMessage } from '@/services/chat.service';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageTime, formatShortDate } from '@/lib/utils';

export default function ChatRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = Number(params.roomId);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [messageInput, setMessageInput] = useState('');
    const [showMembers, setShowMembers] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch room details
    const { data: room, isLoading: roomLoading } = useQuery({
        queryKey: ['chat-room', roomId],
        queryFn: () => chatService.getChatRoom(roomId),
        enabled: !!roomId,
    });

    // WebSocket for real-time
    const {
        messages: wsMessages,
        sendMessage,
        setTyping,
        typingUsers,
        isConnected,
        connectionError,
    } = useChat(roomId);

    // Fetch initial messages (poll when WebSocket is disconnected)
    const { data: initialMessages } = useQuery({
        queryKey: ['chat-messages', roomId],
        queryFn: () => chatService.getMessages(roomId),
        enabled: !!roomId,
        refetchInterval: isConnected ? false : 3000, // Poll every 3s when WS disconnected
    });

    // Combine initial messages with WebSocket messages
    const allMessages: ChatMessage[] = [
        ...(initialMessages?.results || []),
        ...wsMessages,
    ];

    // Remove duplicates and sort chronologically (oldest first)
    const uniqueMessages = allMessages
        .reduce((acc: ChatMessage[], msg) => {
            if (!acc.find((m) => m.id === msg.id)) {
                acc.push(msg);
            }
            return acc;
        }, [])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [uniqueMessages.length]);

    // Mark messages as read when opening room
    useEffect(() => {
        if (roomId) {
            chatService.markAsRead(roomId).catch(console.error);
            // Invalidate chat rooms to update unread count
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        }
    }, [roomId, queryClient]);

    // Handle send message
    const handleSend = () => {
        const content = messageInput.trim();
        if (!content) return;

        if (isConnected) {
            sendMessage(content);
        } else {
            // Fallback to REST API
            chatService.sendMessage(roomId, content).then(() => {
                queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
            });
        }

        setMessageInput('');
        setTyping(false);
        inputRef.current?.focus();
    };

    // Handle typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        setTyping(e.target.value.length > 0);
    };

    // Handle enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Get display name for the room
    const getRoomDisplayName = (r: ChatRoom) => {
        if (r.room_type === 'group') {
            return r.project_title || r.name || 'Chat Grupal';
        }
        if (r.participants.length > 0) {
            const other = r.participants.find((p) => p.id !== user?.id) || r.participants[0];
            return `${other.first_name} ${other.last_name}`;
        }
        return r.name || 'Chat';
    };

    if (roomLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="spinner" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="text-center py-16">
                <p style={{ color: '#7D6B5D' }}>Sala de chat no encontrada</p>
                <Link href="/chat" className="btn btn-outline mt-4">
                    Volver al chat
                </Link>
            </div>
        );
    }

    const isGroup = room.room_type === 'group';

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] pt-14 lg:pt-0">
            {/* Header */}
            <div
                className="flex items-center gap-4 px-4 py-3 bg-white border-b flex-shrink-0"
                style={{ borderColor: '#E8DFD5' }}
            >
                <button
                    onClick={() => router.push('/chat')}
                    className="p-2 rounded-lg hover:bg-[#F5EDE4] lg:hidden"
                >
                    <ArrowLeft className="w-5 h-5" style={{ color: '#5C4D3C' }} />
                </button>

                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{
                        background: isGroup
                            ? 'linear-gradient(135deg, #8B7355, #A0926D)'
                            : 'linear-gradient(135deg, #6B9080, #4A7A6A)',
                    }}
                >
                    {isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate" style={{ color: '#4A3728' }}>
                        {getRoomDisplayName(room)}
                    </h2>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#7D6B5D' }}>
                        {isConnected ? (
                            <>
                                <Wifi className="w-3 h-3 text-green-500" />
                                <span>Conectado</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-3 h-3 text-red-500" />
                                <span>{connectionError || 'Desconectado'}</span>
                            </>
                        )}
                        {typingUsers.length > 0 && (
                            <span className="ml-2 italic">
                                {typingUsers.map((u) => u.name).join(', ')} escribiendo...
                            </span>
                        )}
                    </div>
                </div>

                {isGroup && room.project && (
                    <Link
                        href={`/projects/${room.project}`}
                        className="p-2 rounded-lg hover:bg-[#F5EDE4]"
                        title="Ver proyecto"
                    >
                        <Info className="w-5 h-5" style={{ color: '#7D6B5D' }} />
                    </Link>
                )}

                <button
                    onClick={() => setShowMembers(!showMembers)}
                    className="p-2 rounded-lg hover:bg-[#F5EDE4]"
                >
                    <MoreVertical className="w-5 h-5" style={{ color: '#7D6B5D' }} />
                </button>
            </div>

            {/* Messages Area */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                style={{ backgroundColor: '#FDFAF7' }}
            >
                {uniqueMessages.length === 0 && (
                    <div className="text-center py-8">
                        <p style={{ color: '#B8A99A' }}>No hay mensajes aún. ¡Sé el primero en escribir!</p>
                    </div>
                )}

                {uniqueMessages.map((message, index) => {
                    const isOwn = message.is_own_message || message.sender?.id === user?.id;
                    const isSystem = message.message_type === 'system';
                    const showDate =
                        index === 0 ||
                        formatShortDate(uniqueMessages[index - 1].created_at) !==
                        formatShortDate(message.created_at);

                    return (
                        <div key={message.id}>
                            {showDate && (
                                <div className="flex justify-center my-4">
                                    <span
                                        className="px-3 py-1 rounded-full text-xs"
                                        style={{ backgroundColor: '#E8DFD5', color: '#7D6B5D' }}
                                    >
                                        {formatShortDate(message.created_at)}
                                    </span>
                                </div>
                            )}

                            {isSystem ? (
                                <div className="text-center">
                                    <span
                                        className="text-xs italic"
                                        style={{ color: '#B8A99A' }}
                                    >
                                        {message.content}
                                    </span>
                                </div>
                            ) : (
                                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn
                                            ? 'rounded-br-sm'
                                            : 'rounded-bl-sm'
                                            }`}
                                        style={{
                                            backgroundColor: isOwn ? '#8B7355' : 'white',
                                            color: isOwn ? 'white' : '#4A3728',
                                            boxShadow: isOwn
                                                ? 'none'
                                                : '0 1px 2px rgba(0,0,0,0.05)',
                                            border: isOwn ? 'none' : '1px solid #E8DFD5',
                                        }}
                                    >
                                        {!isOwn && isGroup && message.sender && (
                                            <p
                                                className="text-xs font-medium mb-1"
                                                style={{ color: '#8B7355' }}
                                            >
                                                {message.sender.first_name} {message.sender.last_name}
                                            </p>
                                        )}
                                        <p className="whitespace-pre-wrap break-words">
                                            {message.content}
                                        </p>
                                        <p
                                            className="text-xs mt-1 text-right"
                                            style={{
                                                color: isOwn ? 'rgba(255,255,255,0.7)' : '#B8A99A',
                                            }}
                                        >
                                            {formatMessageTime(message.created_at)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="flex items-center gap-3 px-4 py-3 bg-white border-t flex-shrink-0"
                style={{ borderColor: '#E8DFD5' }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 h-10 px-4 rounded-full border text-sm"
                    style={{
                        backgroundColor: '#FDFAF7',
                        borderColor: '#E8DFD5',
                        color: '#4A3728',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
                    style={{
                        background: messageInput.trim()
                            ? 'linear-gradient(135deg, #8B7355, #A0926D)'
                            : '#D4C4B5',
                    }}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
