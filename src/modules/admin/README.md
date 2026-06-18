# Módulo de Administración - Frontend (admin) ⚙️👥

Este módulo provee la interfaz para la gestión y administración de usuarios dentro del sistema.

## 🎯 Características Principales
- **Gestión de Usuarios (`GestionUsuarios.jsx`):** Interfaz exclusiva para administradores donde se listan todos los usuarios de la plataforma, permitiendo cambiar su rol de forma dinámica, habilitar o deshabilitar cuentas, y aprobar el registro de nuevas cuentas de abogados.

## ⚙️ Estructura del Módulo
```text
src/modules/admin/
└── pages/
    └── GestionUsuarios.jsx   # Vista de control administrativo
```

## 🔗 Integración y Servicios
- Se comunica directamente con los endpoints del backend en `/api/admin/usuarios`.
- Requiere rol administrador para poder acceder (protegido mediante `<AdminRoute>` en `App.jsx`).
