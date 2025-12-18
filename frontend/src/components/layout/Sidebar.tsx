'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    MessageCircle,
    LogOut,
    ChevronDown,
    ChevronRight,
    Plus,
    BookOpen,
    Menu,
    X,
    Sun,
    Moon,
    Bell,
} from 'lucide-react';
import { useAuth, useLogout } from '@/hooks/useAuth';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { chatService } from '@/services/chat.service';
import { useTheme } from '@/hooks/useTheme';

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Proyectos', href: '/projects', icon: FolderKanban },
    { name: 'Mis Tareas', href: '/tasks', icon: CheckSquare },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { mutate: logout } = useLogout();
    const { theme, toggleTheme } = useTheme();
    const [projectsExpanded, setProjectsExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
    });

    const { data: myTasks = [] } = useQuery({
        queryKey: ['my-tasks'],
        queryFn: taskService.getMyTasks,
    });

    // Fetch chat rooms for unread count
    const { data: chatRooms = [] } = useQuery({
        queryKey: ['chat-rooms'],
        queryFn: chatService.getChatRooms,
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Calculate total unread messages
    const totalUnreadMessages = Array.isArray(chatRooms)
        ? chatRooms.reduce((sum, room) => sum + (room.unread_count || 0), 0)
        : 0;

    // Count urgent and pending tasks
    const getDaysRemaining = (deadline: string) => {
        const now = new Date();
        const end = new Date(deadline);
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const pendingTasks = myTasks.filter((t) => t.status === 'pending');
    const urgentTasks = myTasks.filter((t) =>
        t.status !== 'completed' && getDaysRemaining(t.deadline) <= 3
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full" style={{ backgroundColor: '#FFFDF9' }}>
            {/* Logo Section */}
            <div className="flex items-center gap-4 px-6 h-20 border-b" style={{ borderColor: '#E8DFD5' }}>
                <div className="logo-icon">
                    <BookOpen />
                </div>
                <div className="flex-1">
                    <h1 className="font-bold text-lg" style={{ color: '#4A3728' }}>Academic PM</h1>
                    <p className="text-xs" style={{ color: '#7D6B5D' }}>Project Management</p>
                </div>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg transition-colors hover:bg-[#F5EDE4]"
                    title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                    style={{ color: '#7D6B5D' }}
                >
                    {theme === 'light' ? (
                        <Moon className="w-5 h-5" />
                    ) : (
                        <Sun className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {mainNavigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    // Show badge for tasks
                    const showTaskBadge = item.href === '/tasks' && pendingTasks.length > 0;
                    const showUrgentBadge = item.href === '/tasks' && urgentTasks.length > 0;

                    // Show badge for chat
                    const showChatBadge = item.href === '/chat' && totalUnreadMessages > 0;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="relative">
                                <item.icon />
                                {(showUrgentBadge || showChatBadge) && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                            </div>
                            <span className="flex-1">{item.name}</span>
                            {showTaskBadge && (
                                <span
                                    className="px-2 py-0.5 text-xs font-bold rounded-full"
                                    style={{
                                        backgroundColor: urgentTasks.length > 0 ? '#FDECEA' : '#FFF8E7',
                                        color: urgentTasks.length > 0 ? '#A65D57' : '#C4A055'
                                    }}
                                >
                                    {pendingTasks.length}
                                </span>
                            )}
                            {showChatBadge && (
                                <span
                                    className="px-2 py-0.5 text-xs font-bold rounded-full"
                                    style={{
                                        backgroundColor: '#8B7355',
                                        color: 'white'
                                    }}
                                >
                                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                                </span>
                            )}
                        </Link>
                    );
                })}

                {/* Urgent Tasks Alert */}
                {urgentTasks.length > 0 && (
                    <div
                        className="mx-2 mt-4 p-3 rounded-xl border"
                        style={{
                            backgroundColor: theme === 'dark' ? '#3A2828' : '#FDECEA',
                            borderColor: theme === 'dark' ? '#5A3838' : '#F5D5D2'
                        }}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#A65D57' }}>
                            <Bell className="w-4 h-4" />
                            <span>{urgentTasks.length} tarea{urgentTasks.length > 1 ? 's' : ''} urgente{urgentTasks.length > 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: theme === 'dark' ? '#CCA5A5' : '#8B5A5A' }}>
                            Fecha límite en {urgentTasks.length === 1 ? 'menos de 3 días' : 'los próximos 3 días'}
                        </p>
                    </div>
                )}

                {/* Recent Projects Section */}
                <div className="pt-8">
                    <button
                        onClick={() => setProjectsExpanded(!projectsExpanded)}
                        className="flex items-center justify-between w-full px-4 py-3 text-sm font-bold uppercase tracking-wider"
                        style={{ color: '#7D6B5D' }}
                    >
                        <span>Proyectos Recientes</span>
                        {projectsExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                        ) : (
                            <ChevronRight className="w-5 h-5" />
                        )}
                    </button>

                    {projectsExpanded && (
                        <div className="mt-2 space-y-1">
                            {projects.slice(0, 5).map((project) => {
                                const isActive = pathname === `/projects/${project.id}`;
                                const progress = project.tasks_count
                                    ? Math.round((project.completed_tasks_count || 0) / project.tasks_count * 100)
                                    : 0;
                                return (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
                                        style={{
                                            color: isActive ? '#4A3728' : '#7D6B5D',
                                            backgroundColor: isActive ? '#F5EDE4' : 'transparent'
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C4A484' }} />
                                            <span className="truncate flex-1">{project.title}</span>
                                            <span className="text-xs" style={{ color: '#B8A99A' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        {/* Mini progress bar */}
                                        <div
                                            className="ml-6 mt-1.5 h-1 rounded-full overflow-hidden"
                                            style={{ backgroundColor: '#E8DFD5' }}
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: progress === 100
                                                        ? '#6B9080'
                                                        : 'linear-gradient(90deg, #8B7355, #A0926D)'
                                                }}
                                            />
                                        </div>
                                    </Link>
                                );
                            })}

                            {projects.length > 5 && (
                                <Link
                                    href="/projects"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium"
                                    style={{ color: '#8B7355' }}
                                >
                                    Ver todos ({projects.length})
                                </Link>
                            )}

                            {/* New Project Button */}
                            <Link
                                href="/projects/new"
                                onClick={() => setMobileOpen(false)}
                                className="btn btn-outline flex items-center gap-3 mx-2 mt-3"
                                style={{ width: 'calc(100% - 1rem)' }}
                            >
                                <Plus className="w-5 h-5" />
                                <span>Nuevo proyecto</span>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t" style={{ borderColor: '#E8DFD5' }}>
                <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors mb-3"
                    style={{ backgroundColor: '#F5EDE4' }}
                >
                    <div className="avatar avatar-lg">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate" style={{ color: '#4A3728' }}>
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm truncate" style={{ color: '#7D6B5D' }}>
                            {user?.email}
                        </p>
                    </div>
                </Link>
                <button
                    onClick={() => logout()}
                    className="btn btn-danger w-full"
                    style={{ backgroundColor: '#FDF5F4', color: '#A65D57', border: 'none' }}
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg"
                style={{ border: '1px solid #E8DFD5' }}
            >
                <Menu className="w-6 h-6" style={{ color: '#5C4D3C' }} />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40"
                    style={{ backgroundColor: 'rgba(74, 55, 40, 0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-5 right-4 p-2 z-10"
                    style={{ color: '#7D6B5D' }}
                >
                    <X className="w-6 h-6" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:block fixed inset-y-0 left-0 z-30 w-72"
                style={{ borderRight: '1px solid #E8DFD5' }}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
