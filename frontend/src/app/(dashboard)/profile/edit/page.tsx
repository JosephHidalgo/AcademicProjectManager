'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EditProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { updateUser } = useAuthStore();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
    });

    const updateProfile = useMutation({
        mutationFn: () => authService.updateProfile(formData),
        onSuccess: (data) => {
            toast.success('Perfil actualizado');
            updateUser(data);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            router.push('/profile');
        },
        onError: () => {
            toast.error('Error al actualizar el perfil');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate();
    };

    return (
        <div className="max-w-md mx-auto space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/profile">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Editar Perfil</h1>
                    <p className="text-slate-500">Actualiza tu información personal</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                        Modifica tu nombre y apellido
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Nombre
                            </label>
                            <Input
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Apellido
                            </label>
                            <Input
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Tu apellido"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Email
                            </label>
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="bg-slate-50"
                            />
                            <p className="text-xs text-slate-500">
                                El email no se puede cambiar
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Link href="/profile" className="flex-1">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={updateProfile.isPending}
                            >
                                {updateProfile.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
