# Módulo de Perfil - Frontend (perfil) 👤⚙_

Módulo sencillo para la gestión y visualización de los datos del usuario autenticado en la sesión actual.

## 🎯 Características Principales
- **Mi Perfil (`MiPerfil.jsx`):** Interfaz para consultar los datos básicos del usuario actual (nombre, email, rol) y visualizar la lista detallada de permisos asignados a su cuenta en el sistema.

## ⚙️ Estructura del Módulo
```text
src/modules/perfil/
├── components/          # PerfilLayout
└── pages/               # MiPerfil.jsx
```

## 🔗 Integración y Servicios
- Muestra la información cargada desde `AuthContext` en el inicio de la sesión.
- Accesible para cualquier usuario autenticado en el sistema.
