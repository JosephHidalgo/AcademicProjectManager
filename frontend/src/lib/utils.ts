import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    };
    return new Date(date).toLocaleDateString('es-PE', defaultOptions);
}

export function formatShortDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
        month: 'short',
        day: 'numeric',
    });
}

export function getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '??';
}

export function getDaysRemaining(deadline: string): number {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'critical':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'high':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'medium':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'low':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'in_progress':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pending':
            return 'bg-slate-100 text-slate-800 border-slate-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

export function getStatusLabel(status: string): string {
    switch (status) {
        case 'completed':
            return 'Completada';
        case 'in_progress':
            return 'En Progreso';
        case 'pending':
            return 'Pendiente';
        default:
            return status;
    }
}

export function getPriorityLabel(priority: string): string {
    switch (priority) {
        case 'critical':
            return 'Crítica';
        case 'high':
            return 'Alta';
        case 'medium':
            return 'Media';
        case 'low':
            return 'Baja';
        default:
            return priority;
    }
}
