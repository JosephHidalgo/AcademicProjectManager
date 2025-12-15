from django.contrib import admin
from .models import Task, TaskDocument


class TaskDocumentInline(admin.TabularInline):
    """Inline para documentos en tarea."""
    model = TaskDocument
    extra = 0
    readonly_fields = ('uploaded_at', 'uploaded_by')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin para tareas."""
    
    list_display = ('name', 'project', 'priority', 'status', 'assigned_to', 'deadline', 'created_at')
    list_filter = ('status', 'priority', 'deadline', 'created_at')
    search_fields = ('name', 'description', 'project__title', 'assigned_to__email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    inlines = [TaskDocumentInline]
    
    fieldsets = (
        ('Información básica', {'fields': ('project', 'name', 'description')}),
        ('Asignación', {'fields': ('assigned_to', 'created_by')}),
        ('Estado y prioridad', {'fields': ('status', 'priority', 'deadline')}),
        ('Fechas', {'fields': ('created_at', 'updated_at', 'completed_at')}),
    )


@admin.register(TaskDocument)
class TaskDocumentAdmin(admin.ModelAdmin):
    """Admin para documentos de tareas."""
    
    list_display = ('name', 'task', 'uploaded_by', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('name', 'task__name', 'uploaded_by__email')
    ordering = ('-uploaded_at',)
    readonly_fields = ('uploaded_at',)
