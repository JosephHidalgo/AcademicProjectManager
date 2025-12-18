import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import type { LoginCredentials, RegisterData } from '@/types';

export function useAuth() {
    const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

    return {
        user,
        isAuthenticated,
        setAuth,
        clearAuth,
    };
}

export function useLogin() {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
        onSuccess: (data) => {
            setAuth(data.user, data.tokens.access, data.tokens.refresh);
            toast.success('¡Bienvenido!');
            router.push('/dashboard');
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { error?: string } } };
            const message = err.response?.data?.error || 'Error al iniciar sesión';
            toast.error(message);
        },
    });
}

export function useRegister() {
    const { setAuth } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: RegisterData) => authService.register(data),
        onSuccess: (data) => {
            setAuth(data.user, data.tokens.access, data.tokens.refresh);
            toast.success('¡Cuenta creada exitosamente!');
            router.push('/dashboard');
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: Record<string, string | string[]> } };
            if (err.response?.data) {
                const errors = err.response.data;
                Object.keys(errors).forEach((key) => {
                    const errorMessages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
                    errorMessages.forEach((msg: string) => {
                        toast.error(`${key}: ${msg}`);
                    });
                });
            } else {
                toast.error('Error al registrarse');
            }
        },
    });
}

export function useLogout() {
    const { refreshToken, clearAuth } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authService.logout(refreshToken || ''),
        onSuccess: () => {
            clearAuth();
            queryClient.clear();
            toast.success('Sesión cerrada');
            router.push('/login');
        },
        onError: () => {
            clearAuth();
            queryClient.clear();
            router.push('/login');
        },
    });
}

export function useProfile() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ['profile'],
        queryFn: authService.getProfile,
        enabled: isAuthenticated,
    });
}
