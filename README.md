```
╔══════════════════════════════════════════════════════════════════╗
║             CORE OPERATING SYSTEM — FRONTEND CLIENT             ║
║                     ICEBREAKER // BUILD 2026                    ║
╚══════════════════════════════════════════════════════════════════╝
```

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-slate?style=flat-square)

---

## `> DESCRIPCIÓN`

Interfaz del **Core Operating System** — plataforma transversal de gestión operativa para Enel Colombia. Accesible desde un selector central de módulos con identidad visual unificada, autenticación JWT y control de acceso granular en cada ruta.

> Desarrollado por **Alejandro M. Torres** — Ingeniero de Sistemas y Telecomunicaciones  
> Universidad Católica de Pereira · Internship Permitting & Detailed Design HV · Enel Colombia 2026-1

---

## `> STACK TECNOLÓGICO`

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 |
| Bundler | Vite 5 |
| Estilos | Tailwind CSS |
| Routing | React Router v6 |
| HTTP | Axios (`apiService`) con interceptor 401/403 |
| Animaciones | Framer Motion |
| Gráficas | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Notificaciones | react-hot-toast |
| Iconos | lucide-react |

---

## `> MÓDULOS OPERATIVOS`

```
/                     ⚖️  Derechos de petición — gestión documental y RAG
/contratos            📄  Auditoría contractual — minutas y diff de contratos
/comunicaciones       ✉️  Correspondencia — entrada/salida con trazabilidad
/conformidades        📋  Conformidades — historial de estados y grupos
/pagos                💰  Pagos judiciales — flujo de aprobación y KPIs
/rendimiento          📊  Rendimiento — objetivos, cumplimiento, dashboards
/ambiental            🌿  Derecho ambiental — expedientes y alertas
/reportes             📈  Reportes cross-módulo — filtros, gráficas, exportación
/perfil               👤  Mi perfil — tareas y actividades asignadas
/catalogos            🗃️  Catálogos — entidades, grupos, áreas
/usuarios             ⚙️  Administración — usuarios, roles y permisos
/landing              🖥️  Landing pública — presentación del sistema
```

---

## `> ARQUITECTURA`

```
tutelas-frontend/
├── src/
│   ├── modules/              ← Un directorio por módulo
│   │   └── <nombre>/
│   │       ├── components/   ← Layout y componentes del módulo
│   │       └── pages/        ← Páginas (rutas)
│   ├── pages/                ← Páginas globales (Login, Landing, Notificaciones)
│   ├── components/           ← Componentes compartidos (ProtectedRoute, NotificationBell…)
│   ├── context/              ← AuthContext, ThemeContext
│   ├── services/
│   │   └── apiService.js     ← Axios con baseURL + withCredentials + interceptor
│   └── App.jsx               ← Router principal
```

**Estética unificada:** fondo `#020617`, `font-mono`, `ConstellationBackground`, bordes `slate-800` — compartida por todos los layouts del sistema.

---

## `> PATRONES DE DISEÑO`

- **`apiService`** — todas las llamadas HTTP pasan por esta instancia; nunca `fetch` directo
- **`ProtectedRoute`** — envuelve rutas autenticadas; redirige a `/login` si no hay sesión
- **`checkPermission`** + `hasPermission` — cada módulo verifica su permiso antes de renderizar
- **`SearchableSelect`** — implementado localmente en cada módulo que lo requiere
- **Color por módulo** — cada módulo tiene su paleta propia, consistente entre UI y exportaciones PDF

---

## `> EXPORTACIONES`

| Formato | Librería | Módulos |
|---------|---------|---------|
| PDF visual multi-página | jsPDF + jspdf-autotable | Reportes, Contratos, Tutelas |
| CSV | Generación manual | Reportes |

---

## `> COMANDOS`

```bash
npm run dev      # Servidor de desarrollo (puerto 5173)
npm run build    # Build de producción
npm run preview  # Preview del build
```

---

## `> VARIABLES DE ENTORNO`

```
VITE_API_BASE_URL=http://localhost:4000/api
```

---

```
// SECURE_ENTERPRISE_ENVIRONMENT // ENEL COLOMBIA // 2026
```
