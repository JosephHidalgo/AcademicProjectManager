'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Calendar,
    User,
    FileText,
    Upload,
    Download,
    Trash2,
    Edit,
    X,
    Save,
} from 'lucide-react';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDate, getPriorityColor, getStatusColor, getStatusLabel, getPriorityLabel } from '@/lib/utils';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const projectId = parseInt(params.id as string);
    const taskId = parseInt(params.taskId as string);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        deadline: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        assigned_to: null as number | null,
    });

    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => taskService.getTask(taskId),
    });

    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectService.getProject(projectId),
    });

    const { data: members = [] } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => projectService.getMembers(projectId),
    });

    const { data: documents = [] } = useQuery({
        queryKey: ['task-documents', taskId],
        queryFn: () => taskService.getDocuments(taskId),
        enabled: !!task,
    });

    // Initialize edit form when task loads
    useEffect(() => {
        if (task) {
            setEditForm({
                name: task.name,
                description: task.description,
                deadline: task.deadline,
                priority: task.priority,
                assigned_to: task.assigned_to,
            });
        }
    }, [task]);

    const updateStatus = useMutation({
        mutationFn: (status: 'pending' | 'in_progress' | 'completed') =>
            taskService.updateTaskStatus(taskId, { status }),
        onSuccess: () => {
            toast.success('Estado actualizado');
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
        },
        onError: () => {
            toast.error('Error al actualizar el estado');
        },
    });

    const updateTask = useMutation({
        mutationFn: () => taskService.updateTask(taskId, editForm),
        onSuccess: () => {
            toast.success('Tarea actualizada');
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
            setIsEditing(false);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: Record<string, string[]> } };
            if (err.response?.data) {
                Object.values(err.response.data).flat().forEach((msg) => toast.error(msg));
            } else {
                toast.error('Error al actualizar la tarea');
            }
        },
    });

    const deleteTask = useMutation({
        mutationFn: () => taskService.deleteTask(taskId),
        onSuccess: () => {
            toast.success('Tarea eliminada');
            queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
            router.push(`/projects/${projectId}`);
        },
        onError: () => {
            toast.error('Error al eliminar la tarea');
        },
    });

    const uploadDocument = useMutation({
        mutationFn: (file: File) => taskService.uploadDocument(taskId, file),
        onSuccess: () => {
            toast.success('Documento subido');
            queryClient.invalidateQueries({ queryKey: ['task-documents', taskId] });
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: Record<string, string[] | string> } };
            console.error('Upload Error:', err.response?.data);
            if (err.response?.data) {
                const messages = Object.values(err.response.data).flat();
                messages.forEach((msg) => toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
            } else {
                toast.error('Error al subir el documento');
            }
        },
    });

    const deleteDocument = useMutation({
        mutationFn: (docId: number) => taskService.deleteDocument(docId),
        onSuccess: () => {
            toast.success('Documento eliminado');
            queryClient.invalidateQueries({ queryKey: ['task-documents', taskId] });
        },
        onError: () => {
            toast.error('Error al eliminar el documento');
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadDocument.mutate(e.target.files[0]);
        }
    };

    const isLeader = members.find((m) => m.user === user?.id)?.role === 'leader';
    const isAssigned = task?.assigned_to === user?.id;
    const canEdit = isLeader || isAssigned;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold" style={{ color: '#4A3728' }}>Tarea no encontrada</h2>
                <Link href={`/projects/${projectId}`}>
                    <Button className="mt-4">Volver al proyecto</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Link href={`/projects/${projectId}`}>
                        <Button variant="ghost" size="icon" className="mt-1">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#4A3728' }}>{task.name}</h1>
                        <p style={{ color: '#7D6B5D' }} className="mt-1">{project?.title}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {isLeader && !isEditing && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                    if (confirm('¿Eliminar esta tarea?')) {
                                        deleteTask.mutate();
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Form Modal */}
            {isEditing && (
                <Card className="border-[#E8DFD5] shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle style={{ color: '#4A3728' }}>Editar Tarea</CardTitle>
                        <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-[#F5EDE4] rounded">
                            <X className="w-5 h-5" style={{ color: '#7D6B5D' }} />
                        </button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#4A3728' }}>
                                Nombre de la tarea *
                            </label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Nombre de la tarea"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#4A3728' }}>
                                Descripción *
                            </label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Descripción de la tarea"
                                rows={4}
                                className="w-full rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                                style={{ border: '1px solid #E8DFD5' }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#4A3728' }}>
                                    Fecha límite *
                                </label>
                                <Input
                                    type="date"
                                    value={editForm.deadline}
                                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#4A3728' }}>
                                    Prioridad
                                </label>
                                <select
                                    value={editForm.priority}
                                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                                    className="w-full h-10 rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                                    style={{ border: '1px solid #E8DFD5' }}
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="critical">Crítica</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#4A3728' }}>
                                    Asignar a
                                </label>
                                <select
                                    value={editForm.assigned_to || ''}
                                    onChange={(e) => setEditForm({ ...editForm, assigned_to: e.target.value ? parseInt(e.target.value) : null })}
                                    className="w-full h-10 rounded-lg px-3 text-sm focus:ring-2 focus:ring-[#8B7355] focus:border-transparent"
                                    style={{ border: '1px solid #E8DFD5' }}
                                >
                                    <option value="">Sin asignar</option>
                                    {members.map((member) => (
                                        <option key={member.user} value={member.user}>
                                            {member.user_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => updateTask.mutate()}
                                disabled={updateTask.isPending || !editForm.name || !editForm.description || !editForm.deadline}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {updateTask.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                {task.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2" style={{ color: '#4A3728' }}>
                                <FileText className="w-5 h-5" />
                                Documentos
                            </CardTitle>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploadDocument.isPending}
                                />
                                <Button size="sm" asChild disabled={uploadDocument.isPending}>
                                    <span>
                                        <Upload className="w-4 h-4 mr-1" />
                                        {uploadDocument.isPending ? 'Subiendo...' : 'Subir'}
                                    </span>
                                </Button>
                            </label>
                        </CardHeader>
                        <CardContent>
                            {documents.length === 0 ? (
                                <p className="text-center py-8" style={{ color: '#7D6B5D' }}>
                                    No hay documentos adjuntos
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-3 rounded-lg"
                                            style={{ backgroundColor: '#F5EDE4' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5" style={{ color: '#8B7355' }} />
                                                <div>
                                                    <p className="font-medium text-sm" style={{ color: '#4A3728' }}>
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-xs" style={{ color: '#7D6B5D' }}>
                                                        {doc.uploaded_by_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={doc.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-white rounded-lg"
                                                    style={{ color: '#8B7355' }}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                {(isLeader || doc.uploaded_by === user?.id) && (
                                                    <button
                                                        onClick={() => deleteDocument.mutate(doc.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader>
                            <CardTitle style={{ color: '#4A3728' }}>Estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <select
                                value={task.status}
                                onChange={(e) => updateStatus.mutate(e.target.value as 'pending' | 'in_progress' | 'completed')}
                                disabled={!canEdit || updateStatus.isPending}
                                className={cn(
                                    'w-full h-10 rounded-lg px-3 text-sm font-medium border-0',
                                    getStatusColor(task.status),
                                    canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                                )}
                            >
                                <option value="pending">Pendiente</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="completed">Completada</option>
                            </select>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <Card className="border-[#E8DFD5] shadow-sm">
                        <CardHeader>
                            <CardTitle style={{ color: '#4A3728' }}>Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs mb-1" style={{ color: '#7D6B5D' }}>Prioridad</p>
                                <span className={cn(
                                    'px-3 py-1 rounded-full text-xs font-medium',
                                    getPriorityColor(task.priority)
                                )}>
                                    {getPriorityLabel(task.priority)}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs mb-1" style={{ color: '#7D6B5D' }}>Fecha límite</p>
                                <p className="flex items-center gap-2 text-sm" style={{ color: '#4A3728' }}>
                                    <Calendar className="w-4 h-4" style={{ color: '#7D6B5D' }} />
                                    {formatDate(task.deadline)}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs mb-1" style={{ color: '#7D6B5D' }}>Asignado a</p>
                                <p className="flex items-center gap-2 text-sm" style={{ color: '#4A3728' }}>
                                    <User className="w-4 h-4" style={{ color: '#7D6B5D' }} />
                                    {task.assigned_to_name || 'Sin asignar'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs mb-1" style={{ color: '#7D6B5D' }}>Creado por</p>
                                <p className="flex items-center gap-2 text-sm" style={{ color: '#4A3728' }}>
                                    <User className="w-4 h-4" style={{ color: '#7D6B5D' }} />
                                    {task.created_by_name}
                                </p>
                            </div>

                            {task.completed_at && (
                                <div>
                                    <p className="text-xs mb-1" style={{ color: '#7D6B5D' }}>Completada el</p>
                                    <p className="text-sm" style={{ color: '#4A3728' }}>
                                        {formatDate(task.completed_at)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
