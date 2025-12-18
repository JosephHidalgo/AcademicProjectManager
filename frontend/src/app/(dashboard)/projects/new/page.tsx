'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/services/project.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewProjectPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        general_objectives: '',
        specific_objectives: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        priority: 'medium' as const,
    });

    const createProject = useMutation({
        mutationFn: () => projectService.createProject(formData),
        onSuccess: (data) => {
            toast.success('Proyecto creado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.push(`/projects/${data.id}`);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: Record<string, string[]> } };
            if (err.response?.data) {
                Object.values(err.response.data).flat().forEach((msg) => toast.error(msg));
            } else {
                toast.error('Error al crear el proyecto');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createProject.mutate();
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nuevo Proyecto</h1>
                    <p className="text-slate-500">Crea un nuevo proyecto académico</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <FolderPlus className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle>Información del Proyecto</CardTitle>
                            <CardDescription>
                                Completa los datos básicos de tu proyecto
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Título del proyecto *
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Sistema de Gestión Académica"
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
                                placeholder="Describe brevemente de qué trata el proyecto..."
                                rows={3}
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Objetivos Generales *
                            </label>
                            <textarea
                                value={formData.general_objectives}
                                onChange={(e) => setFormData({ ...formData, general_objectives: e.target.value })}
                                placeholder="¿Cuáles son los objetivos principales del proyecto?"
                                rows={2}
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Objetivos Específicos *
                            </label>
                            <textarea
                                value={formData.specific_objectives}
                                onChange={(e) => setFormData({ ...formData, specific_objectives: e.target.value })}
                                placeholder="Lista los objetivos específicos..."
                                rows={2}
                                required
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Fecha de inicio *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Fecha de fin *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    min={formData.start_date}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Prioridad
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Link href="/projects" className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={createProject.isPending}
                            >
                                {createProject.isPending ? 'Creando...' : 'Crear Proyecto'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
