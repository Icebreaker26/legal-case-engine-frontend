# Módulo de Conformidades - Frontend (conformidades) 📋🤝

Este módulo proporciona interfaces para la gestión de conformidades y requerimientos operativos asociados a proyectos y contratos.

## 🎯 Características Principales
- **Dashboard de Conformidades (`DashboardConformidades.jsx`):** Indicadores del estado actual de conformidades por proyecto.
- **Bandeja de Conformidades (`ListaConformidades.jsx`):** Listado general e individual con filtros por contrato y estado.
- **Detalle de Conformidad (`DetalleConformidad.jsx`):** Línea de tiempo de cambios de estado, asignación de responsables y comentarios.
- **Registro de Solicitudes (`NuevaSolicitudConformidad.jsx`):** Interfaz para radicar nuevas solicitudes de conformidad asociadas a entidades y proyectos.
- **Administración de Maestras (`GestionEstadosYGruposConformidades.jsx`):** Interfaz para parametrizar estados de conformidad y grupos de trabajo.

## ⚙️ Estructura del Módulo
```text
src/modules/conformidades/
├── components/          # SearchableSelect y layouts locales
└── pages/               # Páginas del flujo de conformidad
```

## 🔗 Integración y Servicios
- Se comunica directamente con los endpoints del backend bajo `/api/conformidades`.
- Protegido por los permisos del módulo `conformidades` (`READ` y `WRITE`).
