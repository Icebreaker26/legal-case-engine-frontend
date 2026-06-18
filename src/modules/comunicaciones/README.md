# Módulo de Comunicaciones - Frontend (comunicaciones) ✉️💬

Este módulo permite a los usuarios gestionar y hacer seguimiento de las comunicaciones y oficios recibidos en el sistema.

## 🎯 Características Principales
- **Dashboard de Comunicaciones (`DashboardComunicaciones.jsx`):** Resumen visual del estado de los oficios, con gráficos y KPIs rápidos.
- **Bandeja de Entrada/Lista (`ListaComunicaciones.jsx`):** Listado y filtros de las comunicaciones asignadas e institucionales.
- **Expediente de Comunicación (`DetalleComunicacion.jsx`):** Vista 360° de un oficio, incluyendo comentarios colaborativos, asignación de grupos de trabajo, y línea de tiempo de trazabilidad.
- **Radicación de Comunicaciones (`NuevaComunicacion.jsx`):** Formulario con validación para radicar correspondencia externa.

## ⚙️ Estructura del Módulo
```text
src/modules/comunicaciones/
├── components/          # Componentes interactivos como MorseStream y Teletipo
└── pages/               # Vistas principales del flujo de comunicaciones
```

## 🔗 Integración y Servicios
- Se comunica directamente con los endpoints del backend bajo la ruta base `/api/comunicaciones`.
- Utiliza estados protegidos mediante permisos de módulo `comunicaciones` (`READ_COM` y `WRITE_COM`).
