# Módulo de Rendimiento y Equipos - Frontend (rendimiento) 📊🎯

Este módulo permite realizar el seguimiento de los objetivos de los ingenieros y gestionar la jerarquía de los equipos legales.

## 🎯 Características Principales
- **Dashboard del Abogado (`DashboardRendimiento.jsx`):** Tablero individual que muestra el porcentaje de cumplimiento y metas personales del abogado actual.
- **Dashboard del Manager (`ManagerDashboard.jsx`):** Panel consolidado de métricas que permite a los líderes de equipo supervisar los KPIs colectivos y el cumplimiento de metas de sus miembros.
- **Gestión de Equipos (`GestorEquipos.jsx`):** Vista de administración de equipos para la creación de grupos de trabajo, asignación lógica de miembros y jefes de equipo con prevención de duplicidades.

## ⚙️ Estructura del Módulo
```text
src/modules/rendimiento/
├── components/          # ConstellationBackground, SonarKPI, SignalMeter, modales locales y tarjetas de perfil
└── pages/               # Páginas para abogados, managers y administradores de equipo
```

## 🔗 Integración y Servicios
- Se comunica directamente con `/api/rendimiento`.
- Requiere permisos granulares de `rendimiento` (`READ`, `WRITE`, `MANAGE_TEAMS`).
