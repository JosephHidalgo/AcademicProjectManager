'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
    FolderKanban,
    CheckSquare,
    Clock,
    TrendingUp,
    Plus,
    ArrowRight,
    Users,
    AlertCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Bell,
    BellRing,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { useTaskReminders } from '@/hooks/useNotifications';

export default function DashboardPage() {
    const { user } = useAuth();
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
    });

    const { data: myTasks = [] } = useQuery({
        queryKey: ['my-tasks'],
        queryFn: taskService.getMyTasks,
    });

    const pendingTasks = myTasks.filter((t) => t.status === 'pending');
    const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress');
    const completedTasks = myTasks.filter((t) => t.status === 'completed');

    const getDaysRemaining = (deadline: string) => {
        const now = new Date();
        const end = new Date(deadline);
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const urgentTasks = myTasks
        .filter((t) => t.status !== 'completed' && getDaysRemaining(t.deadline) <= 3)
        .sort((a, b) => getDaysRemaining(a.deadline) - getDaysRemaining(b.deadline));

    // Task reminders hook for browser notifications
    const { requestPermission, permission, isSupported } = useTaskReminders(myTasks);

    // Calculate overall progress
    const overallProgress = useMemo(() => {
        if (myTasks.length === 0) return 0;
        return Math.round((completedTasks.length / myTasks.length) * 100);
    }, [myTasks, completedTasks]);

    // Calendar data
    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const days = [];

        for (let i = 0; i < startPadding; i++) {
            days.push({ date: null, tasks: [] });
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const tasksOnDay = myTasks.filter(t => t.deadline === dateStr && t.status !== 'completed');
            days.push({ date: d, tasks: tasksOnDay, dateStr });
        }

        return days;
    }, [calendarMonth, myTasks]);

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const stats = [
        {
            label: 'Proyectos Activos',
            value: projects.length,
            icon: FolderKanban,
            bgColor: 'bg-[#F5EDE4]',
            iconColor: 'text-[#8B7355]',
        },
        {
            label: 'Tareas Pendientes',
            value: pendingTasks.length,
            icon: Clock,
            bgColor: 'bg-[#FFF8E7]',
            iconColor: 'text-[#C4A055]',
        },
        {
            label: 'En Progreso',
            value: inProgressTasks.length,
            icon: TrendingUp,
            bgColor: 'bg-[#F0F4F8]',
            iconColor: 'text-[#6B7280]',
        },
        {
            label: 'Completadas',
            value: completedTasks.length,
            icon: CheckSquare,
            bgColor: 'bg-[#EBF5EE]',
            iconColor: 'text-[#6B9080]',
        },
    ];

    return (
        <div className="space-y-6 pt-8 lg:pt-0">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#4A3728]">
                        ¡Bienvenido, {user?.first_name}! 👋
                    </h1>
                    <p className="text-[#7D6B5D] mt-1">
                        Aquí está el resumen de tu trabajo
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/projects/new">
                        <button className="btn btn-primary">
                            <Plus className="w-4 h-4" />
                            Nuevo Proyecto
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl p-5 shadow-soft border border-[#E8DFD5]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#4A3728]">{stat.value}</p>
                                <p className="text-sm text-[#7D6B5D]">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress Ring + Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Ring */}
                <div className="bg-white rounded-xl shadow-soft border border-[#E8DFD5] p-6">
                    <h2 className="text-lg font-semibold text-[#4A3728] mb-4">Progreso General</h2>
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="#E8DFD5"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    fill="none"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={`${overallProgress * 3.52} 352`}
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8B7355" />
                                        <stop offset="100%" stopColor="#6B9080" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-[#4A3728]">{overallProgress}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-[#7D6B5D]">
                            {completedTasks.length} de {myTasks.length} tareas completadas
                        </p>
                    </div>
                </div>

                {/* Task Distribution */}
                <div className="bg-white rounded-xl shadow-soft border border-[#E8DFD5] p-6">
                    <h2 className="text-lg font-semibold text-[#4A3728] mb-4">Distribución de Tareas</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Pendientes', count: pendingTasks.length, color: '#C4A055' },
                            { label: 'En Progreso', count: inProgressTasks.length, color: '#8B7355' },
                            { label: 'Completadas', count: completedTasks.length, color: '#6B9080' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span style={{ color: '#4A3728' }}>{item.label}</span>
                                    <span style={{ color: '#7D6B5D' }}>{item.count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-[#E8DFD5]">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: myTasks.length > 0 ? `${(item.count / myTasks.length) * 100}%` : '0%',
                                            backgroundColor: item.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Calendar */}
                <div className="bg-white rounded-xl shadow-soft border border-[#E8DFD5] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[#4A3728]">Calendario</h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                                className="p-1 hover:bg-[#F5EDE4] rounded"
                            >
                                <ChevronLeft className="w-4 h-4 text-[#7D6B5D]" />
                            </button>
                            <button
                                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                                className="p-1 hover:bg-[#F5EDE4] rounded"
                            >
                                <ChevronRight className="w-4 h-4 text-[#7D6B5D]" />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-[#7D6B5D] mb-3">
                        {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </p>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                            <div key={i} className="py-1 text-[#B8A99A] font-medium">{d}</div>
                        ))}
                        {calendarDays.map((day, i) => {
                            const today = new Date();
                            const isToday = day.date === today.getDate() &&
                                calendarMonth.getMonth() === today.getMonth() &&
                                calendarMonth.getFullYear() === today.getFullYear();
                            return (
                                <div
                                    key={i}
                                    className={`py-1 rounded ${day.date ? 'hover:bg-[#F5EDE4] cursor-pointer' : ''} ${isToday ? 'bg-[#8B7355] text-white' : 'text-[#4A3728]'}`}
                                >
                                    {day.date}
                                    {day.tasks.length > 0 && (
                                        <div className="w-1 h-1 mx-auto mt-0.5 rounded-full bg-[#C4A055]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Urgent Tasks + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Urgent Tasks */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border border-[#E8DFD5]">
                    <div className="px-5 py-4 border-b border-[#E8DFD5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-[#C4A055]" />
                            <h2 className="text-base font-semibold text-[#4A3728]">
                                Tareas Urgentes ({urgentTasks.length})
                            </h2>
                        </div>
                        <Link href="/tasks" className="text-sm text-[#8B7355] hover:underline">
                            Ver todas
                        </Link>
                    </div>
                    <div className="divide-y divide-[#E8DFD5]">
                        {urgentTasks.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <CheckSquare className="w-12 h-12 mx-auto text-[#D4C4B5] mb-2" />
                                <p className="text-[#7D6B5D]">¡No tienes tareas urgentes!</p>
                            </div>
                        ) : (
                            urgentTasks.slice(0, 5).map((task) => {
                                const daysLeft = getDaysRemaining(task.deadline);
                                return (
                                    <Link
                                        key={task.id}
                                        href={`/projects/${task.project}/tasks/${task.id}`}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-[#FDFAF7] transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-[#4A3728] truncate">{task.name}</p>
                                            <p className="text-sm text-[#7D6B5D] truncate">{task.project_title}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="px-2 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: daysLeft <= 0 ? '#FDECEA' : '#FFF8E7',
                                                    color: daysLeft <= 0 ? '#A65D57' : '#C4A055'
                                                }}
                                            >
                                                {daysLeft <= 0 ? 'Vencida' : `${daysLeft} día${daysLeft > 1 ? 's' : ''}`}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-[#B8A99A]" />
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-soft border border-[#E8DFD5]">
                    <div className="px-5 py-4 border-b border-[#E8DFD5]">
                        <h2 className="text-base font-semibold text-[#4A3728]">Acciones Rápidas</h2>
                    </div>
                    <div className="p-4 space-y-2">
                        <Link href="/projects/new" className="block">
                            <button className="w-full h-10 px-4 rounded-lg border border-[#E8DFD5] bg-white text-[#5C4D3C] text-sm font-medium hover:bg-[#F5EDE4] transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Crear Proyecto
                            </button>
                        </Link>
                        <Link href="/projects/join" className="block">
                            <button className="w-full h-10 px-4 rounded-lg border border-[#E8DFD5] bg-white text-[#5C4D3C] text-sm font-medium hover:bg-[#F5EDE4] transition-colors flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Unirse a Proyecto
                            </button>
                        </Link>
                        <Link href="/tasks" className="block">
                            <button className="w-full h-10 px-4 rounded-lg border border-[#E8DFD5] bg-white text-[#5C4D3C] text-sm font-medium hover:bg-[#F5EDE4] transition-colors flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" />
                                Ver Mis Tareas
                            </button>
                        </Link>
                        {isSupported && permission !== 'granted' && (
                            <button
                                onClick={requestPermission}
                                className="w-full h-10 px-4 rounded-lg border border-[#E8DFD5] bg-white text-[#5C4D3C] text-sm font-medium hover:bg-[#F5EDE4] transition-colors flex items-center gap-2"
                            >
                                <Bell className="w-4 h-4" />
                                Activar Recordatorios
                            </button>
                        )}
                        {permission === 'granted' && (
                            <div className="flex items-center gap-2 px-4 py-2 text-sm text-[#6B9080]">
                                <BellRing className="w-4 h-4" />
                                Recordatorios activos
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
