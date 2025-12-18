import { api } from '@/lib/api';

// Types for chat
export interface ChatRoom {
    id: number;
    name: string;
    room_type: 'group' | 'private';
    project: number | null;
    project_title: string | null;
    project_code: string | null;
    participants: ChatParticipant[];
    last_message: {
        id: number;
        content: string;
        sender_name: string;
        created_at: string;
        message_type: string;
    } | null;
    unread_count: number;
    created_at: string;
    updated_at: string;
}

export interface ChatParticipant {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export interface ChatMessage {
    id: number;
    chat_room: number;
    sender: ChatParticipant | null;
    content: string;
    message_type: 'text' | 'file' | 'image' | 'system';
    file: string | null;
    is_read: boolean;
    created_at: string;
    is_own_message: boolean;
}

export interface ChatMemberForPrivate {
    id: number;
    email: string;
    full_name: string;
    role: string;
    has_private_chat: boolean;
    chat_room_id: number | null;
}

export interface MessagesResponse {
    count: number;
    page: number;
    page_size: number;
    results: ChatMessage[];
}

export const chatService = {
    /**
     * Get all chat rooms for the current user
     */
    getChatRooms: async (): Promise<ChatRoom[]> => {
        const response = await api.get<ChatRoom[] | { results: ChatRoom[] }>('/chat/rooms/');
        // Handle both array and paginated response
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    /**
     * Get chat rooms for a specific project
     */
    getChatRoomsByProject: async (projectId: number): Promise<ChatRoom[]> => {
        const response = await api.get<ChatRoom[]>('/chat/rooms/by_project/', {
            params: { project_id: projectId }
        });
        return response.data;
    },

    /**
     * Get a single chat room by ID
     */
    getChatRoom: async (roomId: number): Promise<ChatRoom> => {
        const response = await api.get<ChatRoom>(`/chat/rooms/${roomId}/`);
        return response.data;
    },

    /**
     * Create or get a private chat with another user
     */
    createPrivateChat: async (projectId: number, otherUserId: number): Promise<ChatRoom> => {
        const response = await api.post<ChatRoom>('/chat/rooms/create_private/', {
            project_id: projectId,
            other_user_id: otherUserId
        });
        return response.data;
    },

    /**
     * Get messages for a chat room with pagination
     */
    getMessages: async (roomId: number, page: number = 1, pageSize: number = 50): Promise<MessagesResponse> => {
        const response = await api.get<MessagesResponse>(`/chat/rooms/${roomId}/messages/`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },

    /**
     * Send a message via REST API (alternative to WebSocket)
     */
    sendMessage: async (roomId: number, content: string, messageType: string = 'text'): Promise<ChatMessage> => {
        const response = await api.post<ChatMessage>(`/chat/rooms/${roomId}/send_message/`, {
            content,
            message_type: messageType
        });
        return response.data;
    },

    /**
     * Mark all messages in a room as read
     */
    markAsRead: async (roomId: number): Promise<void> => {
        await api.post(`/chat/rooms/${roomId}/mark_read/`);
    },

    /**
     * Get project members available for private chat
     */
    getProjectMembersForChat: async (projectId: number): Promise<ChatMemberForPrivate[]> => {
        const response = await api.get<ChatMemberForPrivate[]>('/chat/members/', {
            params: { project_id: projectId }
        });
        return response.data;
    },
};
