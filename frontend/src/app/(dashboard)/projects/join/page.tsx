'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Key } from 'lucide-react';
import Link from 'next/link';
import { projectService } from '@/services/project.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JoinProjectPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [code, setCode] = useState('');

    const joinProject = useMutation({
        mutationFn: () => projectService.joinProject(code.toUpperCase()),
        onSuccess: (data) => {
            toast.success('Te has unido al proyecto exitosamente');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            router.push(`/projects/${data.id}`);
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: string; code?: string[] } } };
            const message = err.response?.data?.error ||
                err.response?.data?.code?.[0] ||
                'Código inválido o proyecto no encontrado';
            toast.error(message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            toast.error('El código debe tener 6 caracteres');
            return;
        }
        joinProject.mutate();
    };

    return (
        <div className="max-w-md mx-auto space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Unirse a Proyecto</h1>
                    <p className="text-slate-500">Ingresa el código de invitación</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle>Código de Proyecto</CardTitle>
                    <CardDescription>
                        Solicita el código de 6 caracteres al líder del proyecto
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Código de invitación
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="ABC123"
                                    className="pl-10 text-center text-2xl font-mono tracking-widest uppercase"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-center">
                                {code.length}/6 caracteres
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={joinProject.isPending || code.length !== 6}
                        >
                            {joinProject.isPending ? 'Uniéndose...' : 'Unirse al Proyecto'}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/projects"
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Volver a proyectos
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
