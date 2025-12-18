# Script para crear datos de prueba
# Ejecutar con: python manage.py shell < seed_data.py

from users.models import User
from projects.models import Project, Membership
from tasks.models import Task
from datetime import date, timedelta
from django.utils import timezone

print("🌱 Creando datos de prueba...")

# =============================================
# USUARIOS
# =============================================
print("\n👤 Creando usuarios...")

# Usuario 1: Ana García (Líder de proyectos)
user1, created = User.objects.get_or_create(
    email='ana@test.com',
    defaults={
        'first_name': 'Ana',
        'last_name': 'García',
        'is_active': True,
    }
)
if created:
    user1.set_password('test1234')
    user1.save()
    print(f"  ✓ Creado: {user1.email}")
else:
    print(f"  - Ya existe: {user1.email}")

# Usuario 2: Carlos López (Miembro de equipo)
user2, created = User.objects.get_or_create(
    email='carlos@test.com',
    defaults={
        'first_name': 'Carlos',
        'last_name': 'López',
        'is_active': True,
    }
)
if created:
    user2.set_password('test1234')
    user2.save()
    print(f"  ✓ Creado: {user2.email}")
else:
    print(f"  - Ya existe: {user2.email}")

# Usuario 3: María Rodríguez (Miembro de equipo)
user3, created = User.objects.get_or_create(
    email='maria@test.com',
    defaults={
        'first_name': 'María',
        'last_name': 'Rodríguez',
        'is_active': True,
    }
)
if created:
    user3.set_password('test1234')
    user3.save()
    print(f"  ✓ Creado: {user3.email}")
else:
    print(f"  - Ya existe: {user3.email}")

# =============================================
# PROYECTOS
# =============================================
print("\n📁 Creando proyectos...")

today = date.today()

# Proyecto 1: Sistema de Gestión Escolar (todos participan)
project1, created = Project.objects.get_or_create(
    title='Sistema de Gestión Escolar',
    defaults={
        'description': 'Desarrollo de un sistema web para la gestión de estudiantes, profesores y cursos de una institución educativa.',
        'general_objectives': 'Crear un sistema integral para la administración escolar que facilite los procesos académicos.',
        'specific_objectives': '1. Módulo de registro de estudiantes\n2. Gestión de calificaciones\n3. Control de asistencia\n4. Reportes académicos',
        'start_date': today - timedelta(days=30),
        'end_date': today + timedelta(days=60),
        'priority': 'high',
        'created_by': user1,
    }
)
if created:
    print(f"  ✓ Creado: {project1.title} (Código: {project1.code})")
else:
    print(f"  - Ya existe: {project1.title}")

# Proyecto 2: App de Seguimiento de Hábitos (Ana y Carlos)
project2, created = Project.objects.get_or_create(
    title='App de Seguimiento de Hábitos',
    defaults={
        'description': 'Aplicación móvil para el seguimiento y formación de hábitos saludables con gamificación.',
        'general_objectives': 'Desarrollar una aplicación que ayude a los usuarios a crear y mantener hábitos positivos.',
        'specific_objectives': '1. Sistema de recordatorios\n2. Estadísticas de progreso\n3. Logros y recompensas\n4. Comunidad de usuarios',
        'start_date': today - timedelta(days=15),
        'end_date': today + timedelta(days=45),
        'priority': 'medium',
        'created_by': user2,
    }
)
if created:
    print(f"  ✓ Creado: {project2.title} (Código: {project2.code})")
else:
    print(f"  - Ya existe: {project2.title}")

# Proyecto 3: Plataforma de Tutorías Online (María y Ana)
project3, created = Project.objects.get_or_create(
    title='Plataforma de Tutorías Online',
    defaults={
        'description': 'Plataforma web para conectar estudiantes con tutores especializados en diferentes materias.',
        'general_objectives': 'Facilitar el acceso a tutorías personalizadas mediante una plataforma digital.',
        'specific_objectives': '1. Sistema de búsqueda de tutores\n2. Reserva de sesiones\n3. Videollamadas integradas\n4. Sistema de pagos',
        'start_date': today - timedelta(days=7),
        'end_date': today + timedelta(days=90),
        'priority': 'critical',
        'created_by': user3,
    }
)
if created:
    print(f"  ✓ Creado: {project3.title} (Código: {project3.code})")
else:
    print(f"  - Ya existe: {project3.title}")

# =============================================
# MEMBRESÍAS (quién está en cada proyecto)
# =============================================
print("\n👥 Asignando usuarios a proyectos...")

# Proyecto 1: Todos participan
Membership.objects.get_or_create(user=user1, project=project1, defaults={'role': 'leader'})
Membership.objects.get_or_create(user=user2, project=project1, defaults={'role': 'member'})
Membership.objects.get_or_create(user=user3, project=project1, defaults={'role': 'member'})
print(f"  ✓ {project1.title}: Ana (líder), Carlos, María")

# Proyecto 2: Carlos líder, Ana miembro
Membership.objects.get_or_create(user=user2, project=project2, defaults={'role': 'leader'})
Membership.objects.get_or_create(user=user1, project=project2, defaults={'role': 'member'})
print(f"  ✓ {project2.title}: Carlos (líder), Ana")

# Proyecto 3: María líder, Ana miembro
Membership.objects.get_or_create(user=user3, project=project3, defaults={'role': 'leader'})
Membership.objects.get_or_create(user=user1, project=project3, defaults={'role': 'member'})
print(f"  ✓ {project3.title}: María (líder), Ana")

# =============================================
# TAREAS
# =============================================
print("\n📋 Creando tareas...")

