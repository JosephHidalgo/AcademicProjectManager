import random
import string
from django.db import models
from django.conf import settings


def generate_project_code():
    """Genera un código único de 6 caracteres para el proyecto."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Project(models.Model):
    """Modelo para proyectos académicos."""
    
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('critical', 'Crítica'),
    ]
    
    title = models.CharField('título', max_length=255)
    description = models.TextField('descripción')
    general_objectives = models.TextField('objetivos generales')
    specific_objectives = models.TextField('objetivos específicos')
    start_date = models.DateField('fecha de inicio')
    end_date = models.DateField('fecha de fin')
    priority = models.CharField(
        'prioridad',
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    code = models.CharField(
        'código',
        max_length=6,
        unique=True,
        default=generate_project_code
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects',
        verbose_name='creado por'
    )
    created_at = models.DateTimeField('fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('fecha de actualización', auto_now=True)
    
    class Meta:
        verbose_name = 'proyecto'
        verbose_name_plural = 'proyectos'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Asegurar código único
        while not self.code or Project.objects.filter(code=self.code).exclude(pk=self.pk).exists():
            self.code = generate_project_code()
        super().save(*args, **kwargs)


class Membership(models.Model):
    """Modelo para membresía de usuarios en proyectos."""
    
    ROLE_CHOICES = [
        ('leader', 'Líder'),
        ('member', 'Integrante'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name='usuario'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name='proyecto'
    )
    role = models.CharField(
        'rol',
        max_length=10,
        choices=ROLE_CHOICES,
        default='member'
    )
    joined_at = models.DateTimeField('fecha de unión', auto_now_add=True)
    
    class Meta:
        verbose_name = 'membresía'
        verbose_name_plural = 'membresías'
        unique_together = ['user', 'project']
    
    def __str__(self):
        return f'{self.user.email} - {self.project.title} ({self.get_role_display()})'
