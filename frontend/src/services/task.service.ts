import api, { fileApi } from '@/lib/api';
import type { Task, TaskCreate, TaskUpdate, TaskStatusUpdate, TaskDocument, PaginatedResponse } from '@/types';

export const taskService = {
    async getTasks(projectId: number): Promise<Task[]> {
        const response = await api.get<PaginatedResponse<Task> | Task[]>(
            `/tasks/project/${projectId}/`
        );
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    async getMyTasks(): Promise<Task[]> {
        const response = await api.get<PaginatedResponse<Task> | Task[]>('/tasks/my-tasks/');
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    async getTask(taskId: number): Promise<Task> {
        const response = await api.get<Task>(`/tasks/${taskId}/`);
        return response.data;
    },

    async createTask(projectId: number, data: TaskCreate): Promise<Task> {
        const response = await api.post<Task>(`/tasks/project/${projectId}/`, data);
        return response.data;
    },

    async updateTask(taskId: number, data: TaskUpdate): Promise<Task> {
        const response = await api.put<Task>(`/tasks/${taskId}/`, data);
        return response.data;
    },

    async deleteTask(taskId: number): Promise<void> {
        await api.delete(`/tasks/${taskId}/`);
    },

    async updateTaskStatus(taskId: number, data: TaskStatusUpdate): Promise<Task> {
        const response = await api.patch<Task>(`/tasks/${taskId}/status/`, data);
        return response.data;
    },

    // Document management
    async getDocuments(taskId: number): Promise<TaskDocument[]> {
        const response = await api.get<PaginatedResponse<TaskDocument> | TaskDocument[]>(
            `/tasks/${taskId}/documents/`
        );
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    async uploadDocument(taskId: number, file: File, name?: string): Promise<TaskDocument> {
        const formData = new FormData();
        formData.append('file', file);
        // Backend requires 'name' field - use provided name or file name
        formData.append('name', name || file.name);

        // Use the proxy - don't set Content-Type, let axios handle it
        const response = await api.post<TaskDocument>(
            `/tasks/${taskId}/documents/upload/`,
            formData
        );
        return response.data;
    },

    async deleteDocument(documentId: number): Promise<void> {
        await api.delete(`/tasks/documents/${documentId}/delete/`);
    },
};
