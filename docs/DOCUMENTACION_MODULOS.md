# Directorio de Módulos del Frontend 🖥️📁

Este documento proporciona un mapa estructurado de los módulos que componen la interfaz de usuario de **TutelaIA**, detallando las páginas y componentes específicos de cada uno.

---

## 📂 Directorio de Módulos en `src/modules/`

| Módulo | Carpeta de Módulo | Propósito Principal | Páginas Clave |
| :--- | :--- | :--- | :--- |
| **admin** | `src/modules/admin/` | Gestión administrativa de usuarios, roles e integraciones. | `GestionUsuarios.jsx` |
| **comunicaciones** | `src/modules/comunicaciones/` | Panel para el control de correspondencia entrante y saliente. | `DashboardComunicaciones.jsx`, `ListaComunicaciones.jsx`, `DetalleComunicacion.jsx`, `NuevaComunicacion.jsx` |
| **conformidades** | `src/modules/conformidades/` | Gestión de la conformidad de proyectos, contratos y entidades externas. | `DashboardConformidades.jsx`, `ListaConformidades.jsx`, `DetalleConformidad.jsx`, `NuevaSolicitudConformidad.jsx` |
| **pagos** | `src/modules/pagos/` | Solicitudes y flujos de aprobación de desembolsos judiciales. | `DashboardPagos.jsx`, `ListaPagos.jsx`, `DetallePago.jsx`, `NuevaSolicitudPago.jsx` |
| **perfil** | `src/modules/perfil/` | Vista de configuración del perfil del abogado/administrador. | `MiPerfil.jsx` |
| **rendimiento** | `src/modules/rendimiento/` | Tablero de KPIs, metas operativas y gestión de equipos de abogados. | `DashboardRendimiento.jsx`, `ManagerDashboard.jsx`, `GestorEquipos.jsx` |

---

## 🛠️ Estructura Interna de Módulos
Cada submódulo está encapsulado en su propia carpeta para evitar acoplamientos, estructurado de la siguiente forma:

- `components/`: Componentes gráficos locales de uso exclusivo de ese módulo (ej. fondos animados, modales de confirmación o medidores visuales).
- `pages/`: Vistas de nivel superior que se configuran en el enrutador global de React.
- `README.md`: Documentación específica de dicho módulo.
