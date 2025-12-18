# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.0.0] - 2024-12-18

### ✨ Nuevas Características

#### Módulo de Chat
- **Chat grupal por proyecto**: Se crea automáticamente al acceder al proyecto
- **Chat privado entre miembros**: Click en el ícono de chat junto a cada miembro
- **WebSocket en tiempo real**: Mensajes instantáneos con Django Channels
- **Indicadores visuales**:
  - Badge de mensajes no leídos en sidebar
  - Indicador de "escribiendo..."
  - Estado de conexión (conectado/desconectado)
- **Lista de conversaciones**: Separadas por tipo (grupales/privadas)

#### Exportación a PDF
- Exportar detalle completo del proyecto a PDF
- Incluye: descripción, objetivos, miembros y tareas

#### Notificaciones del Navegador
- Recordatorios automáticos para tareas urgentes (vencen en 3 días o menos)
- Botón para activar/desactivar notificaciones

#### Datos de Prueba
- Script `seed_data.py` para poblar la base de datos
- 3 usuarios, 3 proyectos, 15+ tareas con diferentes estados

### 🔧 Mejoras Técnicas
- Integración de Daphne como servidor ASGI para WebSocket
- Servicio de chat con manejo de respuestas paginadas
- Hook `useChat` para gestión de WebSocket con auto-reconexión

### 🐛 Correcciones
- Corregido error de CSS con selector inválido en `globals.css`
- Corregido manejo de arrays en sidebar para mensajes no leídos
- Corregidas propiedades de `Membership` en exportación PDF

---

## [0.9.0] - 2024-12-15

### Características Iniciales
- Sistema de autenticación con JWT
- CRUD de proyectos con código de invitación
- Gestión de miembros con roles (líder/miembro)
- CRUD de tareas con asignación
- Dashboard con estadísticas
- Modo oscuro/claro
