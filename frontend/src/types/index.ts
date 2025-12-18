// User types
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

// Auth types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
}

export interface AuthResponse {
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

// Project types
export interface Project {
    id: number;
    title: string;
    description: string;
    general_objectives: string;
    specific_objectives: string;
    start_date: string;
    end_date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    priority_display: string;
    code: string;
    created_by: number;
    created_by_name: string;
    members_count?: number;
    tasks_count?: number;
    completed_tasks_count?: number;
    user_role?: string;
    created_at: string;
    updated_at?: string;
}

export interface Membership {
    id: number;
    user: number;
    user_email: string;
    user_name: string;
    role: 'leader' | 'member';
    role_display: string;
    joined_at: string;
}

export interface ProjectCreate {
    title: string;
    description: string;
    general_objectives: string;
    specific_objectives: string;
    start_date: string;
    end_date: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

// Task types
export interface Task {
    id: number;
    project: number;
    project_title?: string;
    name: string;
    description: string;
    deadline: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    priority_display: string;
    status: 'pending' | 'in_progress' | 'completed';
    status_display: string;
    assigned_to: number | null;
    assigned_to_name: string | null;
    created_by?: number;
    created_by_name?: string;
    documents?: TaskDocument[];
    documents_count?: number;
    created_at: string;
    updated_at?: string;
    completed_at: string | null;
}

export interface TaskCreate {
    name: string;
    description: string;
    deadline: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigned_to?: number | null;
}

export interface TaskUpdate {
    name?: string;
    description?: string;
    deadline?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assigned_to?: number | null;
}

export interface TaskStatusUpdate {
    status: 'pending' | 'in_progress' | 'completed';
}

export interface TaskDocument {
    id: number;
    task: number;
    file: string;
    name: string;
    uploaded_by: number;
    uploaded_by_name: string;
    filename: string;
    uploaded_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
