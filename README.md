# TutelaIA - Frontend Documentation 🖥️✨

Este es el cliente de usuario de TutelaIA, una interfaz moderna y eficiente construida con **React** y **Vite**, optimizada para la gestión jurídica de alto impacto.

## 🛠️ Stack Tecnológico
- **Framework:** React 18 (Vite).
- **Estilos:** Tailwind CSS (Diseño limpio, profesional y responsivo).
- **Iconografía:** Lucide React (Consistente y minimalista).
- **Enrutamiento:** React Router DOM v6.
- **Comunicación:** Axios (Conexión con el Backend en el puerto 4000).
- **Notificaciones:** React Hot Toast (Feedback en tiempo real).

## 📁 Estructura de la Aplicación (`src/`)
- `main.jsx`: Punto de entrada y configuración de estilos globales.
- `App.jsx`: Definición de rutas y estructura principal.
- `components/`:
    - `Layout.jsx`: Contenedor principal con navegación superior/lateral y branding de Enel.
- `pages/`:
    - `Dashboard.jsx`: **Bandeja de Entrada**. Resumen de KPIs, visualización de estados (Pendiente, En Proceso, Respondida) y tabla de gestión con filtros visuales.
    - `Procesar.jsx`: **Carga de Documentos**. Interfaz de Dropzone para PDFs, asignación de metadatos y visualización de extracción inteligente inmediata.
    - `DetalleTutela.jsx`: **Expediente Digital**. Línea de tiempo de trazabilidad, gestión de recordatorios (alertas), visor de texto original y panel de sugerencias RAG (IA Local).
    - `Entrenar.jsx`: **Memoria Institucional**. Interfaz para alimentar la base de conocimiento mediante documentos PDF o texto legal.
- `services/`:
    - `tutelaService.js`: Capa de abstracción para todas las llamadas a la API (CRUD, Procesamiento, Descargas).

## 🎨 Guía de Estilos y UI
### Estados y Colores:
- **Pendiente:** Ámbar (`text-amber-600 bg-amber-50`).
- **En Proceso:** Azul (`text-blue-600 bg-blue-50`).
- **Respondida:** Verde (`text-green-600 bg-green-50`).
- **Prioridad Alta:** Rojo con borde de alerta y animación pulse en el Dashboard.

### Componentes de Gestión Clave:
- **Badge de Derecho:** Etiqueta dinámica en el Dashboard que indica si la tutela es de "Salud", "Mínimo Vital", etc.
- **Timeline de Trazabilidad:** Componente interactivo que muestra quién hizo qué y cuándo.
- **Sistema de Alertas:** Indicador visual `REVISAR EL: [FECHA]` basado en la lógica de días de seguimiento.

## ⚙️ Configuración y Ejecución
1.  Instalar dependencias: `npm install`
2.  Iniciar en modo desarrollo: `npm run dev`
3.  El frontend se comunica por defecto con `http://localhost:4000/api/tutelas`.

## 📝 Notas de Desarrollo Recientes
- **Sistema RBAC (Roles):** Jerarquía de permisos (`super_admin`, `admin`, `juridico`, `auditor`). El sidebar es dinámico y oculta secciones restringidas según el rol del usuario.
- **Gestión de Papelera:** Nueva vista `/papelera` para recuperar registros eliminados con previsualización de documentos.
- **Visualización de Documentos:** Nuevo visor de documentos con formato legal profesional (tipografía serif, alineación justificada, jerarquía de encabezados).
- **Seguridad (Auth):** Implementación de `AuthContext` para manejo global de sesión y rutas protegidas (`ProtectedRoute`, `PublicOnlyRoute`). Integración con `HttpOnly Cookies` vía `axios.defaults.withCredentials`.
- **Panel Administrativo:** Interfaz para gestión de usuarios (activación/desactivación, asignación de roles mediante dropdown).
- **Eliminación Segura:** Flujo de eliminación de tutelas con confirmación mediante radicado (estilo GitHub) y eliminación lógica auditable.
- **Servicio Centralizado:** Migración a `apiService.js` con configuración base de URL mediante variables de entorno (`.env`).


## 🛡️ Panel de Administración
Los usuarios con privilegios de administrador tienen acceso a un panel dedicado para:
- **Gestión de Usuarios:** Listado centralizado de todos los abogados registrados.
- **Flujo de Aprobación:** Interfaz administrativa para validar nuevos usuarios. Las cuentas nuevas requieren aprobación explícita de un administrador antes de ingresar.
- **Seguridad:** Reseteo forzado de contraseñas de cualquier usuario mediante la interfaz administrativa.
- **Acceso Restringido:** El menú de "Administración" solo es visible para usuarios con el flag `is_admin` activo.
