'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, BookOpen, Check } from 'lucide-react';
import { useRegister, useAuth } from '@/hooks/useAuth';

const registerSchema = z
    .object({
        first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
        last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
        email: z.string().email('Ingresa un email válido'),
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        password_confirm: z.string(),
    })
    .refine((data) => data.password === data.password_confirm, {
        message: 'Las contraseñas no coinciden',
        path: ['password_confirm'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: registerUser, isPending } = useRegister();
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
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = (data: RegisterFormData) => {
        registerUser(data);
    };

    const features = [
        'Gestión completa de proyectos',
        'Asignación de tareas a miembros',
        'Seguimiento de progreso',
        'Documentos compartidos',
    ];

    return (
        <div className="min-h-screen flex bg-[#FDF8F3]">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#6B5544] via-[#8B7355] to-[#A0926D]" />

                {/* Decorative elements */}
                <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-white opacity-5 rounded-full blur-3xl" />

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
                            Únete a la comunidad académica
                        </h2>
                        <p className="text-white/70 text-lg leading-relaxed mb-10">
                            Crea tu cuenta y comienza a gestionar tus proyectos universitarios
                            de manera profesional y colaborativa.
                        </p>

                        {/* Features */}
                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white/80">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-white/40 text-sm">
                        © 2025 Academic Project Manager
                    </p>
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-[420px] py-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
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
                                Crear cuenta
                            </h2>
                            <p className="text-[#7D6B5D]">
                                Completa tus datos para registrarte
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        placeholder="Juan"
                                        className={`w-full h-11 px-4 rounded-xl border text-[#4A3728] text-sm placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.first_name
                                            ? 'border-[#A65D57] bg-[#FDF0EE]'
                                            : 'border-[#E8DFD5] bg-[#FDFBF8] hover:bg-white'
                                            }`}
                                        {...register('first_name')}
                                        disabled={isPending}
                                    />
                                    {errors.first_name && (
                                        <p className="mt-1 text-xs text-[#A65D57]">{errors.first_name.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                        Apellido
                                    </label>
                                    <input
                                        placeholder="Pérez"
                                        className={`w-full h-11 px-4 rounded-xl border text-[#4A3728] text-sm placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.last_name
                                            ? 'border-[#A65D57] bg-[#FDF0EE]'
                                            : 'border-[#E8DFD5] bg-[#FDFBF8] hover:bg-white'
                                            }`}
                                        {...register('last_name')}
                                        disabled={isPending}
                                    />
                                    {errors.last_name && (
                                        <p className="mt-1 text-xs text-[#A65D57]">{errors.last_name.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    placeholder="tu@universidad.edu"
                                    className={`w-full h-11 px-4 rounded-xl border text-[#4A3728] text-sm placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.email
                                        ? 'border-[#A65D57] bg-[#FDF0EE]'
                                        : 'border-[#E8DFD5] bg-[#FDFBF8] hover:bg-white'
                                        }`}
                                    {...register('email')}
                                    disabled={isPending}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-[#A65D57]">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Mínimo 8 caracteres"
                                        className={`w-full h-11 px-4 pr-12 rounded-xl border text-[#4A3728] text-sm placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.password
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
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-[#A65D57]">{errors.password.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#5C4D3C] mb-2">
                                    Confirmar contraseña
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Repite tu contraseña"
                                    className={`w-full h-11 px-4 rounded-xl border text-[#4A3728] text-sm placeholder:text-[#B8A99A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/20 focus:border-[#8B7355] ${errors.password_confirm
                                        ? 'border-[#A65D57] bg-[#FDF0EE]'
                                        : 'border-[#E8DFD5] bg-[#FDFBF8] hover:bg-white'
                                        }`}
                                    {...register('password_confirm')}
                                    disabled={isPending}
                                />
                                {errors.password_confirm && (
                                    <p className="mt-1 text-xs text-[#A65D57]">{errors.password_confirm.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-11 bg-gradient-to-r from-[#8B7355] to-[#A0926D] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#8B7355]/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 mt-6"
                            >
                                {isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creando cuenta...
                                    </>
                                ) : (
                                    <>
                                        Crear cuenta
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-[#E8DFD5] text-center">
                            <p className="text-[#7D6B5D] text-sm">
                                ¿Ya tienes una cuenta?{' '}
                                <Link
                                    href="/login"
                                    className="font-medium text-[#8B7355] hover:text-[#6B5544] transition-colors"
                                >
                                    Inicia sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
