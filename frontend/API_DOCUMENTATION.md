# 📚 Documentación de la API - Sistema de Gestión de Proyectos Académicos

## Índice
1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Usuarios](#usuarios)
4. [Proyectos](#proyectos)
5. [Membresías](#membresías)
6. [Tareas](#tareas)
7. [Documentos](#documentos)
8. [Chat](#chat)
9. [Códigos de Error](#códigos-de-error)

---

## Introducción

### URL Base
```
http://127.0.0.1:8000/api/
```

### Formato de Respuesta
Todas las respuestas están en formato **JSON**.

### Autenticación
La API utiliza **JWT (JSON Web Tokens)** para la autenticación. Después del login, recibirás dos tokens:
- `access`: Token de acceso (expira en 1 hora)
- `refresh`: Token de actualización (expira en 7 días)

### Headers Requeridos
Para endpoints protegidos, incluye el header:
```
Authorization: Bearer <tu_access_token>
Content-Type: application/json
```

### Prioridades Disponibles
| Valor | Descripción |
|-------|-------------|
| `low` | Baja |
| `medium` | Media |
| `high` | Alta |
| `critical` | Crítica |

### Estados de Tarea
| Valor | Descripción |
|-------|-------------|
| `pending` | Pendiente |
| `in_progress` | En progreso |
| `completed` | Completada |

---

## Autenticación

### 1. Registro de Usuario

Permite crear una nueva cuenta de usuario.

**Endpoint:** `POST /api/auth/register/`

**Autenticación requerida:** No

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `first_name` | string | Sí | Nombres del usuario |
| `last_name` | string | Sí | Apellidos del usuario |
| `email` | string | Sí | Correo electrónico (único) |
| `password` | string | Sí | Contraseña (mín. 8 caracteres) |
| `password_confirm` | string | Sí | Confirmación de contraseña |

**Ejemplo de Request:**
```json
{
    "first_name": "Juan Carlos",
    "last_name": "Pérez García",
    "email": "juan.perez@universidad.edu.pe",
    "password": "MiContraseña123!",
    "password_confirm": "MiContraseña123!"
}
```

**Respuesta Exitosa (201 Created):**
```json
{
    "message": "Usuario registrado exitosamente.",
    "user": {
        "id": 1,
        "email": "juan.perez@universidad.edu.pe",
        "first_name": "Juan Carlos",
        "last_name": "Pérez García",
        "full_name": "Juan Carlos Pérez García",
        "date_joined": "2025-01-15T10:30:00Z"
    },
    "tokens": {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

**Errores Comunes:**
| Código | Descripción |
|--------|-------------|
| 400 | Email ya registrado |
| 400 | Las contraseñas no coinciden |
| 400 | Contraseña muy corta o común |

---

### 2. Iniciar Sesión (Login)

Autentica al usuario y devuelve tokens JWT.

**Endpoint:** `POST /api/auth/login/`

**Autenticación requerida:** No

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string | Sí | Correo electrónico |
| `password` | string | Sí | Contraseña |

**Ejemplo de Request:**
```json
{
    "email": "juan.perez@universidad.edu.pe",
    "password": "MiContraseña123!"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Inicio de sesión exitoso.",
    "user": {
        "id": 1,
        "email": "juan.perez@universidad.edu.pe",
        "first_name": "Juan Carlos",
        "last_name": "Pérez García",
        "full_name": "Juan Carlos Pérez García",
        "date_joined": "2025-01-15T10:30:00Z"
    },
    "tokens": {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

**Errores Comunes:**
| Código | Descripción |
|--------|-------------|
| 401 | Credenciales inválidas |
| 401 | Cuenta desactivada |

---

### 3. Refrescar Token

Obtiene un nuevo access token usando el refresh token.

**Endpoint:** `POST /api/auth/token/refresh/`

**Autenticación requerida:** No

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `refresh` | string | Sí | Token de actualización |

**Ejemplo de Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

### 4. Cerrar Sesión (Logout)

Invalida el refresh token actual.

**Endpoint:** `POST /api/auth/logout/`

**Autenticación requerida:** Sí

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `refresh` | string | No | Token de actualización a invalidar |

**Ejemplo de Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Sesión cerrada exitosamente."
}
```

---

## Usuarios

### 5. Ver Perfil

Obtiene la información del usuario autenticado.

**Endpoint:** `GET /api/auth/profile/`

**Autenticación requerida:** Sí

**Respuesta Exitosa (200 OK):**
```json
{
    "id": 1,
    "email": "juan.perez@universidad.edu.pe",
    "first_name": "Juan Carlos",
    "last_name": "Pérez García",
    "full_name": "Juan Carlos Pérez García",
    "date_joined": "2025-01-15T10:30:00Z"
}
```

---

### 6. Actualizar Perfil

Actualiza la información del usuario autenticado.

**Endpoint:** `PUT /api/auth/profile/`

**Autenticación requerida:** Sí

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `first_name` | string | Sí | Nombres del usuario |
| `last_name` | string | Sí | Apellidos del usuario |

**Ejemplo de Request:**
```json
{
    "first_name": "Juan Carlos",
    "last_name": "Pérez Mendoza"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "id": 1,
    "email": "juan.perez@universidad.edu.pe",
    "first_name": "Juan Carlos",
    "last_name": "Pérez Mendoza",
    "full_name": "Juan Carlos Pérez Mendoza",
    "date_joined": "2025-01-15T10:30:00Z"
}
```

---

### 7. Cambiar Contraseña

Permite al usuario cambiar su contraseña.

**Endpoint:** `POST /api/auth/change-password/`

**Autenticación requerida:** Sí

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `old_password` | string | Sí | Contraseña actual |
| `new_password` | string | Sí | Nueva contraseña |
| `new_password_confirm` | string | Sí | Confirmación de nueva contraseña |

**Ejemplo de Request:**
```json
{
    "old_password": "MiContraseña123!",
    "new_password": "NuevaContraseña456!",
    "new_password_confirm": "NuevaContraseña456!"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Contraseña actualizada exitosamente.",
    "tokens": {
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```

**Errores Comunes:**
| Código | Descripción |
|--------|-------------|
| 400 | Contraseña actual incorrecta |
| 400 | Las contraseñas no coinciden |

---

## Proyectos

### 8. Listar Mis Proyectos

Obtiene todos los proyectos donde el usuario es miembro.

**Endpoint:** `GET /api/projects/`

**Autenticación requerida:** Sí

**Parámetros de Query (opcionales):**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | int | Número de página (paginación) |

**Respuesta Exitosa (200 OK):**
```json
{
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "title": "Sistema de Gestión Académica",
            "description": "Proyecto para gestionar actividades académicas",
            "priority": "high",
            "priority_display": "Alta",
            "start_date": "2025-01-01",
            "end_date": "2025-06-30",
            "code": "M4T73J",
            "created_by": 1,
            "created_by_name": "Juan Carlos Pérez García",
            "members_count": 3,
            "user_role": "Líder",
            "created_at": "2025-01-15T10:30:00Z"
        }
    ]
}
```

---

### 9. Crear Proyecto

Crea un nuevo proyecto. El creador se convierte automáticamente en líder.

**Endpoint:** `POST /api/projects/`

**Autenticación requerida:** Sí

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `title` | string | Sí | Título del proyecto |
| `description` | string | Sí | Descripción del proyecto |
| `general_objectives` | string | Sí | Objetivos generales |
| `specific_objectives` | string | Sí | Objetivos específicos |
| `start_date` | date | Sí | Fecha de inicio (YYYY-MM-DD) |
| `end_date` | date | Sí | Fecha de fin (YYYY-MM-DD) |
| `priority` | string | No | Prioridad (default: medium) |

**Ejemplo de Request:**
```json
{
    "title": "Sistema de Gestión Académica",
    "description": "Desarrollo de un sistema integral para la gestión de actividades académicas universitarias.",
    "general_objectives": "Desarrollar un sistema web que permita gestionar eficientemente las actividades académicas de los estudiantes y docentes.",
    "specific_objectives": "1. Implementar módulo de gestión de usuarios.\n2. Crear sistema de reportes académicos.\n3. Desarrollar módulo de seguimiento de proyectos.",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "priority": "high"
}
```

**Respuesta Exitosa (201 Created):**
```json
{
    "id": 1,
    "title": "Sistema de Gestión Académica",
    "description": "Desarrollo de un sistema integral...",
    "general_objectives": "Desarrollar un sistema web...",
    "specific_objectives": "1. Implementar módulo...",
    "priority": "high",
    "priority_display": "Alta",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "code": "M4T73J",
    "created_by": 1,
    "created_by_name": "Juan Carlos Pérez García",
    "members": [
        {
            "id": 1,
            "user": 1,
            "user_email": "juan.perez@universidad.edu.pe",
            "user_name": "Juan Carlos Pérez García",
            "role": "leader",
            "role_display": "Líder",
            "joined_at": "2025-01-15T10:30:00Z"
        }
    ],
    "tasks_count": 0,
    "completed_tasks_count": 0,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
}
```

**Nota:** El campo `code` se genera automáticamente (6 caracteres alfanuméricos).

---

### 10. Ver Detalle de Proyecto

Obtiene información completa de un proyecto.

**Endpoint:** `GET /api/projects/{id}/`

**Autenticación requerida:** Sí

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID del proyecto |

**Respuesta Exitosa (200 OK):**
```json
{
    "id": 1,
    "title": "Sistema de Gestión Académica",
    "description": "Desarrollo de un sistema integral...",
    "general_objectives": "Desarrollar un sistema web...",
    "specific_objectives": "1. Implementar módulo...",
    "priority": "high",
    "priority_display": "Alta",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "code": "M4T73J",
    "created_by": 1,
    "created_by_name": "Juan Carlos Pérez García",
    "members": [
        {
            "id": 1,
            "user": 1,
            "user_email": "juan.perez@universidad.edu.pe",
            "user_name": "Juan Carlos Pérez García",
            "role": "leader",
            "role_display": "Líder",
            "joined_at": "2025-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "user": 2,
            "user_email": "maria@universidad.edu.pe",
            "user_name": "María López",
            "role": "member",
            "role_display": "Integrante",
            "joined_at": "2025-01-16T09:00:00Z"
        }
    ],
    "tasks_count": 5,
    "completed_tasks_count": 2,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:00:00Z"
}
```

---

### 11. Actualizar Proyecto

Actualiza la información de un proyecto (solo líder).

**Endpoint:** `PUT /api/projects/{id}/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder del proyecto

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `title` | string | Sí | Título del proyecto |
| `description` | string | Sí | Descripción del proyecto |
| `general_objectives` | string | Sí | Objetivos generales |
| `specific_objectives` | string | Sí | Objetivos específicos |
| `start_date` | date | Sí | Fecha de inicio |
| `end_date` | date | Sí | Fecha de fin |
| `priority` | string | No | Prioridad |

**Ejemplo de Request:**
```json
{
    "title": "Sistema de Gestión Académica v2.0",
    "description": "Versión mejorada del sistema",
    "general_objectives": "Objetivos actualizados",
    "specific_objectives": "1. Nuevo módulo\n2. Mejoras",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "priority": "critical"
}
```

**Respuesta Exitosa (200 OK):** Retorna el proyecto actualizado.

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder puede editar el proyecto |

---

### 12. Eliminar Proyecto

Elimina un proyecto y todos sus datos asociados (solo líder).

**Endpoint:** `DELETE /api/projects/{id}/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder del proyecto

**Respuesta Exitosa (204 No Content):** Sin contenido

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder puede eliminar el proyecto |

---

## Membresías

### 13. Unirse a Proyecto con Código

Permite a un usuario unirse a un proyecto usando el código único.

**Endpoint:** `POST /api/projects/join/`

**Autenticación requerida:** Sí

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `code` | string | Sí | Código del proyecto (6 caracteres) |

**Ejemplo de Request:**
```json
{
    "code": "M4T73J"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Te has unido al proyecto exitosamente.",
    "project": {
        "id": 1,
        "title": "Sistema de Gestión Académica",
        "code": "M4T73J",
        ...
    }
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | Ya eres miembro de este proyecto |
| 400 | No existe un proyecto con este código |

---

### 14. Ver Miembros del Proyecto

Lista todos los miembros de un proyecto.

**Endpoint:** `GET /api/projects/{id}/members/`

**Autenticación requerida:** Sí

**Respuesta Exitosa (200 OK):**
```json
[
    {
        "id": 1,
        "user": 1,
        "user_email": "juan.perez@universidad.edu.pe",
        "user_name": "Juan Carlos Pérez García",
        "role": "leader",
        "role_display": "Líder",
        "joined_at": "2025-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "user": 2,
        "user_email": "maria@universidad.edu.pe",
        "user_name": "María López",
        "role": "member",
        "role_display": "Integrante",
        "joined_at": "2025-01-16T09:00:00Z"
    }
]
```

---

### 15. Abandonar Proyecto

Permite a un miembro abandonar un proyecto.

**Endpoint:** `POST /api/projects/{id}/leave/`

**Autenticación requerida:** Sí

**Nota:** El líder no puede abandonar el proyecto. Debe transferir el liderazgo o eliminar el proyecto.

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Has abandonado el proyecto exitosamente."
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | No eres miembro de este proyecto |
| 400 | El líder no puede abandonar el proyecto |

---

### 16. Transferir Liderazgo

Transfiere el rol de líder a otro miembro (solo líder actual).

**Endpoint:** `POST /api/projects/{id}/transfer-leadership/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder actual

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `user_id` | int | Sí | ID del nuevo líder |

**Ejemplo de Request:**
```json
{
    "user_id": 2
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Liderazgo transferido exitosamente."
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder puede transferir el liderazgo |
| 400 | El usuario debe ser miembro del proyecto |

---

### 17. Remover Miembro

Remueve a un miembro del proyecto (solo líder).

**Endpoint:** `POST /api/projects/{id}/remove-member/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `user_id` | int | Sí | ID del usuario a remover |

**Ejemplo de Request:**
```json
{
    "user_id": 3
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "message": "Miembro removido exitosamente."
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder puede remover miembros |
| 400 | No puedes removerte a ti mismo |
| 400 | El usuario no es miembro del proyecto |

---

## Tareas

### 18. Listar Tareas de un Proyecto

Obtiene todas las tareas de un proyecto específico.

**Endpoint:** `GET /api/tasks/project/{project_id}/`

**Autenticación requerida:** Sí

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `project_id` | int | ID del proyecto |

**Respuesta Exitosa (200 OK):**
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Diseñar base de datos",
            "description": "Crear el modelo entidad-relación",
            "deadline": "2025-02-15",
            "priority": "high",
            "priority_display": "Alta",
            "status": "in_progress",
            "status_display": "En progreso",
            "assigned_to": 2,
            "assigned_to_name": "María López",
            "documents_count": 2,
            "created_at": "2025-01-15T11:00:00Z"
        }
    ]
}
```

---

### 19. Ver Mis Tareas Asignadas

Lista todas las tareas asignadas al usuario actual.

**Endpoint:** `GET /api/tasks/my-tasks/`

**Autenticación requerida:** Sí

**Respuesta Exitosa (200 OK):**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Diseñar base de datos",
            "description": "Crear el modelo entidad-relación",
            "deadline": "2025-02-15",
            "priority": "high",
            "priority_display": "Alta",
            "status": "pending",
            "status_display": "Pendiente",
            "assigned_to": 1,
            "assigned_to_name": "Juan Carlos Pérez García",
            "documents_count": 0,
            "created_at": "2025-01-15T11:00:00Z"
        }
    ]
}
```

---

### 20. Crear Tarea

Crea una nueva tarea en un proyecto (solo líder).

**Endpoint:** `POST /api/tasks/project/{project_id}/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder del proyecto

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `project_id` | int | ID del proyecto |

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la tarea |
| `description` | string | Sí | Descripción de la tarea |
| `deadline` | date | Sí | Fecha límite (YYYY-MM-DD) |
| `priority` | string | No | Prioridad (default: medium) |
| `assigned_to` | int | No | ID del usuario asignado |

**Ejemplo de Request:**
```json
{
    "name": "Diseñar base de datos",
    "description": "Crear el modelo entidad-relación del sistema incluyendo todas las tablas necesarias para usuarios, proyectos y tareas.",
    "deadline": "2025-02-15",
    "priority": "high",
    "assigned_to": 2
}
```

**Respuesta Exitosa (201 Created):**
```json
{
    "id": 1,
    "project": 1,
    "project_title": "Sistema de Gestión Académica",
    "name": "Diseñar base de datos",
    "description": "Crear el modelo entidad-relación...",
    "deadline": "2025-02-15",
    "priority": "high",
    "priority_display": "Alta",
    "status": "pending",
    "status_display": "Pendiente",
    "assigned_to": 2,
    "assigned_to_name": "María López",
    "created_by": 1,
    "created_by_name": "Juan Carlos Pérez García",
    "documents": [],
    "created_at": "2025-01-15T11:00:00Z",
    "updated_at": "2025-01-15T11:00:00Z",
    "completed_at": null
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder puede crear tareas |
| 400 | El usuario asignado debe ser miembro del proyecto |
| 400 | La fecha límite no puede ser pasada |

---

### 21. Ver Detalle de Tarea

Obtiene información completa de una tarea.

**Endpoint:** `GET /api/tasks/{id}/`

**Autenticación requerida:** Sí

**Respuesta Exitosa (200 OK):**
```json
{
    "id": 1,
    "project": 1,
    "project_title": "Sistema de Gestión Académica",
    "name": "Diseñar base de datos",
    "description": "Crear el modelo entidad-relación...",
    "deadline": "2025-02-15",
    "priority": "high",
    "priority_display": "Alta",
    "status": "completed",
    "status_display": "Completada",
    "assigned_to": 2,
    "assigned_to_name": "María López",
    "created_by": 1,
    "created_by_name": "Juan Carlos Pérez García",
    "documents": [
        {
            "id": 1,
            "task": 1,
            "file": "/media/tasks/1/1/diagrama_er.pdf",
            "name": "Diagrama ER",
            "uploaded_by": 2,
            "uploaded_by_name": "María López",
            "filename": "diagrama_er.pdf",
            "uploaded_at": "2025-02-10T15:30:00Z"
        }
    ],
    "created_at": "2025-01-15T11:00:00Z",
    "updated_at": "2025-02-10T16:00:00Z",
    "completed_at": "2025-02-10T16:00:00Z"
}
```

---

### 22. Actualizar Tarea

Actualiza la información de una tarea (solo líder).

**Endpoint:** `PUT /api/tasks/{id}/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder del proyecto

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre de la tarea |
| `description` | string | Sí | Descripción |
| `deadline` | date | Sí | Fecha límite |
| `priority` | string | No | Prioridad |
| `assigned_to` | int | No | ID del usuario asignado |

**Ejemplo de Request:**
```json
{
    "name": "Diseñar base de datos v2",
    "description": "Descripción actualizada",
    "deadline": "2025-03-01",
    "priority": "critical",
    "assigned_to": 3
}
```

**Respuesta Exitosa (200 OK):** Retorna la tarea actualizada.

---

### 23. Cambiar Estado de Tarea

Actualiza el estado de una tarea (líder o usuario asignado).

**Endpoint:** `PATCH /api/tasks/{id}/status/`

**Autenticación requerida:** Sí

**Permisos:** Líder del proyecto o usuario asignado a la tarea

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `status` | string | Sí | Nuevo estado |

**Estados válidos:**
- `pending` - Pendiente
- `in_progress` - En progreso
- `completed` - Completada

**Ejemplo de Request:**
```json
{
    "status": "completed"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
    "id": 1,
    "project": 1,
    "project_title": "Sistema de Gestión Académica",
    "name": "Diseñar base de datos",
    "status": "completed",
    "status_display": "Completada",
    "completed_at": "2025-02-10T16:00:00Z",
    ...
}
```

**Nota:** Al marcar como `completed`, se registra automáticamente la fecha de completado.

---

### 24. Eliminar Tarea

Elimina una tarea y sus documentos asociados (solo líder).

**Endpoint:** `DELETE /api/tasks/{id}/`

**Autenticación requerida:** Sí

**Permisos:** Solo el líder del proyecto

**Respuesta Exitosa (204 No Content):** Sin contenido

---

## Documentos

### 25. Listar Documentos de una Tarea

Lista todos los documentos adjuntos a una tarea.

**Endpoint:** `GET /api/tasks/{task_id}/documents/`

**Autenticación requerida:** Sí

**Respuesta Exitosa (200 OK):**
```json
[
    {
        "id": 1,
        "task": 1,
        "file": "/media/tasks/1/1/diagrama_er.pdf",
        "name": "Diagrama ER",
        "uploaded_by": 2,
        "uploaded_by_name": "María López",
        "filename": "diagrama_er.pdf",
        "uploaded_at": "2025-02-10T15:30:00Z"
    },
    {
        "id": 2,
        "task": 1,
        "file": "/media/tasks/1/1/documentacion.docx",
        "name": "Documentación técnica",
        "uploaded_by": 2,
        "uploaded_by_name": "María López",
        "filename": "documentacion.docx",
        "uploaded_at": "2025-02-12T10:00:00Z"
    }
]
```

---

### 26. Subir Documento

Sube un documento a una tarea (líder o usuario asignado).

**Endpoint:** `POST /api/tasks/{task_id}/documents/upload/`

**Autenticación requerida:** Sí

**Permisos:** Líder del proyecto o usuario asignado a la tarea

**Content-Type:** `multipart/form-data`

**Body (Form Data):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `file` | file | Sí | Archivo a subir |
| `name` | string | No | Nombre descriptivo (si no se envía, usa el nombre del archivo) |

**Ejemplo con cURL:**
```bash
curl -X POST http://127.0.0.1:8000/api/tasks/1/documents/upload/ \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/documento.pdf" \
  -F "name=Diagrama de base de datos"
```

**Respuesta Exitosa (201 Created):**
```json
{
    "id": 1,
    "task": 1,
    "file": "/media/tasks/1/1/documento.pdf",
    "name": "Diagrama de base de datos",
    "uploaded_by": 2,
    "uploaded_by_name": "María López",
    "filename": "documento.pdf",
    "uploaded_at": "2025-02-10T15:30:00Z"
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder o la persona asignada pueden subir documentos |

---

### 27. Eliminar Documento

Elimina un documento (líder o quien lo subió).

**Endpoint:** `DELETE /api/tasks/documents/{id}/delete/`

**Autenticación requerida:** Sí

**Permisos:** Líder del proyecto o el usuario que subió el documento

**Respuesta Exitosa (204 No Content):** Sin contenido

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | Solo el líder o quien subió el documento pueden eliminarlo |

---

## Códigos de Error

### Códigos HTTP Comunes

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 204 | No Content | Eliminación exitosa |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos para esta acción |
| 404 | Not Found | Recurso no encontrado |
| 500 | Server Error | Error interno del servidor |

### Formato de Error

```json
{
    "error": "Descripción del error"
}
```

O para errores de validación:

```json
{
    "field_name": [
        "Mensaje de error para este campo"
    ]
}
```

---

## Ejemplos de Uso Completo

### Flujo de Registro y Creación de Proyecto

```bash
# 1. Registrar usuario
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan@test.com",
    "password": "MiPassword123!",
    "password_confirm": "MiPassword123!"
  }'

# 2. Guardar el access token de la respuesta

# 3. Crear proyecto
curl -X POST http://127.0.0.1:8000/api/projects/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Proyecto",
    "description": "Descripción del proyecto",
    "general_objectives": "Objetivos generales",
    "specific_objectives": "Objetivos específicos",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "priority": "high"
  }'

# 4. Compartir el código del proyecto con compañeros
# (El código se encuentra en la respuesta, ej: "code": "M4T73J")
```

### Flujo de Unirse y Completar Tarea

```bash
# 1. Login del nuevo miembro
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "maria@test.com", "password": "Password123!"}'

# 2. Unirse al proyecto con código
curl -X POST http://127.0.0.1:8000/api/projects/join/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"code": "M4T73J"}'

# 3. Ver tareas asignadas
curl http://127.0.0.1:8000/api/tasks/my-tasks/ \
  -H "Authorization: Bearer <access_token>"

# 4. Marcar tarea como completada
curl -X PATCH http://127.0.0.1:8000/api/tasks/1/status/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'

# 5. Subir documento de evidencia
curl -X POST http://127.0.0.1:8000/api/tasks/1/documents/upload/ \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@./evidencia.pdf" \
  -F "name=Evidencia de trabajo completado"
```

---

## Notas Adicionales

1. **Zona horaria:** El sistema usa la zona horaria de América/Lima (UTC-5).

2. **Paginación:** Las listas retornan máximo 10 elementos por página. Usa `?page=2` para ver más.

3. **Archivos:** Los documentos se guardan en `/media/tasks/{project_id}/{task_id}/`.

4. **Tokens:** 
   - Access token expira en 1 hora
   - Refresh token expira en 7 días
   - Se recomienda refrescar el token antes de que expire

5. **Validaciones de contraseña:**
   - Mínimo 8 caracteres
   - No puede ser muy común
   - No puede ser solo números
   - No puede ser similar al email o nombre

---

## Chat

El sistema de chat permite comunicación en tiempo real entre los miembros de un proyecto. Existen dos tipos de chat:
- **Chat Grupal:** Todos los miembros del proyecto pueden participar
- **Chat Privado:** Comunicación uno a uno entre dos miembros del proyecto

El sistema soporta **WebSockets** para comunicación en tiempo real además de los endpoints REST.

### Tipos de Sala
| Valor | Descripción |
|-------|-------------|
| `group` | Chat grupal del proyecto |
| `private` | Chat privado entre dos usuarios |

### Tipos de Mensaje
| Valor | Descripción |
|-------|-------------|
| `text` | Mensaje de texto |
| `file` | Archivo adjunto |
| `image` | Imagen |
| `system` | Mensaje del sistema |

---

### 28. Listar Todas Mis Salas de Chat

Lista todas las salas de chat donde el usuario participa (grupales y privadas).

**Endpoint:** `GET /api/chat/rooms/`

**Autenticación requerida:** Sí

**Respuesta Exitosa (200 OK):**
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Chat grupal - Sistema de Gestión Académica",
            "room_type": "group",
            "project": {
                "id": 1,
                "title": "Sistema de Gestión Académica"
            },
            "participants": [],
            "unread_count": 3,
            "last_message": {
                "id": 15,
                "content": "¡Hola a todos!",
                "message_type": "text",
                "sender": {
                    "id": 1,
                    "email": "juan@test.com",
                    "full_name": "Juan Carlos Pérez García"
                },
                "created_at": "2025-01-20T10:30:00Z"
            },
            "created_at": "2025-01-15T10:30:00Z",
            "updated_at": "2025-01-20T10:30:00Z"
        },
        {
            "id": 2,
            "name": "Chat privado",
            "room_type": "private",
            "project": {
                "id": 1,
                "title": "Sistema de Gestión Académica"
            },
            "participants": [
                {
                    "id": 1,
                    "email": "juan@test.com",
                    "full_name": "Juan Carlos Pérez García"
                },
                {
                    "id": 2,
                    "email": "maria@test.com",
                    "full_name": "María López"
                }
            ],
            "unread_count": 1,
            "last_message": {
                "id": 20,
                "content": "¿Puedes revisar mi avance?",
                "message_type": "text",
                "sender": {
                    "id": 2,
                    "email": "maria@test.com",
                    "full_name": "María López"
                },
                "created_at": "2025-01-20T11:00:00Z"
            },
            "created_at": "2025-01-16T09:00:00Z",
            "updated_at": "2025-01-20T11:00:00Z"
        }
    ]
}
```

---

### 29. Obtener Salas de Chat de un Proyecto

Lista el chat grupal y todos los chats privados del usuario en un proyecto específico. Crea automáticamente el chat grupal si no existe.

**Endpoint:** `GET /api/chat/rooms/by_project/?project_id={project_id}`

**Autenticación requerida:** Sí

**Parámetros de Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `project_id` | int | Sí | ID del proyecto |

**Respuesta Exitosa (200 OK):**
```json
[
    {
        "id": 1,
        "name": "Chat grupal - Sistema de Gestión Académica",
        "room_type": "group",
        "project": {
            "id": 1,
            "title": "Sistema de Gestión Académica"
        },
        "participants": [],
        "unread_count": 0,
        "last_message": null,
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z"
    },
    {
        "id": 2,
        "name": "Chat privado",
        "room_type": "private",
        "project": {
            "id": 1,
            "title": "Sistema de Gestión Académica"
        },
        "participants": [
            {
                "id": 1,
                "email": "juan@test.com",
                "full_name": "Juan Carlos Pérez García"
            },
            {
                "id": 2,
                "email": "maria@test.com",
                "full_name": "María López"
            }
        ],
        "unread_count": 0,
        "last_message": null,
        "created_at": "2025-01-16T09:00:00Z",
        "updated_at": "2025-01-16T09:00:00Z"
    }
]
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | Se requiere project_id |
| 403 | No tienes acceso a este proyecto |

---

### 30. Ver Detalle de Sala de Chat

Obtiene información detallada de una sala de chat.

**Endpoint:** `GET /api/chat/rooms/{id}/`

**Autenticación requerida:** Sí

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la sala de chat |

**Respuesta Exitosa (200 OK):**
```json
{
    "id": 1,
    "name": "Chat grupal - Sistema de Gestión Académica",
    "room_type": "group",
    "project": {
        "id": 1,
        "title": "Sistema de Gestión Académica"
    },
    "participants": [],
    "unread_count": 0,
    "last_message": {
        "id": 15,
        "content": "¡Hola a todos!",
        "message_type": "text",
        "sender": {
            "id": 1,
            "email": "juan@test.com",
            "full_name": "Juan Carlos Pérez García"
        },
        "created_at": "2025-01-20T10:30:00Z"
    },
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
}
```

---

### 31. Crear o Obtener Chat Privado

Crea un chat privado con otro miembro del proyecto, o retorna el existente si ya existe.

**Endpoint:** `POST /api/chat/rooms/create_private/`

**Autenticación requerida:** Sí

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `other_user_id` | int | Sí | ID del usuario con quien chatear |
| `project_id` | int | Sí | ID del proyecto (contexto del chat) |

**Ejemplo de Request:**
```json
{
    "other_user_id": 2,
    "project_id": 1
}
```

**Respuesta Exitosa (201 Created / 200 OK si ya existe):**
```json
{
    "id": 5,
    "name": "Chat privado",
    "room_type": "private",
    "project": {
        "id": 1,
        "title": "Sistema de Gestión Académica"
    },
    "participants": [
        {
            "id": 1,
            "email": "juan@test.com",
            "full_name": "Juan Carlos Pérez García"
        },
        {
            "id": 2,
            "email": "maria@test.com",
            "full_name": "María López"
        }
    ],
    "unread_count": 0,
    "last_message": null,
    "created_at": "2025-01-20T12:00:00Z",
    "updated_at": "2025-01-20T12:00:00Z"
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | No puedes crear un chat contigo mismo |
| 400 | El otro usuario no es miembro de este proyecto |
| 403 | No eres miembro de este proyecto |

---

### 32. Obtener Mensajes de una Sala

Obtiene los mensajes de una sala de chat con paginación.

**Endpoint:** `GET /api/chat/rooms/{id}/messages/`

**Autenticación requerida:** Sí

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la sala de chat |

**Parámetros de Query (opcionales):**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | 1 | Número de página |
| `page_size` | int | 50 | Mensajes por página |

**Respuesta Exitosa (200 OK):**
```json
{
    "count": 25,
    "page": 1,
    "page_size": 50,
    "results": [
        {
            "id": 1,
            "chat_room": 1,
            "sender": {
                "id": 1,
                "email": "juan@test.com",
                "full_name": "Juan Carlos Pérez García"
            },
            "content": "¡Bienvenidos al proyecto!",
            "message_type": "text",
            "file": null,
            "is_read": true,
            "created_at": "2025-01-15T10:35:00Z"
        },
        {
            "id": 2,
            "chat_room": 1,
            "sender": {
                "id": 2,
                "email": "maria@test.com",
                "full_name": "María López"
            },
            "content": "¡Gracias! Estoy emocionada de participar.",
            "message_type": "text",
            "file": null,
            "is_read": true,
            "created_at": "2025-01-15T10:36:00Z"
        }
    ]
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | No tienes acceso a esta sala |

---

### 33. Enviar Mensaje (REST API)

Envía un mensaje a una sala de chat via REST API. Alternativa a WebSocket.

**Endpoint:** `POST /api/chat/rooms/{id}/send_message/`

**Autenticación requerida:** Sí

**Content-Type:** `application/json` o `multipart/form-data` (si envías archivo)

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la sala de chat |

**Body (JSON):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `content` | string | Sí | Contenido del mensaje |
| `message_type` | string | No | Tipo de mensaje (default: text) |
| `file` | file | No | Archivo adjunto |

**Ejemplo de Request:**
```json
{
    "content": "¡Hola equipo! ¿Cómo van con el avance?",
    "message_type": "text"
}
```

**Ejemplo con archivo (Form Data):**
```bash
curl -X POST http://127.0.0.1:8000/api/chat/rooms/1/send_message/ \
  -H "Authorization: Bearer <token>" \
  -F "content=Aquí les comparto el documento" \
  -F "message_type=file" \
  -F "file=@/path/to/documento.pdf"
```

**Respuesta Exitosa (201 Created):**
```json
{
    "id": 26,
    "chat_room": 1,
    "sender": {
        "id": 1,
        "email": "juan@test.com",
        "full_name": "Juan Carlos Pérez García"
    },
    "content": "¡Hola equipo! ¿Cómo van con el avance?",
    "message_type": "text",
    "file": null,
    "is_read": false,
    "created_at": "2025-01-20T12:30:00Z"
}
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 403 | No tienes acceso a esta sala |

---

### 34. Marcar Mensajes como Leídos

Marca todos los mensajes de una sala como leídos para el usuario actual.

**Endpoint:** `POST /api/chat/rooms/{id}/mark_read/`

**Autenticación requerida:** Sí

**Parámetros de URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID de la sala de chat |

**Respuesta Exitosa (200 OK):**
```json
{
    "status": "Mensajes marcados como leídos"
}
```

---

### 35. Obtener Miembros para Chat Privado

Lista los miembros de un proyecto disponibles para iniciar chat privado, indicando si ya existe un chat con cada uno.

**Endpoint:** `GET /api/chat/members/?project_id={project_id}`

**Autenticación requerida:** Sí

**Parámetros de Query:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `project_id` | int | Sí | ID del proyecto |

**Respuesta Exitosa (200 OK):**
```json
[
    {
        "id": 2,
        "email": "maria@test.com",
        "full_name": "María López",
        "role": "Integrante",
        "has_private_chat": true,
        "chat_room_id": 5
    },
    {
        "id": 3,
        "email": "carlos@test.com",
        "full_name": "Carlos García",
        "role": "Integrante",
        "has_private_chat": false,
        "chat_room_id": null
    }
]
```

**Errores:**
| Código | Descripción |
|--------|-------------|
| 400 | Se requiere project_id |
| 403 | No tienes acceso a este proyecto |

---

## WebSocket API (Tiempo Real)

El sistema de chat soporta comunicación en tiempo real mediante WebSockets.

### Conexión WebSocket

**URL:** `ws://127.0.0.1:8000/ws/chat/{room_id}/?token={access_token}`

**Parámetros:**
| Parámetro | Descripción |
|-----------|-------------|
| `room_id` | ID de la sala de chat |
| `token` | Token JWT de acceso |

**Ejemplo de conexión (JavaScript):**
```javascript
const token = localStorage.getItem('access_token');
const roomId = 1;
const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${roomId}/?token=${token}`);

ws.onopen = () => console.log('Conectado al chat');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Mensaje recibido:', data);
};
ws.onerror = (error) => console.error('Error:', error);
ws.onclose = () => console.log('Desconectado');
```

---

### Eventos del Cliente al Servidor

#### Enviar mensaje de chat
```javascript
ws.send(JSON.stringify({
    type: 'chat_message',
    content: '¡Hola equipo!',
    message_type: 'text'
}));
```

#### Notificar que está escribiendo
```javascript
ws.send(JSON.stringify({
    type: 'typing',
    is_typing: true
}));
```

#### Marcar mensaje como leído
```javascript
ws.send(JSON.stringify({
    type: 'mark_read',
    message_id: 123
}));
```

---

### Eventos del Servidor al Cliente

#### Nuevo mensaje
```json
{
    "type": "chat_message",
    "message": {
        "id": 1,
        "content": "¡Hola!",
        "message_type": "text",
        "sender": {
            "id": 1,
            "email": "juan@test.com",
            "full_name": "Juan Carlos Pérez García"
        },
        "created_at": "2025-01-20T12:30:00Z"
    }
}
```

#### Usuario escribiendo
```json
{
    "type": "typing",
    "user_id": 2,
    "user_name": "María López",
    "is_typing": true
}
```

#### Usuario conectado
```json
{
    "type": "user_join",
    "user_id": 2,
    "user_name": "María López"
}
```

#### Usuario desconectado
```json
{
    "type": "user_leave",
    "user_id": 2,
    "user_name": "María López"
}
```

#### Mensaje leído
```json
{
    "type": "message_read",
    "message_id": 123,
    "user_id": 2,
    "user_name": "María López"
}
```

#### Error
```json
{
    "type": "error",
    "message": "Descripción del error"
}
```

---

### Flujo Completo de Uso del Chat

```bash
# 1. Obtener las salas de chat de un proyecto
curl "http://127.0.0.1:8000/api/chat/rooms/by_project/?project_id=1" \
  -H "Authorization: Bearer <token>"

# 2. Ver mensajes de una sala
curl "http://127.0.0.1:8000/api/chat/rooms/1/messages/" \
  -H "Authorization: Bearer <token>"

# 3. Enviar mensaje via REST
curl -X POST "http://127.0.0.1:8000/api/chat/rooms/1/send_message/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "¡Hola equipo!", "message_type": "text"}'

# 4. Ver miembros disponibles para chat privado
curl "http://127.0.0.1:8000/api/chat/members/?project_id=1" \
  -H "Authorization: Bearer <token>"

# 5. Crear chat privado con un compañero
curl -X POST "http://127.0.0.1:8000/api/chat/rooms/create_private/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"other_user_id": 2, "project_id": 1}'

# 6. Marcar mensajes como leídos
curl -X POST "http://127.0.0.1:8000/api/chat/rooms/1/mark_read/" \
  -H "Authorization: Bearer <token>"
```

### Probar WebSocket con Postman

1. Crear nueva conexión WebSocket en Postman
2. URL: `ws://127.0.0.1:8000/ws/chat/1/?token=TU_ACCESS_TOKEN`
3. Click en "Connect"
4. Enviar mensaje JSON:
```json
{
    "type": "chat_message",
    "content": "Hola desde Postman!",
    "message_type": "text"
}
```

---

**Versión de la API:** 1.2  
**Última actualización:** Diciembre 2025
