from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    """Manager personalizado para el modelo de usuario."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Crear y guardar un usuario regular."""
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Crear y guardar un superusuario."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Modelo de usuario personalizado que usa email para autenticación."""
    
    email = models.EmailField(
        'correo electrónico',
        unique=True,
        error_messages={
            'unique': 'Ya existe un usuario con este correo electrónico.',
        }
    )
    first_name = models.CharField('nombres', max_length=150)
    last_name = models.CharField('apellidos', max_length=150)
    is_active = models.BooleanField('activo', default=True)
    is_staff = models.BooleanField('staff', default=False)
    date_joined = models.DateTimeField('fecha de registro', auto_now_add=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Retorna el nombre completo del usuario."""
        return f'{self.first_name} {self.last_name}'.strip()
    
    def get_short_name(self):
        """Retorna el nombre corto del usuario."""
        return self.first_name
