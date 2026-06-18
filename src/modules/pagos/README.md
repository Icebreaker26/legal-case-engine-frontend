# Módulo de Pagos Judiciales - Frontend (pagos) 💰💵

Este módulo facilita el control y la aprobación de desembolsos y cobros derivados de fallos judiciales.

## 🎯 Características Principales
- **Dashboard Financiero (`DashboardPagos.jsx`):** Muestra el consolidado de pagos pendientes, ejecutados y montos acumulados por estado.
- **Bandeja de Pagos (`ListaPagos.jsx`):** Tabla interactiva para la búsqueda y filtrado de radicados de pago.
- **Expediente del Pago (`DetallePago.jsx`):** Muestra la trazabilidad del proceso del pago (ej. Radicado, Aprobado, Transferido), grupos asignados y notas de auditoría.
- **Formulario de Registro (`NuevaSolicitudPago.jsx`):** Para registrar nuevos pagos judiciales especificando montos y conceptos.
- **Gestión de Configuración (`GestionEstadosYGrupos.jsx`):** Configuración de estados de pago y grupos responsables del desembolso.

## ⚙️ Estructura del Módulo
```text
src/modules/pagos/
├── components/          # PagosLayout (navegación y cabeceras locales)
└── pages/               # Páginas del flujo de pagos
```

## 🔗 Integración y Servicios
- Se comunica directamente con los endpoints del backend bajo `/api/pagos`.
- Requiere permisos granulares de `pagos` (`READ_PAGO` y `WRITE_PAGO`).
