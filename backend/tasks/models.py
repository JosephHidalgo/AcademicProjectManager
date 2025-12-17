import os
from django.db import models
from django.conf import settings
from projects.models import Project


def task_document_path(instance, filename):
    """Genera la ruta para guardar documentos de tarea."""
    return f'tasks/{instance.task.project.id}/{instance.task.id}/{filename}'


class Task(models.Model):
    """Modelo para tareas dentro de un proyecto."""
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('critical', 'Crítica'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En progreso'),
        ('completed', 'Completada'),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='proyecto'
    )
    name = models.CharField('nombre', max_length=255)
    description = models.TextField('descripción')
    deadline = models.DateField('fecha límite')
    priority = models.CharField(
        'prioridad',
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    status = models.CharField(
        'estado',
        max_length=15,
        choices=STATUS_CHOICES,
        default='pending'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name='asignado a'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks',
        verbose_name='creado por'
    )
    created_at = models.DateTimeField('fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('fecha de actualización', auto_now=True)
    completed_at = models.DateTimeField('fecha de completado', null=True, blank=True)
    
    class Meta:
        verbose_name = 'tarea'
        verbose_name_plural = 'tareas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.name} - {self.project.title}'


class TaskDocument(models.Model):
    """Modelo para documentos adjuntos a tareas."""
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='tarea'
    )
    file = models.FileField(
        'archivo',
        upload_to=task_document_path
    )
    name = models.CharField('nombre', max_length=255)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_documents',
        verbose_name='subido por'
    )
    uploaded_at = models.DateTimeField('fecha de subida', auto_now_add=True)
    
    class Meta:
        verbose_name = 'documento'
        verbose_name_plural = 'documentos'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.name
    
    def filename(self):
        return os.path.basename(self.file.name)