# Tareas para Proyecto 1 (Sistema Escolar)
tasks_p1 = [
    {'name': 'Diseño de base de datos', 'description': 'Crear el modelo ER y el esquema de la base de datos', 'deadline': today - timedelta(days=5), 'priority': 'high', 'status': 'completed', 'assigned_to': user1},
    {'name': 'Mockups de interfaz', 'description': 'Diseñar los wireframes y mockups de las principales pantallas', 'deadline': today - timedelta(days=2), 'priority': 'medium', 'status': 'completed', 'assigned_to': user2},
    {'name': 'Módulo de autenticación', 'description': 'Implementar login, registro y recuperación de contraseña', 'deadline': today + timedelta(days=2), 'priority': 'critical', 'status': 'in_progress', 'assigned_to': user1},
    {'name': 'CRUD de estudiantes', 'description': 'Crear las operaciones básicas para gestión de estudiantes', 'deadline': today + timedelta(days=5), 'priority': 'high', 'status': 'pending', 'assigned_to': user2},
    {'name': 'Módulo de calificaciones', 'description': 'Sistema para registrar y calcular promedios', 'deadline': today + timedelta(days=10), 'priority': 'high', 'status': 'pending', 'assigned_to': user3},
    {'name': 'Reportes en PDF', 'description': 'Generar reportes académicos exportables', 'deadline': today + timedelta(days=15), 'priority': 'medium', 'status': 'pending', 'assigned_to': user1},
]

for t in tasks_p1:
    task, created = Task.objects.get_or_create(
        project=project1,
        name=t['name'],
        defaults={
            'description': t['description'],
            'deadline': t['deadline'],
            'priority': t['priority'],
            'status': t['status'],
            'assigned_to': t['assigned_to'],
            'created_by': user1,
            'completed_at': timezone.now() if t['status'] == 'completed' else None
        }
    )
    if created:
        print(f"  ✓ [{project1.title[:15]}...] {t['name']}")

# Tareas para Proyecto 2 (App Hábitos)
tasks_p2 = [
    {'name': 'Investigación de mercado', 'description': 'Analizar apps similares y definir diferenciadores', 'deadline': today - timedelta(days=3), 'priority': 'medium', 'status': 'completed', 'assigned_to': user2},
    {'name': 'Diseño UX/UI', 'description': 'Crear el flujo de usuario y diseño visual', 'deadline': today + timedelta(days=1), 'priority': 'high', 'status': 'in_progress', 'assigned_to': user1},
    {'name': 'Sistema de notificaciones', 'description': 'Implementar recordatorios push', 'deadline': today + timedelta(days=7), 'priority': 'high', 'status': 'pending', 'assigned_to': user2},
    {'name': 'Dashboard de estadísticas', 'description': 'Gráficos de progreso del usuario', 'deadline': today + timedelta(days=14), 'priority': 'medium', 'status': 'pending', 'assigned_to': user1},
]

for t in tasks_p2:
    task, created = Task.objects.get_or_create(
        project=project2,
        name=t['name'],
        defaults={
            'description': t['description'],
            'deadline': t['deadline'],
            'priority': t['priority'],
            'status': t['status'],
            'assigned_to': t['assigned_to'],
            'created_by': user2,
            'completed_at': timezone.now() if t['status'] == 'completed' else None
        }
    )
    if created:
        print(f"  ✓ [{project2.title[:15]}...] {t['name']}")

# Tareas para Proyecto 3 (Tutorías)
tasks_p3 = [
    {'name': 'Definir arquitectura', 'description': 'Elegir tecnologías y diseñar la arquitectura', 'deadline': today + timedelta(days=0), 'priority': 'critical', 'status': 'in_progress', 'assigned_to': user3},
    {'name': 'Perfil de tutores', 'description': 'Página de perfil con experiencia y especialidades', 'deadline': today + timedelta(days=3), 'priority': 'high', 'status': 'pending', 'assigned_to': user1},
    {'name': 'Sistema de reservas', 'description': 'Calendario y booking de sesiones', 'deadline': today + timedelta(days=10), 'priority': 'high', 'status': 'pending', 'assigned_to': user3},
    {'name': 'Integración videollamadas', 'description': 'Integrar Zoom o similar para las sesiones', 'deadline': today + timedelta(days=20), 'priority': 'medium', 'status': 'pending', 'assigned_to': user1},
    {'name': 'Pasarela de pago', 'description': 'Integrar Stripe para pagos', 'deadline': today + timedelta(days=30), 'priority': 'critical', 'status': 'pending', 'assigned_to': user3},
]

for t in tasks_p3:
    task, created = Task.objects.get_or_create(
        project=project3,
        name=t['name'],
        defaults={
            'description': t['description'],
            'deadline': t['deadline'],
            'priority': t['priority'],
            'status': t['status'],
            'assigned_to': t['assigned_to'],
            'created_by': user3,
            'completed_at': timezone.now() if t['status'] == 'completed' else None
        }
    )
    if created:
        print(f"  ✓ [{project3.title[:15]}...] {t['name']}")

print("\n" + "="*50)
print("✅ ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE!")
print("="*50)
print("\n📧 CREDENCIALES DE ACCESO:")
print("-" * 30)
print("👤 ana@test.com      / test1234")
print("👤 carlos@test.com   / test1234") 
print("👤 maria@test.com    / test1234")
print("-" * 30)
print(f"\n📁 Proyectos creados: {Project.objects.count()}")
print(f"📋 Tareas creadas: {Task.objects.count()}")
print(f"👥 Usuarios: {User.objects.count()}")
