'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MessageCircle,
    Users,
    User,
    Search,
    ArrowRight,
    Plus,
    X,
    ChevronRight,
} from 'lucide-react';
import { chatService, ChatRoom, ChatMemberForPrivate } from '@/services/chat.service';
import { projectService } from '@/services/project.service';
import { formatDistanceToNow } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function ChatListPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

    const { data: chatRooms = [], isLoading } = useQuery({
        queryKey: ['chat-rooms'],
        queryFn: chatService.getChatRooms,
        refetchInterval: 30000,
    });

    // Get projects for the modal
    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
        enabled: showNewChatModal,
    });

    // Get members for selected project
    const { data: projectMembers = [] } = useQuery({
        queryKey: ['project-members-chat', selectedProjectId],
        queryFn: () => chatService.getProjectMembersForChat(selectedProjectId!),
        enabled: !!selectedProjectId,
    });

    // Create private chat mutation
    const createPrivateChat = useMutation({
        mutationFn: ({ projectId, otherUserId }: { projectId: number; otherUserId: number }) =>
            chatService.createPrivateChat(projectId, otherUserId),
        onSuccess: (chatRoom) => {
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
            setShowNewChatModal(false);
            setSelectedProjectId(null);
            router.push(`/chat/${chatRoom.id}`);
        },
    });

    // Ensure chatRooms is an array
    const roomsArray = Array.isArray(chatRooms) ? chatRooms : [];

    // Filter rooms by search
    const filteredRooms = roomsArray.filter((room) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            room.name?.toLowerCase().includes(query) ||
            room.project_title?.toLowerCase().includes(query) ||
            room.participants?.some(
                (p) =>
                    p.first_name?.toLowerCase().includes(query) ||
                    p.last_name?.toLowerCase().includes(query)
            )
        );
    });

    // Separate group and private chats
    const groupChats = filteredRooms.filter((r) => r.room_type === 'group');
    const privateChats = filteredRooms.filter((r) => r.room_type === 'private');

    // Calculate total unread
    const totalUnread = roomsArray.reduce((sum, room) => sum + (room.unread_count || 0), 0);

    const handleMemberClick = (member: ChatMemberForPrivate) => {
        if (member.has_private_chat && member.chat_room_id) {
            // Already has a chat, navigate to it
            setShowNewChatModal(false);
            setSelectedProjectId(null);
            router.push(`/chat/${member.chat_room_id}`);
        } else if (selectedProjectId) {
            // Create new chat
            createPrivateChat.mutate({
                projectId: selectedProjectId,
                otherUserId: member.id,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-14 lg:pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#4A3728' }}>
                        Chat
                    </h1>
                    <p style={{ color: '#7D6B5D' }} className="mt-1">
                        {totalUnread > 0
                            ? `${totalUnread} mensaje${totalUnread > 1 ? 's' : ''} sin leer`
                            : 'Todas tus conversaciones'}
                    </p>
                </div>
                <Button onClick={() => setShowNewChatModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Chat
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: '#7D6B5D' }}
                />
                <input
                    placeholder="Buscar conversaciones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border text-sm"
                    style={{ borderColor: '#E8DFD5', color: '#4A3728' }}
                />
            </div>

            {/* No chats */}
            {roomsArray.length === 0 && (
                <div
                    className="bg-white rounded-xl border p-8 text-center"
                    style={{ borderColor: '#E8DFD5' }}
                >
                    <MessageCircle
                        className="w-16 h-16 mx-auto mb-4"
                        style={{ color: '#D4C4B5' }}
                    />
                    <h3 className="text-lg font-medium mb-2" style={{ color: '#4A3728' }}>
                        No tienes conversaciones
                    </h3>
                    <p className="max-w-md mx-auto mb-4" style={{ color: '#7D6B5D' }}>
                        Crea un nuevo chat privado o entra a un proyecto para ver su chat grupal.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => setShowNewChatModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Chat
                        </Button>
                        <Link href="/projects">
                            <Button variant="outline">Ver Proyectos</Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Group Chats */}
            {groupChats.length > 0 && (
                <div>
                    <h2
                        className="text-sm font-bold uppercase tracking-wider mb-3 px-1"
                        style={{ color: '#7D6B5D' }}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Chats de Proyecto ({groupChats.length})
                    </h2>
                    <div className="space-y-2">
                        {groupChats.map((room) => (
                            <ChatRoomCard key={room.id} room={room} />
                        ))}
                    </div>
                </div>
            )}

            {/* Private Chats */}
            {privateChats.length > 0 && (
                <div>
                    <h2
                        className="text-sm font-bold uppercase tracking-wider mb-3 px-1"
                        style={{ color: '#7D6B5D' }}
                    >
                        <User className="w-4 h-4 inline mr-2" />
                        Chats Privados ({privateChats.length})
                    </h2>
                    <div className="space-y-2">
                        {privateChats.map((room) => (
                            <ChatRoomCard key={room.id} room={room} />
                        ))}
                    </div>
                </div>
            )}

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => {
                            setShowNewChatModal(false);
                            setSelectedProjectId(null);
                        }}
                    />
                    {/* Modal */}
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[70vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div
                            className="flex items-center justify-between p-4 border-b"
                            style={{ borderColor: '#E8DFD5' }}
                        >
                            <h3 className="text-lg font-semibold" style={{ color: '#4A3728' }}>
                                {selectedProjectId ? 'Seleccionar Usuario' : 'Nuevo Chat Privado'}
                            </h3>
                            <button
                                onClick={() => {
                                    if (selectedProjectId) {
                                        setSelectedProjectId(null);
                                    } else {
                                        setShowNewChatModal(false);
                                    }
                                }}
                                className="p-1 rounded hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {!selectedProjectId ? (
                                <>
                                    <p className="text-sm mb-4" style={{ color: '#7D6B5D' }}>
                                        Selecciona un proyecto para chatear con sus miembros:
                                    </p>
                                    <div className="space-y-2">
                                        {projects.map((project) => (
                                            <button
                                                key={project.id}
                                                onClick={() => setSelectedProjectId(project.id)}
                                                className="w-full text-left p-3 rounded-lg border hover:bg-[#F5EDE4] transition-colors flex items-center justify-between"
                                                style={{ borderColor: '#E8DFD5' }}
                                            >
                                                <div>
                                                    <p className="font-medium" style={{ color: '#4A3728' }}>
                                                        {project.title}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#7D6B5D' }}>
                                                        {project.members_count || 0} miembros
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4" style={{ color: '#7D6B5D' }} />
                                            </button>
                                        ))}
                                        {projects.length === 0 && (
                                            <p className="text-center py-4" style={{ color: '#B8A99A' }}>
                                                No tienes proyectos
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm mb-4" style={{ color: '#7D6B5D' }}>
                                        Selecciona un miembro para iniciar un chat:
                                    </p>
                                    <div className="space-y-2">
                                        {projectMembers.map((member) => (
                                            <button
                                                key={member.id}
                                                onClick={() => handleMemberClick(member)}
                                                disabled={createPrivateChat.isPending}
                                                className="w-full text-left p-3 rounded-lg border hover:bg-[#F5EDE4] transition-colors flex items-center gap-3"
                                                style={{ borderColor: '#E8DFD5' }}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                                                    style={{ background: 'linear-gradient(135deg, #6B9080, #4A7A6A)' }}
                                                >
                                                    {member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium" style={{ color: '#4A3728' }}>
                                                        {member.full_name}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#7D6B5D' }}>
                                                        {member.role}
                                                        {member.has_private_chat && ' • Chat existente'}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4" style={{ color: '#7D6B5D' }} />
                                            </button>
                                        ))}
                                        {projectMembers.length === 0 && (
                                            <p className="text-center py-4" style={{ color: '#B8A99A' }}>
                                                No hay otros miembros en este proyecto
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ChatRoomCard({ room }: { room: ChatRoom }) {
    const isGroup = room.room_type === 'group';
    const hasUnread = room.unread_count > 0;

    // For private chats, get the other participant's name
    const getDisplayName = () => {
        if (isGroup) {
            return room.project_title || room.name || 'Chat Grupal';
        }
        if (room.participants && room.participants.length > 0) {
            const other = room.participants[0];
            return `${other.first_name} ${other.last_name}`;
        }
        return room.name || 'Chat Privado';
    };

    const getInitials = () => {
        if (isGroup) {
            return room.project_title?.charAt(0) || 'G';
        }
        if (room.participants && room.participants.length > 0) {
            const other = room.participants[0];
            return `${other.first_name?.[0] || ''}${other.last_name?.[0] || ''}`;
        }
        return 'C';
    };

    return (
        <Link href={`/chat/${room.id}`}>
            <div
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${hasUnread ? 'border-l-4 border-l-[#8B7355]' : ''
                    }`}
                style={{ borderColor: hasUnread ? undefined : '#E8DFD5' }}
            >
                {/* Avatar */}
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                    style={{
                        background: isGroup
                            ? 'linear-gradient(135deg, #8B7355, #A0926D)'
                            : 'linear-gradient(135deg, #6B9080, #4A7A6A)',
                    }}
                >
                    {isGroup ? <Users className="w-5 h-5" /> : getInitials()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3
                            className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}
                            style={{ color: '#4A3728' }}
                        >
                            {getDisplayName()}
                        </h3>
                        {room.last_message && (
                            <span className="text-xs flex-shrink-0 ml-2" style={{ color: '#B8A99A' }}>
                                {formatDistanceToNow(room.last_message.created_at)}
                            </span>
                        )}
                    </div>
                    {room.last_message ? (
                        <p
                            className={`text-sm truncate ${hasUnread ? 'font-medium' : ''}`}
                            style={{ color: hasUnread ? '#4A3728' : '#7D6B5D' }}
                        >
                            {room.last_message.sender_name}: {room.last_message.content}
                        </p>
                    ) : (
                        <p className="text-sm" style={{ color: '#B8A99A' }}>
                            Sin mensajes aún
                        </p>
                    )}
                    {isGroup && room.project_code && (
                        <p className="text-xs mt-1" style={{ color: '#B8A99A' }}>
                            Proyecto: {room.project_code}
                        </p>
                    )}
                </div>

                {/* Unread badge */}
                {hasUnread && (
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: '#8B7355' }}
                    >
                        {room.unread_count > 9 ? '9+' : room.unread_count}
                    </div>
                )}

                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: '#B8A99A' }} />
            </div>
        </Link>
    );
}
