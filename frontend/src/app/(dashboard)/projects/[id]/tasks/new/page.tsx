'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Plus, ListTodo } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewTaskPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const projectId = parseInt(params.id as string);

    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => projectService.getProject(projectId),
    });

    const { data: members = [] } = useQuery({
        queryKey: ['project-members', projectId],
        queryFn: () => projectService.getMembers(projectId),
    });

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        deadline: '',
        priority: 'medium' as const,
        assigned_to: null as number | null,
    });

    const createTask = useMutation({
        mutationFn: () => taskService.createTask(projectId, formData),
        onSuccess: (data) => {
            toast.success('Tarea creada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
            router.push(`/projects/${projectId}/tasks/${data.id}`);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: Record<string, string[]> } };
            if (err.response?.data) {
                Object.values(err.response.data).flat().forEach((msg) => toast.error(msg));
            } else {
                toast.error('Error al crear la tarea');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createTask.mutate();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/projects/${projectId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nueva Tarea</h1>
                    <p className="text-slate-500">{project?.title}</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <ListTodo className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle>Información de la Tarea</CardTitle>
                            <CardDescription>
                                Define los detalles de la nueva tarea
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Nombre de la tarea *
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Diseñar base de datos"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Descripción *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe qué se debe hacer en esta tarea..."
                                rows={4}
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Fecha límite *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Prioridad
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                                    className="w-full h-11 rounded-lg border border-slate-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                    <option value="critical">Crítica</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Asignar a
                            </label>
                            <select
                                value={formData.assigned_to || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    assigned_to: e.target.value ? parseInt(e.target.value) : null
                                })}
                                className="w-full h-11 rounded-lg border border-slate-300 px-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Sin asignar</option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.user}>
                                        {member.user_name} {member.role === 'leader' ? '(Líder)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Link href={`/projects/${projectId}`} className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={createTask.isPending}
                            >
                                {createTask.isPending ? 'Creando...' : 'Crear Tarea'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
