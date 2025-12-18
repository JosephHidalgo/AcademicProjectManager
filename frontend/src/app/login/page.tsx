'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react';
import { useLogin, useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
    email: z.string().email('Ingresa un email válido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: login, isPending } = useLogin();
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = (data: LoginFormData) => {
        login(data);
    };

    return (
        <div className="min-h-screen flex bg-[#FDF8F3]">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                {/* Background with gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4A3728] via-[#5C4D3C] to-[#8B7355]" />

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A484] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#A0926D] opacity-10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight">Academic PM</h1>
                            <p className="text-white/50 text-xs">Project Management</p>
                        </div>
                    </div>

                    {/* Main Message */}
                    <div className="max-w-lg">
                        <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-6">
                            Gestiona tus proyectos académicos de manera profesional
                        </h2>
                        <p className="text-white/70 text-lg leading-relaxed mb-10">
                            Una plataforma diseñada para equipos universitarios. Organiza tareas,
                            colabora en tiempo real y alcanza tus objetivos académicos.
                        </p>

                        {/* Stats */}
                        <div className="flex gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">500+</p>
                                <p className="text-white/50 text-sm">Proyectos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">2K+</p>
                                <p className="text-white/50 text-sm">Tareas</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-white">150+</p>
                                <p className="text-white/50 text-sm">Equipos</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-white/40 text-sm">
                        © 2025 Academic Project Manager
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-[420px]">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center gap-3">
                            <div className="w-11 h-11 bg-[#8B7355] rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-semibold text-[#4A3728]">Academic PM</h1>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl shadow-elevated p-8 lg:p-10 border border-[#E8DFD5]">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-[#4A3728] mb-2">
                                Bienvenido
                            </h2>
                            <p className="text-[#7D6B5D]">
                                Ingresa tus credenciales para continuar
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    placeholder="tu@universidad.edu"
                                    className={`w-full h-12 px-4 rounded-xl border text-[#4A3728] placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.email
                                        ? 'border-[#A65D57] bg-[#FDF0EE]'
                                        : 'border-[#E8DFD5] bg-[#FDFBF8] hover:bg-white'
                                        }`}
                                    {...register('email')}
                                    disabled={isPending}
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-[#A65D57]">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className={`w-full h-12 px-4 pr-12 rounded-xl border text-[#4A3728] placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.password
                                            ? 'border-[#A65D57] bg-[#FDF0EE]'
                                            : 'border-[#E8DFD5] bg-[#FDFBF8] hover:bg-white'
                                            }`}
                                        {...register('password')}
                                        disabled={isPending}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8A99A] hover:text-[#7D6B5D] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-[#A65D57]">{errors.password.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-gradient-to-r from-[#8B7355] to-[#A0926D] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#8B7355]/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Ingresando...
                                    </>
                                ) : (
                                    <>
                                        Iniciar sesión
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[#E8DFD5] text-center">
                            <p className="text-[#7D6B5D]">
                                ¿No tienes una cuenta?{' '}
                                <Link
                                    href="/register"
                                    className="font-medium text-[#8B7355] hover:text-[#6B5544] transition-colors"
                                >
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
