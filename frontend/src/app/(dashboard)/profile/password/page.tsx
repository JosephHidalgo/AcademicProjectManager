'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Key, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [showPasswords, setShowPasswords] = useState(false);

    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        new_password2: '',
    });

    const changePassword = useMutation({
        mutationFn: () => authService.changePassword(formData),
        onSuccess: () => {
            toast.success('Contraseña cambiada exitosamente');
            router.push('/profile');
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: Record<string, string[]> } };
            if (err.response?.data) {
                Object.values(err.response.data).flat().forEach((msg) => toast.error(msg));
            } else {
                toast.error('Error al cambiar la contraseña');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.new_password !== formData.new_password2) {
            toast.error('Las nuevas contraseñas no coinciden');
            return;
        }

        if (formData.new_password.length < 8) {
            toast.error('La nueva contraseña debe tener al menos 8 caracteres');
            return;
        }

        changePassword.mutate();
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
                    <h1 className="text-2xl font-bold text-slate-900">Cambiar Contraseña</h1>
                    <p className="text-slate-500">Actualiza tu contraseña de acceso</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-amber-600" />
                    </div>
                    <CardTitle>Seguridad</CardTitle>
                    <CardDescription>
                        Ingresa tu contraseña actual y la nueva
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Contraseña actual
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={formData.old_password}
                                    onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Nueva contraseña
                            </label>
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={formData.new_password}
                                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                                placeholder="Mínimo 8 caracteres"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Confirmar nueva contraseña
                            </label>
                            <Input
                                type={showPasswords ? 'text' : 'password'}
                                value={formData.new_password2}
                                onChange={(e) => setFormData({ ...formData, new_password2: e.target.value })}
                                placeholder="Repite la nueva contraseña"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="show-passwords"
                                checked={showPasswords}
                                onChange={() => setShowPasswords(!showPasswords)}
                                className="rounded border-slate-300"
                            />
                            <label htmlFor="show-passwords" className="text-sm text-slate-600">
                                Mostrar contraseñas
                            </label>
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
                                disabled={changePassword.isPending}
                            >
                                {changePassword.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
