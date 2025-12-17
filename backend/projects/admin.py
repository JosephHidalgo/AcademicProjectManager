from django.contrib import admin
from .models import Project, Membership


class MembershipInline(admin.TabularInline):
    """Inline para membresías en proyecto."""
    model = Membership
    extra = 0
    readonly_fields = ('joined_at',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin para proyectos."""
    
    list_display = ('title', 'code', 'priority', 'start_date', 'end_date', 'created_by', 'created_at')
    list_filter = ('priority', 'start_date', 'end_date', 'created_at')
    search_fields = ('title', 'description', 'code', 'created_by__email')
    ordering = ('-created_at',)
    readonly_fields = ('code', 'created_at', 'updated_at')
    inlines = [MembershipInline]
    
    fieldsets = (
        ('Información básica', {'fields': ('title', 'description', 'code')}),
        ('Objetivos', {'fields': ('general_objectives', 'specific_objectives')}),
        ('Fechas y prioridad', {'fields': ('start_date', 'end_date', 'priority')}),
        ('Metadata', {'fields': ('created_by', 'created_at', 'updated_at')}),
    )


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    """Admin para membresías."""
    
    list_display = ('user', 'project', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')
    search_fields = ('user__email', 'project__title')
    ordering = ('-joined_at',)
