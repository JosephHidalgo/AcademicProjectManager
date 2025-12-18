'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
    CheckSquare,
    Calendar,
    FolderKanban,
    Filter,
    ArrowUpDown,
    LayoutGrid,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react';
import { taskService } from '@/services/task.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, formatShortDate, getDaysRemaining } from '@/lib/utils';

type ViewMode = 'kanban' | 'calendar';
type SortOption = 'deadline' | 'priority' | 'name' | 'project';
type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type FilterPriority = 'all' | 'critical' | 'high' | 'medium' | 'low';

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

export default function MyTasksPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [sortBy, setSortBy] = useState<SortOption>('deadline');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [filterPriority, setFilterPriority] = useState<FilterPriority>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['my-tasks'],
        queryFn: taskService.getMyTasks,
    });

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.project_title?.toLowerCase().includes(query)
            );
        }

        // Filter by status
        if (filterStatus !== 'all') {
            result = result.filter(t => t.status === filterStatus);
        }

        // Filter by priority
        if (filterPriority !== 'all') {
            result = result.filter(t => t.priority === filterPriority);
        }

        // Sort
        switch (sortBy) {
            case 'deadline':
                result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
                break;
            case 'priority':
                result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'project':
                result.sort((a, b) => (a.project_title || '').localeCompare(b.project_title || ''));
                break;
        }

        return result;
    }, [tasks, searchQuery, filterStatus, filterPriority, sortBy]);

    const pendingTasks = filteredTasks.filter((t) => t.status === 'pending');
    const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
    const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

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
            const tasksOnDay = filteredTasks.filter(t => t.deadline === dateStr);
            days.push({ date: d, tasks: tasksOnDay, dateStr });
        }

        return days;
    }, [calendarMonth, filteredTasks]);

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const getStatusColorWarm = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-[#FFF8E7] text-[#C4A055]';
            case 'in_progress': return 'bg-[#F5EDE4] text-[#8B7355]';
            case 'completed': return 'bg-[#EBF5EE] text-[#6B9080]';
            default: return 'bg-[#F0EDE8] text-[#7D6B5D]';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'in_progress': return 'En Progreso';
            case 'completed': return 'Completada';
            default: return status;
        }
    };

    const getPriorityDot = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-[#C4A055]';
            case 'low': return 'bg-[#6B9080]';
            default: return 'bg-gray-400';
        }
    };

    const TaskCard = ({ task }: { task: typeof tasks[0] }) => {
        const daysLeft = getDaysRemaining(task.deadline);
        const isUrgent = daysLeft <= 3 && task.status !== 'completed';

        return (
            <Link href={`/projects/${task.project}/tasks/${task.id}`} className="block">
                <Card className={cn(
                    'border-[#E8DFD5] shadow-sm card-hover bg-white',
                    isUrgent && 'ring-2 ring-[#C4A055]/30'
                )}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full', getPriorityDot(task.priority))} />
                                <h3 className="font-medium text-[#4A3728] line-clamp-1">
                                    {task.name}
                                </h3>
                            </div>
                            <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                                getStatusColorWarm(task.status)
                            )}>
                                {getStatusLabel(task.status)}
                            </span>
                        </div>

                        <p className="text-sm text-[#7D6B5D] line-clamp-2 mb-3">
                            {task.description}
                        </p>

                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-[#7D6B5D]">
                                <FolderKanban className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">
                                    {task.project_title}
                                </span>
                            </div>
                            <div className={cn(
                                'flex items-center gap-1',
                                isUrgent ? 'text-[#C4A055]' : 'text-[#7D6B5D]'
                            )}>
                                <Calendar className="w-4 h-4" />
                                <span>{formatShortDate(task.deadline)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#4A3728]">Mis Tareas</h1>
                    <p className="text-[#7D6B5D] mt-1">
                        {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}
                        {filterStatus !== 'all' || filterPriority !== 'all' ? ' (filtrado)' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'kanban' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('kanban')}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Kanban
                    </Button>
                    <Button
                        variant={viewMode === 'calendar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('calendar')}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Calendario
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D6B5D]" />
                    <Input
                        placeholder="Buscar tareas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? 'border-[#8B7355] text-[#8B7355]' : ''}
                >
                    <Filter className="w-4 h-4" />
                    Filtros
                </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <Card className="border-[#E8DFD5] bg-white">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-[#4A3728] mb-2 block">Estado</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E8DFD5] bg-white text-[#4A3728]"
                                >
                                    <option value="all">Todos</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="completed">Completada</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[#4A3728] mb-2 block">Prioridad</label>
                                <select
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E8DFD5] bg-white text-[#4A3728]"
                                >
                                    <option value="all">Todas</option>
                                    <option value="critical">Crítica</option>
                                    <option value="high">Alta</option>
                                    <option value="medium">Media</option>
                                    <option value="low">Baja</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-[#4A3728] mb-2 block">Ordenar por</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="w-full h-10 px-3 rounded-lg border border-[#E8DFD5] bg-white text-[#4A3728]"
                                >
                                    <option value="deadline">Fecha límite</option>
                                    <option value="priority">Prioridad</option>
                                    <option value="name">Nombre</option>
                                    <option value="project">Proyecto</option>
                                </select>
                            </div>
                        </div>
                        {(filterStatus !== 'all' || filterPriority !== 'all' || searchQuery) && (
                            <button
                                onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setSearchQuery(''); }}
                                className="mt-3 text-sm text-[#8B7355] hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </CardContent>
                </Card>
            )}

            {tasks.length === 0 ? (
                <Card className="border-[#E8DFD5] shadow-sm bg-white">
                    <CardContent className="py-16 text-center">
                        <CheckSquare className="w-16 h-16 mx-auto text-[#D4C4B5] mb-4" />
                        <h3 className="text-lg font-medium text-[#4A3728] mb-2">
                            No tienes tareas asignadas
                        </h3>
                        <p className="text-[#7D6B5D] max-w-sm mx-auto">
                            Cuando te asignen tareas en algún proyecto, aparecerán aquí.
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === 'kanban' ? (
                /* Kanban View */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pending */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-[#4A3728] flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#C4A055]" />
                                Pendientes
                            </h2>
                            <span className="text-sm text-[#7D6B5D]">{pendingTasks.length}</span>
                        </div>
                        <div className="space-y-3">
                            {pendingTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                            {pendingTasks.length === 0 && (
                                <p className="text-sm text-[#B8A99A] text-center py-4">
                                    Sin tareas pendientes
                                </p>
                            )}
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-[#4A3728] flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#8B7355]" />
                                En Progreso
                            </h2>
                            <span className="text-sm text-[#7D6B5D]">{inProgressTasks.length}</span>
                        </div>
                        <div className="space-y-3">
                            {inProgressTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                            {inProgressTasks.length === 0 && (
                                <p className="text-sm text-[#B8A99A] text-center py-4">
                                    Sin tareas en progreso
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-[#4A3728] flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#6B9080]" />
                                Completadas
                            </h2>
                            <span className="text-sm text-[#7D6B5D]">{completedTasks.length}</span>
                        </div>
                        <div className="space-y-3">
                            {completedTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                            {completedTasks.length === 0 && (
                                <p className="text-sm text-[#B8A99A] text-center py-4">
                                    Sin tareas completadas
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Calendar View */
                <Card className="border-[#E8DFD5] bg-white">
                    <CardContent className="p-4">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                                className="p-2 hover:bg-[#F5EDE4] rounded-lg"
                            >
                                <ChevronLeft className="w-5 h-5 text-[#7D6B5D]" />
                            </button>
                            <h2 className="text-lg font-semibold text-[#4A3728]">
                                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                            </h2>
                            <button
                                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                                className="p-2 hover:bg-[#F5EDE4] rounded-lg"
                            >
                                <ChevronRight className="w-5 h-5 text-[#7D6B5D]" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                <div key={day} className="text-center text-sm font-medium text-[#7D6B5D] py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, i) => {
                                const isToday = day.date &&
                                    new Date().getDate() === day.date &&
                                    new Date().getMonth() === calendarMonth.getMonth() &&
                                    new Date().getFullYear() === calendarMonth.getFullYear();

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'min-h-[100px] p-2 rounded-lg border',
                                            day.date ? 'bg-white border-[#E8DFD5]' : 'bg-transparent border-transparent',
                                            isToday && 'ring-2 ring-[#8B7355]'
                                        )}
                                    >
                                        {day.date && (
                                            <>
                                                <div className={cn(
                                                    'text-sm font-medium mb-1',
                                                    isToday ? 'text-[#8B7355]' : 'text-[#4A3728]'
                                                )}>
                                                    {day.date}
                                                </div>
                                                <div className="space-y-1">
                                                    {day.tasks.slice(0, 3).map(task => (
                                                        <Link
                                                            key={task.id}
                                                            href={`/projects/${task.project}/tasks/${task.id}`}
                                                            className={cn(
                                                                'block text-xs p-1 rounded truncate',
                                                                getStatusColorWarm(task.status)
                                                            )}
                                                            title={task.name}
                                                        >
                                                            {task.name}
                                                        </Link>
                                                    ))}
                                                    {day.tasks.length > 3 && (
                                                        <p className="text-xs text-[#7D6B5D]">
                                                            +{day.tasks.length - 3} más
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
