'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
    Plus,
    Users,
    FolderKanban,
    CheckSquare,
    UserPlus,
    Star,
    Search,
    Filter,
    ArrowUpDown,
    Calendar,
} from 'lucide-react';
import { projectService } from '@/services/project.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatShortDate, getPriorityColor } from '@/lib/utils';

// Favorites helpers
const getFavorites = (): number[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('project-favorites');
    return stored ? JSON.parse(stored) : [];
};

const toggleFavorite = (projectId: number): number[] => {
    const current = getFavorites();
    const newFavorites = current.includes(projectId)
        ? current.filter(id => id !== projectId)
        : [...current, projectId];
    localStorage.setItem('project-favorites', JSON.stringify(newFavorites));
    return newFavorites;
};

type SortOption = 'name' | 'priority' | 'date' | 'progress';
type FilterOption = 'all' | 'favorites' | 'leader' | 'member';

export default function ProjectsPage() {
    const [favorites, setFavorites] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
    });

    // Load favorites on mount
    useEffect(() => {
        setFavorites(getFavorites());
    }, []);

    const handleToggleFavorite = (e: React.MouseEvent, projectId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorites(toggleFavorite(projectId));
    };

    // Filter and sort projects
    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        // Role/favorites filter
        switch (filterBy) {
            case 'favorites':
                result = result.filter(p => favorites.includes(p.id));
                break;
            case 'leader':
                result = result.filter(p => p.user_role === 'Líder');
                break;
            case 'member':
                result = result.filter(p => p.user_role === 'Integrante');
                break;
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'priority':
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'date':
                result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
                break;
            case 'progress':
                result.sort((a, b) => {
                    const progressA = a.tasks_count ? (a.completed_tasks_count || 0) / a.tasks_count : 0;
                    const progressB = b.tasks_count ? (b.completed_tasks_count || 0) / b.tasks_count : 0;
                    return progressB - progressA;
                });
                break;
        }

        return result;
    }, [projects, searchQuery, filterBy, sortBy, favorites]);

    const getProgress = (completed: number = 0, total: number = 0) => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-8 lg:pt-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#4A3728' }}>Mis Proyectos</h1>
                    <p style={{ color: '#7D6B5D' }} className="mt-1">
                        Gestiona y visualiza todos tus proyectos académicos
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/projects/join">
                        <Button variant="outline">
                            <UserPlus className="w-4 h-4" />
                            Unirse
                        </Button>
                    </Link>
                    <Link href="/projects/new">
                        <Button>
                            <Plus className="w-4 h-4" />
                            Nuevo Proyecto
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search and Filters */}
            {projects.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7D6B5D' }} />
                        <Input
                            placeholder="Buscar proyectos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
                            className={filterBy !== 'all' ? 'border-[#8B7355] text-[#8B7355]' : ''}
                        >
                            <Filter className="w-4 h-4" />
                            Filtrar
                        </Button>
                        {showFilterMenu && (
                            <div
                                className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border z-20 py-1"
                                style={{ borderColor: '#E8DFD5' }}
                            >
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'favorites', label: '⭐ Favoritos' },
                                    { value: 'leader', label: '👑 Soy Líder' },
                                    { value: 'member', label: '👤 Soy Miembro' },
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => { setFilterBy(option.value as FilterOption); setShowFilterMenu(false); }}
                                        className={cn(
                                            'w-full text-left px-4 py-2 text-sm hover:bg-[#F5EDE4]',
                                            filterBy === option.value ? 'bg-[#F5EDE4] font-medium' : ''
                                        )}
                                        style={{ color: '#4A3728' }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort Button */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            Ordenar
                        </Button>
                        {showSortMenu && (
                            <div
                                className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border z-20 py-1"
                                style={{ borderColor: '#E8DFD5' }}
                            >
                                {[
                                    { value: 'name', label: 'Nombre' },
                                    { value: 'priority', label: 'Prioridad' },
                                    { value: 'date', label: 'Fecha límite' },
                                    { value: 'progress', label: 'Progreso' },
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => { setSortBy(option.value as SortOption); setShowSortMenu(false); }}
                                        className={cn(
                                            'w-full text-left px-4 py-2 text-sm hover:bg-[#F5EDE4]',
                                            sortBy === option.value ? 'bg-[#F5EDE4] font-medium' : ''
                                        )}
                                        style={{ color: '#4A3728' }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredProjects.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border" style={{ borderColor: '#E8DFD5' }}>
                    <FolderKanban className="w-16 h-16 mx-auto mb-4" style={{ color: '#D4C4B5' }} />
                    <h3 className="text-lg font-medium mb-2" style={{ color: '#4A3728' }}>
                        {projects.length === 0 ? 'No tienes proyectos aún' : 'No se encontraron proyectos'}
                    </h3>
                    <p className="mb-4 max-w-md mx-auto" style={{ color: '#7D6B5D' }}>
                        {projects.length === 0
                            ? 'Crea tu primer proyecto o únete a uno existente con un código de invitación.'
                            : 'Ajusta los filtros o el término de búsqueda.'}
                    </p>
                    {projects.length === 0 && (
                        <div className="flex gap-3 justify-center">
                            <Link href="/projects/join">
                                <Button variant="outline">
                                    <UserPlus className="w-4 h-4" />
                                    Unirse a Proyecto
                                </Button>
                            </Link>
                            <Link href="/projects/new">
                                <Button>
                                    <Plus className="w-4 h-4" />
                                    Crear Proyecto
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                    const progress = getProgress(project.completed_tasks_count, project.tasks_count);
                    const isFavorite = favorites.includes(project.id);

                    return (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                            <div className="card card-hover h-full">
                                {/* Project Header */}
                                <div
                                    className="h-24 rounded-t-xl p-4 flex items-end justify-between"
                                    style={{ background: 'linear-gradient(135deg, #8B7355 0%, #A0926D 100%)' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}
                                    >
                                        {project.title.charAt(0)}
                                    </div>
                                    <button
                                        onClick={(e) => handleToggleFavorite(e, project.id)}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                    >
                                        <Star
                                            className={cn(
                                                'w-5 h-5 transition-colors',
                                                isFavorite ? 'fill-yellow-300 text-yellow-300' : 'text-white/70'
                                            )}
                                        />
                                    </button>
                                </div>

                                {/* Project Content */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-semibold line-clamp-1" style={{ color: '#4A3728' }}>
                                            {project.title}
                                        </h3>
                                        <p className="text-sm line-clamp-2 mt-1" style={{ color: '#7D6B5D' }}>
                                            {project.description || 'Sin descripción'}
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span style={{ color: '#7D6B5D' }}>Progreso</span>
                                            <span style={{ color: '#4A3728' }} className="font-medium">{progress}%</span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFD5' }}>
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${progress}%`,
                                                    background: progress === 100
                                                        ? 'linear-gradient(90deg, #6B9080, #4A7A6A)'
                                                        : progress > 50
                                                            ? 'linear-gradient(90deg, #8B7355, #6B9080)'
                                                            : 'linear-gradient(90deg, #C4A055, #8B7355)'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#E8DFD5' }}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1" style={{ color: '#7D6B5D' }}>
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm">{project.members_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1" style={{ color: '#7D6B5D' }}>
                                                <CheckSquare className="w-4 h-4" />
                                                <span className="text-sm">{project.tasks_count || 0}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1" style={{ color: '#B8A99A' }}>
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-xs">{formatShortDate(project.end_date)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
