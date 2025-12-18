'use client';

import { useEffect, useState, useCallback } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if notifications are supported
        setIsSupported('Notification' in window);
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!isSupported) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [isSupported]);

    const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
        if (!isSupported || permission !== 'granted') return null;

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }, [isSupported, permission]);

    const notifyUrgentTasks = useCallback((tasks: Array<{ name: string; deadline: string; project_title?: string }>) => {
        if (!isSupported || permission !== 'granted') return;

        const getDaysRemaining = (deadline: string) => {
            const now = new Date();
            const end = new Date(deadline);
            return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        };

        tasks.forEach(task => {
            const daysLeft = getDaysRemaining(task.deadline);
            let body = '';

            if (daysLeft <= 0) {
                body = `¡La tarea "${task.name}" está vencida!`;
            } else if (daysLeft === 1) {
                body = `La tarea "${task.name}" vence mañana`;
            } else if (daysLeft <= 3) {
                body = `La tarea "${task.name}" vence en ${daysLeft} días`;
            }

            if (body) {
                sendNotification('⚠️ Recordatorio de Tarea', {
                    body,
                    tag: `task-${task.name}`, // Prevents duplicate notifications
                });
            }
        });
    }, [isSupported, permission, sendNotification]);

    return {
        isSupported,
        permission,
        requestPermission,
        sendNotification,
        notifyUrgentTasks,
    };
}

// Hook to check and notify about urgent tasks periodically
export function useTaskReminders(tasks: Array<{ name: string; deadline: string; status: string; project_title?: string }>) {
    const { permission, notifyUrgentTasks, requestPermission, isSupported } = useNotifications();
    const [lastNotified, setLastNotified] = useState<string | null>(null);

    useEffect(() => {
        // Only run if permission is granted
        if (permission !== 'granted') return;

        // Get urgent tasks (not completed, deadline within 3 days)
        const getDaysRemaining = (deadline: string) => {
            const now = new Date();
            const end = new Date(deadline);
            return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        };

        const urgentTasks = tasks.filter(t =>
            t.status !== 'completed' &&
            getDaysRemaining(t.deadline) <= 3
        );

        // Check once per session (or once per hour if tab stays open)
        const now = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
        if (lastNotified !== now && urgentTasks.length > 0) {
            notifyUrgentTasks(urgentTasks);
            setLastNotified(now);
        }
    }, [tasks, permission, notifyUrgentTasks, lastNotified]);

    return {
        requestPermission,
        permission,
        isSupported,
    };
}
