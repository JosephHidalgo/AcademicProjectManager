'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ChatMessage } from '@/services/chat.service';

interface WebSocketMessage {
    type: string;
    message_id?: number;
    content?: string;
    message_type?: string;
    sender?: {
        id: number;
        name: string;
        email: string;
    };
    created_at?: string;
    is_own_message?: boolean;
    user_id?: number;
    user_name?: string;
    is_typing?: boolean;
    message_ids?: number[];
}

interface UseChatReturn {
    messages: ChatMessage[];
    sendMessage: (content: string) => void;
    setTyping: (isTyping: boolean) => void;
    markMessagesRead: (messageIds: number[]) => void;
    typingUsers: { id: number; name: string }[];
    onlineUsers: { id: number; name: string }[];
    isConnected: boolean;
    connectionError: string | null;
}

export function useChat(roomId: number | null): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [typingUsers, setTypingUsers] = useState<{ id: number; name: string }[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<{ id: number; name: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { accessToken } = useAuthStore();

    // Connect to WebSocket
    useEffect(() => {
        if (!roomId || !accessToken) return;

        const connectWebSocket = () => {
            // Determine WebSocket URL
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? `${window.location.hostname}:8000` : 'localhost:8000');
            const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${roomId}/?token=${accessToken}`;

            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('WebSocket connected to room:', roomId);
                    setIsConnected(true);
                    setConnectionError(null);
                };

                ws.onmessage = (event) => {
                    try {
                        const data: WebSocketMessage = JSON.parse(event.data);
                        handleWebSocketMessage(data);
                    } catch (e) {
                        console.error('Error parsing WebSocket message:', e);
                    }
                };

                ws.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    setIsConnected(false);

                    // Reconnect after 3 seconds if not a normal close
                    if (event.code !== 1000) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                            console.log('Attempting to reconnect...');
                            connectWebSocket();
                        }, 3000);
                    }
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setConnectionError('Error de conexión al chat');
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                setConnectionError('No se pudo conectar al chat');
            }
        };

        connectWebSocket();

        // Cleanup on unmount or room change
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounted');
                wsRef.current = null;
            }
            setMessages([]);
            setTypingUsers([]);
            setOnlineUsers([]);
            setIsConnected(false);
        };
    }, [roomId, accessToken]);

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
        switch (data.type) {
            case 'chat_message':
                if (data.sender && data.message_id && data.content && data.created_at) {
                    const newMessage: ChatMessage = {
                        id: data.message_id,
                        chat_room: roomId!,
                        sender: {
                            id: data.sender.id,
                            email: data.sender.email,
                            first_name: data.sender.name.split(' ')[0] || '',
                            last_name: data.sender.name.split(' ').slice(1).join(' ') || '',
                        },
                        content: data.content,
                        message_type: (data.message_type as 'text' | 'file' | 'image' | 'system') || 'text',
                        file: null,
                        is_read: false,
                        created_at: data.created_at,
                        is_own_message: data.is_own_message || false,
                    };
                    setMessages((prev) => [...prev, newMessage]);
                }
                break;

            case 'typing':
                if (data.user_id && data.user_name) {
                    if (data.is_typing) {
                        setTypingUsers((prev) => {
                            if (!prev.find((u) => u.id === data.user_id)) {
                                return [...prev, { id: data.user_id!, name: data.user_name! }];
                            }
                            return prev;
                        });
                    } else {
                        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user_id));
                    }
                }
                break;

            case 'user_join':
                if (data.user_id && data.user_name) {
                    setOnlineUsers((prev) => {
                        if (!prev.find((u) => u.id === data.user_id)) {
                            return [...prev, { id: data.user_id!, name: data.user_name! }];
                        }
                        return prev;
                    });
                }
                break;

            case 'user_leave':
                if (data.user_id) {
                    setOnlineUsers((prev) => prev.filter((u) => u.id !== data.user_id));
                    setTypingUsers((prev) => prev.filter((u) => u.id !== data.user_id));
                }
                break;

            case 'messages_read':
                if (data.message_ids) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            data.message_ids!.includes(msg.id) ? { ...msg, is_read: true } : msg
                        )
                    );
                }
                break;

            case 'error':
                console.error('WebSocket error message:', data);
                break;
        }
    }, [roomId]);

    // Send a chat message
    const sendMessage = useCallback((content: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected');
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'chat_message',
            content: content.trim(),
            message_type: 'text',
        }));
    }, []);

    // Send typing indicator
    const setTyping = useCallback((isTyping: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        wsRef.current.send(JSON.stringify({
            type: 'typing',
            is_typing: isTyping,
        }));

        // Auto-stop typing after 3 seconds
        if (isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'typing',
                        is_typing: false,
                    }));
                }
            }, 3000);
        }
    }, []);

    // Mark messages as read
    const markMessagesRead = useCallback((messageIds: number[]) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        wsRef.current.send(JSON.stringify({
            type: 'mark_read',
            message_ids: messageIds,
        }));
    }, []);

    return {
        messages,
        sendMessage,
        setTyping,
        markMessagesRead,
        typingUsers,
        onlineUsers,
        isConnected,
        connectionError,
    };
}

// Hook to get unread messages count across all rooms
export function useUnreadMessagesCount() {
    const [unreadCount, setUnreadCount] = useState(0);

    // This would typically fetch from the API
    // For now, we'll use a simple polling mechanism
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/api/chat/rooms/', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });
                if (response.ok) {
                    const rooms = await response.json();
                    const total = rooms.reduce((sum: number, room: { unread_count: number }) =>
                        sum + (room.unread_count || 0), 0);
                    setUnreadCount(total);
                }
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    return unreadCount;
}
