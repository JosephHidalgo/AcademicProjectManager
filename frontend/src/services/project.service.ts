import api from '@/lib/api';
import type { Project, ProjectCreate, Membership, PaginatedResponse } from '@/types';

export const projectService = {
    async getProjects(): Promise<Project[]> {
        const response = await api.get<PaginatedResponse<Project> | Project[]>('/projects/');
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    async getProject(id: number): Promise<Project> {
        const response = await api.get<Project>(`/projects/${id}/`);
        return response.data;
    },

    async createProject(data: ProjectCreate): Promise<Project> {
        const response = await api.post<Project>('/projects/', data);
        return response.data;
    },

    async updateProject(id: number, data: Partial<ProjectCreate>): Promise<Project> {
        const response = await api.put<Project>(`/projects/${id}/`, data);
        return response.data;
    },

    async deleteProject(id: number): Promise<void> {
        await api.delete(`/projects/${id}/`);
    },

    async joinProject(code: string): Promise<Project> {
        const response = await api.post<Project>('/projects/join/', { code });
        return response.data;
    },

    async leaveProject(id: number): Promise<void> {
        await api.post(`/projects/${id}/leave/`);
    },

    async getMembers(id: number): Promise<Membership[]> {
        const response = await api.get<PaginatedResponse<Membership> | Membership[]>(
            `/projects/${id}/members/`
        );
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    async transferLeadership(projectId: number, userId: number): Promise<void> {
        await api.post(`/projects/${projectId}/transfer-leadership/`, { user_id: userId });
    },

    async removeMember(projectId: number, userId: number): Promise<void> {
        await api.post(`/projects/${projectId}/remove-member/`, { user_id: userId });
    },
};
