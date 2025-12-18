'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit,
    Copy,
    Users,
    CheckSquare,
    Calendar,
    Clock,
    Plus,
    LogOut,
    Trash2,
    Target,
    Crown,
    UserMinus,
    MoreVertical,
    AlertTriangle,
    X,
    FileDown,
    MessageCircle,
} from 'lucide-react';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate, getPriorityColor, getStatusColor, getStatusLabel, getPriorityLabel } from '@/lib/utils';

// Confirmation modal state type
type ConfirmModalState = {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmStyle: 'danger' | 'warning';
    onConfirm: () => void;
} | null;

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const projectId = parseInt(params.id as string);

    const [memberMenuOpen, setMemberMenuOpen] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(null);

    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectService.getProject(projectId),
    });

    const { data: members = [] } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => projectService.getMembers(projectId),
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['project-tasks', projectId],
        queryFn: () => taskService.getTasks(projectId),
    });

    const leaveProject = useMutation({
        mutationFn: () => projectService.leaveProject(projectId),
        onSuccess: () => {
            toast.success('Has salido del proyecto');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.push('/projects');
        },
        onError: () => {
            toast.error('Error al salir del proyecto');
        },
    });

    const deleteProject = useMutation({
        mutationFn: () => projectService.deleteProject(projectId),
        onSuccess: () => {
            toast.success('Proyecto eliminado');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.push('/projects');
        },
        onError: () => {
            toast.error('Error al eliminar el proyecto');
        },
    });

    const transferLeadership = useMutation({
        mutationFn: (userId: number) => projectService.transferLeadership(projectId, userId),
        onSuccess: () => {
            toast.success('Liderazgo transferido exitosamente');
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            setConfirmModal(null);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err.response?.data?.detail || 'Error al transferir liderazgo');
            setConfirmModal(null);
        },
    });

    const removeMember = useMutation({
        mutationFn: (userId: number) => projectService.removeMember(projectId, userId),
        onSuccess: () => {
            toast.success('Miembro eliminado del proyecto');
            queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
            setConfirmModal(null);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err.response?.data?.detail || 'Error al eliminar miembro');
            setConfirmModal(null);
        },
    });

    const copyCode = () => {
        navigator.clipboard.writeText(project?.code || '');
        toast.success('Código copiado al portapapeles');
    };

    // Export project to PDF
    const exportToPDF = () => {
        if (!project) return;

        const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('No se pudo abrir la ventana de impresión');
            return;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${project.title} - Reporte</title>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #4A3728; line-height: 1.6; }
                    h1 { color: #4A3728; margin-bottom: 8px; }
                    h2 { color: #8B7355; border-bottom: 2px solid #E8DFD5; padding-bottom: 8px; margin-top: 32px; }
                    .header-info { color: #7D6B5D; margin-bottom: 24px; }
                    .stats { display: flex; gap: 24px; margin: 24px 0; flex-wrap: wrap; }
                    .stat { background: #F5EDE4; padding: 16px 24px; border-radius: 8px; text-align: center; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #4A3728; }
                    .stat-label { font-size: 12px; color: #7D6B5D; }
                    .progress-bar { height: 8px; background: #E8DFD5; border-radius: 4px; margin: 16px 0; }
                    .progress-fill { height: 100%; background: linear-gradient(90deg, #8B7355, #6B9080); border-radius: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E8DFD5; }
                    th { background: #F5EDE4; color: #4A3728; font-weight: 600; }
                    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
                    .badge-pending { background: #FFF8E7; color: #C4A055; }
                    .badge-in_progress { background: #F5EDE4; color: #8B7355; }
                    .badge-completed { background: #EBF5EE; color: #6B9080; }
                    .member { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
                    .avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #8B7355, #A0926D); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; }
                    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E8DFD5; color: #B8A99A; font-size: 12px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <h1>${project.title}</h1>
                <div class="header-info">
                    <p><strong>Código:</strong> ${project.code} | <strong>Prioridad:</strong> ${project.priority_display}</p>
                    <p><strong>Fecha de entrega:</strong> ${new Date(project.end_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>${project.description || 'Sin descripción'}</p>
                </div>
                
                <div class="stats">
                    <div class="stat"><div class="stat-value">${members.length}</div><div class="stat-label">Miembros</div></div>
                    <div class="stat"><div class="stat-value">${tasks.length}</div><div class="stat-label">Tareas Totales</div></div>
                    <div class="stat"><div class="stat-value">${completedTasks.length}</div><div class="stat-label">Completadas</div></div>
                    <div class="stat"><div class="stat-value">${progress}%</div><div class="stat-label">Progreso</div></div>
                </div>
                
                <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
                
                <h2>📋 Tareas (${tasks.length})</h2>
                ${tasks.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>Tarea</th>
                            <th>Estado</th>
                            <th>Prioridad</th>
                            <th>Fecha Límite</th>
                            <th>Asignado a</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tasks.map(task => `
                            <tr>
                                <td>${task.name}</td>
                                <td><span class="badge badge-${task.status}">${getStatusLabel(task.status)}</span></td>
                                <td>${getPriorityLabel(task.priority)}</td>
                                <td>${new Date(task.deadline).toLocaleDateString('es-ES')}</td>
                                <td>${task.assigned_to_name || 'Sin asignar'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p>No hay tareas en este proyecto.</p>'}
                
                <h2>👥 Equipo (${members.length})</h2>
                ${members.map(member => `
                    <div class="member">
                        <div class="avatar">${(member.user_name || '').split(' ').map(n => n[0] || '').join('')}</div>
                        <div>
                            <strong>${member.user_name || 'Usuario'}</strong>
                            ${member.role === 'leader' ? ' 👑 Líder' : ''}
                            <br><span style="color: #7D6B5D; font-size: 12px;">${member.user_email || ''}</span>
                        </div>
                    </div>
                `).join('')}
                
                <div class="footer">
                    Generado el ${new Date().toLocaleString('es-ES')} • Academic Project Manager
                </div>
            </body>
            </html>

        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    // Handler to show transfer leadership modal
    const handleTransferLeadership = (userId: number, userName: string) => {
        setMemberMenuOpen(null);
        setConfirmModal({
            isOpen: true,
            title: 'Transferir Liderazgo',
            message: `¿Estás seguro de transferir el liderazgo a ${userName}? Tú te convertirás en miembro regular del proyecto.`,
            confirmText: 'Transferir',
            confirmStyle: 'warning',
            onConfirm: () => transferLeadership.mutate(userId),
        });
    };

    // Handler to show remove member modal
    const handleRemoveMember = (userId: number, userName: string) => {
        setMemberMenuOpen(null);
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Miembro',
            message: `¿Estás seguro de eliminar a ${userName} del proyecto? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            confirmStyle: 'danger',
            onConfirm: () => removeMember.mutate(userId),
        });
    };

    if (projectLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold" style={{ color: '#4A3728' }}>Proyecto no encontrado</h2>
                <Link href="/projects">
                    <Button className="mt-4">Volver a proyectos</Button>
                </Link>
            </div>
        );
    }

    const isLeader = members.find((m) => m.user === user?.id)?.role === 'leader';
    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return (
        <div className="space-y-6 pt-8 lg:pt-0">
            {/* Confirmation Modal */}
            {confirmModal?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setConfirmModal(null)}
                    />
                    {/* Modal */}
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <button
                            onClick={() => setConfirmModal(null)}
                            className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "p-3 rounded-full",
                                confirmModal.confirmStyle === 'danger' ? 'bg-red-100' : 'bg-amber-100'
                            )}>
                                <AlertTriangle className={cn(
                                    "w-6 h-6",
                                    confirmModal.confirmStyle === 'danger' ? 'text-red-600' : 'text-amber-600'
                                )} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold" style={{ color: '#4A3728' }}>
                                    {confirmModal.title}
                                </h3>
                                <p className="mt-2 text-sm" style={{ color: '#5C4D3C' }}>
                                    {confirmModal.message}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmModal(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => confirmModal.onConfirm()}
                                className={cn(
                                    confirmModal.confirmStyle === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                                )}
                                disabled={transferLeadership.isPending || removeMember.isPending}
                            >
                                {transferLeadership.isPending || removeMember.isPending
                                    ? 'Procesando...'
                                    : confirmModal.confirmText}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Link href="/projects">
                        <Button variant="ghost" size="icon" className="mt-1">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold" style={{ color: '#4A3728' }}>{project.title}</h1>
                            <span className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium',
                                getPriorityColor(project.priority)
                            )}>
                                {project.priority_display}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: '#7D6B5D' }}>
                            <button
                                onClick={copyCode}
                                className="flex items-center gap-1.5 hover:text-[#8B7355] transition-colors"
                            >
                                <span className="font-mono px-2 py-0.5 rounded" style={{ backgroundColor: '#F5EDE4' }}>
                                    {project.code}
                                </span>
                                <Copy className="w-4 h-4" />
                            </button>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {members.length} miembros
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Link href={`/chat?project=${projectId}`}>
                        <Button variant="outline">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={exportToPDF}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                    {isLeader && (
                        <>
                            <Link href={`/projects/${projectId}/edit`}>
                                <Button variant="outline">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                    setConfirmModal({
                                        isOpen: true,
                                        title: 'Eliminar Proyecto',
                                        message: '¿Estás seguro de eliminar este proyecto? Todos los datos asociados serán eliminados permanentemente.',
                                        confirmText: 'Eliminar Proyecto',
                                        confirmStyle: 'danger',
                                        onConfirm: () => deleteProject.mutate(),
                                    });
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                    {!isLeader && (
                        <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                setConfirmModal({
                                    isOpen: true,
                                    title: 'Salir del Proyecto',
                                    message: '¿Estás seguro de salir del proyecto? Perderás acceso a las tareas y documentos.',
                                    confirmText: 'Salir',
                                    confirmStyle: 'warning',
                                    onConfirm: () => leaveProject.mutate(),
                                });
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Salir
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-[#E8DFD5] shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#F5EDE4' }}>
                            <CheckSquare className="w-5 h-5" style={{ color: '#7D6B5D' }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: '#4A3728' }}>{tasks.length}</p>
                            <p className="text-xs" style={{ color: '#7D6B5D' }}>Total Tareas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E8DFD5] shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#FFF8E7' }}>
                            <Clock className="w-5 h-5" style={{ color: '#C4A055' }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: '#4A3728' }}>{pendingTasks.length}</p>
                            <p className="text-xs" style={{ color: '#7D6B5D' }}>Pendientes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E8DFD5] shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#EBF5EE' }}>
                            <Target className="w-5 h-5" style={{ color: '#6B9080' }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: '#4A3728' }}>{inProgressTasks.length}</p>
                            <p className="text-xs" style={{ color: '#7D6B5D' }}>En Progreso</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#E8DFD5] shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
                            <CheckSquare className="w-5 h-5" style={{ color: '#4CAF50' }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold" style={{ color: '#4A3728' }}>{completedTasks.length}</p>
                            <p className="text-xs" style={{ color: '#7D6B5D' }}>Completadas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader>
                            <CardTitle style={{ color: '#4A3728' }}>Descripción</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap" style={{ color: '#5C4D3C' }}>
                                {project.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Objectives */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader>
                            <CardTitle style={{ color: '#4A3728' }}>Objetivos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2" style={{ color: '#4A3728' }}>
                                    Objetivos Generales
                                </h4>
                                <p className="text-sm whitespace-pre-wrap" style={{ color: '#5C4D3C' }}>
                                    {project.general_objectives}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium mb-2" style={{ color: '#4A3728' }}>
                                    Objetivos Específicos
                                </h4>
                                <p className="text-sm whitespace-pre-wrap" style={{ color: '#5C4D3C' }}>
                                    {project.specific_objectives}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle style={{ color: '#4A3728' }}>Tareas</CardTitle>
                            <Link href={`/projects/${projectId}/tasks/new`}>
                                <Button size="sm">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Nueva Tarea
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckSquare className="w-12 h-12 mx-auto mb-3" style={{ color: '#D4C4B5' }} />
                                    <p style={{ color: '#7D6B5D' }}>No hay tareas aún</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={`/projects/${projectId}/tasks/${task.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5EDE4] transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    'w-2 h-2 rounded-full',
                                                    task.status === 'completed' ? 'bg-[#6B9080]' :
                                                        task.status === 'in_progress' ? 'bg-[#8B7355]' : 'bg-[#D4C4B5]'
                                                )} />
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate" style={{ color: '#4A3728' }}>
                                                        {task.name}
                                                    </p>
                                                    <p className="text-sm" style={{ color: '#7D6B5D' }}>
                                                        {task.assigned_to_name || 'Sin asignar'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    getStatusColor(task.status)
                                                )}>
                                                    {getStatusLabel(task.status)}
                                                </span>
                                                <span className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    getPriorityColor(task.priority)
                                                )}>
                                                    {getPriorityLabel(task.priority)}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Dates */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader>
                            <CardTitle style={{ color: '#4A3728' }}>Fechas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5" style={{ color: '#7D6B5D' }} />
                                <div>
                                    <p className="text-xs" style={{ color: '#7D6B5D' }}>Inicio</p>
                                    <p className="text-sm font-medium" style={{ color: '#4A3728' }}>
                                        {formatDate(project.start_date)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5" style={{ color: '#7D6B5D' }} />
                                <div>
                                    <p className="text-xs" style={{ color: '#7D6B5D' }}>Fin</p>
                                    <p className="text-sm font-medium" style={{ color: '#4A3728' }}>
                                        {formatDate(project.end_date)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Members with Management */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between" style={{ color: '#4A3728' }}>
                                <span>Miembros</span>
                                <span className="text-sm font-normal" style={{ color: '#7D6B5D' }}>
                                    {members.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 p-2 rounded-lg relative group hover:bg-[#F5EDE4] transition-colors"
                                    >
                                        <div
                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                            style={{ background: 'linear-gradient(135deg, #8B7355 0%, #A0926D 100%)' }}
                                        >
                                            {member.user_name?.split(' ').map(n => n[0]).join('') || '??'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: '#4A3728' }}>
                                                {member.user_name}
                                                {member.role === 'leader' && (
                                                    <Crown className="w-4 h-4 inline-block ml-1" style={{ color: '#C4A055' }} />
                                                )}
                                            </p>
                                            <p className="text-xs" style={{ color: '#7D6B5D' }}>
                                                {member.role_display}
                                            </p>
                                        </div>

                                        {/* Chat Button - For non-self members */}
                                        {member.user !== user?.id && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const { chatService } = await import('@/services/chat.service');
                                                        const chatRoom = await chatService.createPrivateChat(projectId, member.user);
                                                        router.push(`/chat/${chatRoom.id}`);
                                                    } catch (error) {
                                                        console.error('Error creating chat:', error);
                                                    }
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-[#8B7355] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                style={{ color: '#7D6B5D' }}
                                                title={`Chatear con ${member.user_name}`}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Member Actions - Only for leader and non-self members */}
                                        {isLeader && member.user !== user?.id && (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setMemberMenuOpen(memberMenuOpen === member.id ? null : member.id)}
                                                    className="p-1 rounded hover:bg-[#F5EDE4] transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" style={{ color: '#7D6B5D' }} />
                                                </button>

                                                {memberMenuOpen === member.id && (
                                                    <div
                                                        className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border py-1 z-50"
                                                        style={{ borderColor: '#E8DFD5' }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTransferLeadership(member.user, member.user_name)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#F5EDE4] text-left"
                                                            style={{ color: '#4A3728' }}
                                                        >
                                                            <Crown className="w-4 h-4" style={{ color: '#C4A055' }} />
                                                            Transferir liderazgo
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMember(member.user, member.user_name)}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-left text-red-600"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                            Eliminar del proyecto
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Click outside to close member menu */}
            {memberMenuOpen && (
                <div
                    className="fixed inset-0"
                    onClick={() => setMemberMenuOpen(null)}
                />
            )}
        </div>
    );
}
