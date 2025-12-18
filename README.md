# Academic Project Manager 📚

Sistema de gestión de proyectos académicos con chat en tiempo real.

## 🎯 Características

### Gestión de Proyectos
- ✅ Crear, editar y eliminar proyectos
- ✅ Código único para unirse a proyectos
- ✅ Transferencia de liderazgo
- ✅ Gestión de miembros (agregar/eliminar)
- ✅ Exportar proyecto a PDF

### Gestión de Tareas
- ✅ Crear y asignar tareas a miembros
- ✅ Estados: Pendiente, En Progreso, Completada
- ✅ Prioridades: Baja, Media, Alta, Crítica
- ✅ Fechas límite con alertas

### Chat en Tiempo Real
- ✅ Chat grupal automático por proyecto
- ✅ Chats privados entre miembros
- ✅ WebSocket para mensajería en tiempo real
- ✅ Indicador de mensajes no leídos
- ✅ Indicador de "escribiendo..."

### Notificaciones
- ✅ Notificaciones del navegador para tareas urgentes
- ✅ Badges de tareas pendientes en sidebar

---

## 🛠️ Tecnologías

### Backend
- **Django 5.0** - Framework web
- **Django REST Framework** - API REST
- **Django Channels** - WebSocket
- **Daphne** - Servidor ASGI
- **SQLite** - Base de datos (desarrollo)
- **JWT** - Autenticación

### Frontend
- **Next.js 16** - Framework React
- **TypeScript** - Tipado estático
- **TanStack Query** - Gestión de estado del servidor
- **Tailwind CSS** - Estilos
- **Zustand** - Estado global
- **WebSocket API** - Chat en tiempo real

---

## 🚀 Instalación

### Prerrequisitos
- Python 3.10+
- Node.js 18+
- npm o yarn

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario (opcional)
python manage.py createsuperuser

# Cargar datos de prueba (opcional)
python manage.py shell -c "exec(open('seed_data.py', encoding='utf-8').read())"
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env.local (si no existe)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
```

---

## ▶️ Ejecutar

### Backend (con WebSocket)

```bash
cd backend
.\venv\Scripts\activate

# Usar Daphne para WebSocket
.\venv\Scripts\daphne -b 0.0.0.0 -p 8000 config.asgi:application

# O para desarrollo sin WebSocket
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm run dev
```

### Acceder
- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/

---

## 👥 Usuarios de Prueba

Si cargaste los datos de prueba (`seed_data.py`):

| Email | Contraseña | Rol |
|-------|------------|-----|
| ana@test.com | test1234 | Líder de proyectos |
| carlos@test.com | test1234 | Miembro |
| maria@test.com | test1234 | Miembro |

---

## 📁 Estructura del Proyecto

```
AcademicProjectManager/
├── backend/
│   ├── config/          # Configuración Django
│   ├── users/           # App de usuarios
│   ├── projects/        # App de proyectos
│   ├── tasks/           # App de tareas
│   ├── chat/            # App de chat (WebSocket)
│   ├── manage.py
│   └── seed_data.py     # Datos de prueba
│
└── frontend/
    ├── src/
    │   ├── app/         # Páginas (App Router)
    │   ├── components/  # Componentes React
    │   ├── hooks/       # Custom hooks
    │   ├── services/    # Servicios API
    │   ├── store/       # Estado global (Zustand)
    │   └── types/       # Tipos TypeScript
    └── package.json
```

---

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/register/` - Registrar usuario
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/token/refresh/` - Refrescar token

### Proyectos
- `GET /api/projects/` - Listar proyectos
- `POST /api/projects/` - Crear proyecto
- `GET /api/projects/{id}/` - Detalle de proyecto
- `PUT /api/projects/{id}/` - Actualizar proyecto
- `DELETE /api/projects/{id}/` - Eliminar proyecto
- `POST /api/projects/join/` - Unirse con código

### Tareas
- `GET /api/tasks/project/{id}/` - Tareas de un proyecto
- `POST /api/tasks/` - Crear tarea
- `PUT /api/tasks/{id}/` - Actualizar tarea
- `DELETE /api/tasks/{id}/` - Eliminar tarea

### Chat
- `GET /api/chat/rooms/` - Listar salas de chat
- `GET /api/chat/rooms/by_project/?project_id=X` - Salas de un proyecto
- `POST /api/chat/rooms/create_private/` - Crear chat privado
- `GET /api/chat/rooms/{id}/messages/` - Mensajes de una sala
- `POST /api/chat/rooms/{id}/send_message/` - Enviar mensaje

### WebSocket
- `ws://localhost:8000/ws/chat/{room_id}/?token=JWT` - Chat en tiempo real

---

## 📝 Licencia

Este proyecto es para uso académico.

---

## 👨‍💻 Desarrolladores

- Equipo de desarrollo del curso
