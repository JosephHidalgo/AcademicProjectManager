import api from '@/lib/api';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login/', credentials);
        return response.data;
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register/', data);
        return response.data;
    },

    async logout(refreshToken: string): Promise<void> {
        await api.post('/auth/logout/', { refresh: refreshToken });
    },

    async getProfile(): Promise<User> {
        const response = await api.get<User>('/auth/profile/');
        return response.data;
    },

    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.put<User>('/auth/profile/', data);
        return response.data;
    },

    async changePassword(data: {
        old_password: string;
        new_password: string;
        new_password2: string;
    }): Promise<void> {
        await api.post('/auth/change-password/', data);
    },
};
