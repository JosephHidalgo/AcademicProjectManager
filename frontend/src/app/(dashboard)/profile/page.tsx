'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Mail, Edit, Key, FolderKanban, CheckSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
    const { user } = useAuth();

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['my-tasks'],
        queryFn: taskService.getMyTasks,
    });

    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return (
        <div className="max-w-3xl mx-auto space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[#4A3728]">Mi Perfil</h1>
                <div className="flex gap-2">
                    <Link href="/profile/password">
                        <Button variant="outline">
                            <Key className="w-4 h-4 mr-2" />
                            Cambiar Contraseña
                        </Button>
                    </Link>
                    <Link href="/profile/edit">
                        <Button>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Perfil
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="border-[#E8DFD5] shadow-sm bg-white">
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#8B7355] to-[#A0926D] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-[#4A3728]">
                                {user?.first_name} {user?.last_name}
                            </h2>
                            <p className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-[#7D6B5D]">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-[#E8DFD5] shadow-sm bg-white">
                    <CardContent className="p-6 text-center">
                        <FolderKanban className="w-8 h-8 mx-auto text-[#8B7355] mb-3" />
                        <p className="text-3xl font-bold text-[#4A3728]">{projects.length}</p>
                        <p className="text-sm text-[#7D6B5D]">Proyectos</p>
                    </CardContent>
                </Card>

                <Card className="border-[#E8DFD5] shadow-sm bg-white">
                    <CardContent className="p-6 text-center">
                        <CheckSquare className="w-8 h-8 mx-auto text-[#6B9080] mb-3" />
                        <p className="text-3xl font-bold text-[#4A3728]">{completedTasks.length}</p>
                        <p className="text-sm text-[#7D6B5D]">Tareas Completadas</p>
                    </CardContent>
                </Card>

                <Card className="border-[#E8DFD5] shadow-sm bg-white">
                    <CardContent className="p-6 text-center">
                        <CheckSquare className="w-8 h-8 mx-auto text-[#C4A055] mb-3" />
                        <p className="text-3xl font-bold text-[#4A3728]">{tasks.length}</p>
                        <p className="text-sm text-[#7D6B5D]">Total Tareas Asignadas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-[#E8DFD5] shadow-sm bg-white">
                <CardHeader>
                    <CardTitle>Proyectos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {projects.length === 0 ? (
                        <p className="text-[#7D6B5D] text-center py-6">
                            No tienes proyectos aún
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {projects.slice(0, 5).map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5EDE4] transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#8B7355] to-[#A0926D] rounded-lg flex items-center justify-center text-white font-medium">
                                        {project.title.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#4A3728]">
                                            {project.title}
                                        </p>
                                        <p className="text-sm text-[#7D6B5D]">
                                            {project.user_role}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
