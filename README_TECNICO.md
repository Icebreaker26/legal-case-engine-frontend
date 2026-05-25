# Sistema de Gestión de Tutelas - Frontend

## 1. Descripción General
El frontend del Sistema de Gestión de Tutelas es una Single Page Application (SPA) moderna, diseñada para optimizar el flujo de trabajo de procesamiento, seguimiento y respuesta a acciones de tutela. La aplicación actúa como la interfaz centralizada donde los abogados y administradores interactúan con herramientas de IA para automatizar la generación de borradores jurídicos y la gestión documental.

## 2. Arquitectura de Software
La aplicación sigue una arquitectura **basada en componentes**, utilizando **React 19** bajo el entorno de ejecución de **Vite** para garantizar un desarrollo ágil y un rendimiento óptimo en producción.

### 2.1. Patrones de Diseño Aplicados
- **Container-Presenter Pattern:** Separación de la lógica de negocio (en páginas y servicios) de la lógica de presentación (componentes reutilizables).
- **Context API Pattern:** Centralización del estado global de autenticación y sesión de usuario mediante `AuthContext`.
- **Service Layer Pattern:** Desacoplamiento de las peticiones HTTP mediante servicios especializados (`tutelaService`), facilitando el mantenimiento y las pruebas.
- **Protected Routes:** Implementación de Higher-Order Components (HOC) para la protección de rutas basada en el estado de autenticación.

## 3. Stack Tecnológico
| Tecnología | Propósito |
| :--- | :--- |
| **React 19** | Biblioteca principal para la interfaz de usuario. |
| **Vite** | Herramienta de construcción y servidor de desarrollo de alta velocidad. |
| **Tailwind CSS 4.0** | Framework de utilidades CSS para un diseño responsivo y moderno. |
| **React Router 7** | Gestión de navegación y enrutamiento dinámico. |
| **Axios** | Cliente HTTP para la comunicación con la API REST. |
| **Lucide React** | Set de iconos vectoriales consistentes. |
| **Recharts** | Visualización de datos y métricas en tiempo real (Dashboard). |
| **jsPDF / AutoTable** | Generación dinámica de reportes en formato PDF. |
| **React Hot Toast** | Sistema de notificaciones reactivas para feedback del usuario. |

## 4. Estructura del Proyecto
La organización del código sigue estándares de escalabilidad:

```text
src/
├── assets/          # Recursos estáticos (imágenes, logos).
├── components/      # Componentes UI reutilizables (Sidebar, Layout, ProtectedRoute).
├── context/         # Proveedores de estado global (Autenticación).
├── pages/           # Vistas principales de la aplicación (Dashboard, Detalle, etc.).
├── services/        # Lógica de comunicación con el Backend (API hooks/services).
├── App.jsx          # Configuración de rutas y proveedores.
├── main.jsx         # Punto de entrada de la aplicación.
└── constants.js     # Definición de enums (Estados, Prioridades).
```

## 5. Componentes y Módulos Clave

### 5.1. Gestión de Estado y Seguridad (`/context`)
- **AuthContext:** Gestiona el ciclo de vida de la sesión, almacenando datos del usuario y manejando la persistencia mediante `localStorage` y cookies seguras (`withCredentials`).

### 5.2. Servicios de Datos (`/services`)
- **tutelaService:** Centraliza las operaciones CRUD. Incluye funcionalidades avanzadas como:
    - Procesamiento de archivos mediante `FormData`.
    - Descarga automatizada de documentos Word generados por el backend.
    - Integración con endpoints de entrenamiento local (IA).
    - Gestión de sugerencias y trazabilidad de cambios.

### 5.3. Interfaz de Usuario (`/components` & `/pages`)
- **Layout:** Sistema de rejilla dinámico que implementa un Sidebar responsivo con soporte para dispositivos móviles.
- **Dashboard:** Panel analítico con visualización de estados y prioridades.
- **Procesar:** Interfaz de carga de documentos con metadatos específicos (responsable, días de término, área).
- **DetalleTutela:** Vista de 360° del caso, incluyendo historial de acciones y documentos de referencia.

## 6. Funcionalidades Destacadas
1. **Automatización Documental:** Interfaz para enviar documentos a procesamiento y recibir borradores de contestación.
2. **Sistema de Priorización:** Clasificación dinámica de tutelas según términos legales.
3. **Analítica en Tiempo Real:** Gráficos estadísticos para la toma de decisiones administrativas.
4. **Historial de Acciones:** Registro detallado (logs) de cada interacción realizada sobre una tutela específica.
5. **Generación de Reportes:** Exportación de datos a PDF y CSV para informes de gestión.

## 7. Instalación y Desarrollo
Para ejecutar el entorno de desarrollo local:

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno en un archivo `.env` (URL del backend).
3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

---
*Este README forma parte de la documentación técnica para el informe de práctica profesional de Alejandro Marín Torres.*
