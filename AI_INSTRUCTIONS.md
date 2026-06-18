# AI Frontend Development Instructions & Context 🖥️✨

Welcome, AI Agent! This file contains critical architectural rules, conventions, and guidelines for working on the **TutelaIA Frontend**. Please read this file carefully before making changes.

---

## 🏛️ 1. Technical Stack & Key Architecture

*   **Runtime & Builder:** React 18/19 (built with Vite). Fast refresh is enabled.
*   **Routing:** React Router (v6/v7). Check `src/App.jsx` for route declarations.
*   **Styling:** Tailwind CSS. Do not use inline styles or standard CSS unless absolutely necessary.
*   **State Management:**
    *   Authentication and session state are managed in `src/context/AuthContext.jsx`.
    *   API authorization depends on credentials sent via HTTPOnly cookies (Axios is configured with `withCredentials: true`).
*   **API Calls:** Abstracted in `src/services/` (e.g., `apiService.js`, `tutelaService.js`). Avoid making raw `fetch` or `axios` calls directly inside components. Use the service layer.

---

## 🧩 2. Directory Structure & Modular Design

Code is split between global pages/components and module-specific workflows:

*   **Global Components (`src/components/`):** Universal layouts (`Layout`, `Sidebar`), guards (`ProtectedRoute`, `AdminRoute`, `PermissionGuard`), and modals.
*   **Global Pages (`src/pages/`):** Core application pages like `Dashboard.jsx`, `DetalleTutela.jsx`, `Procesar.jsx`, `Login.jsx`.
*   **Modules Folder (`src/modules/`):** Contains sub-applications/modules like `admin`, `comunicaciones`, `conformidades`, `pagos`, `perfil`, and `rendimiento`.
    *   Each module has its own local `components/` and `pages/` (e.g., `src/modules/rendimiento/pages/GestorEquipos.jsx`).

---

## 🎨 3. Design Guidelines & Harmonious Styling

We aim for premium, high-impact aesthetics:
1.  **Sleek Dark Mode / Vibrant Palette:** Maintain a clean, modern aesthetic with smooth transitions and subtle micro-animations (e.g., `pulse` on high-priority items).
2.  **Typography & Hierarchy:** Use Outfit or Inter fonts via classes. Always maintain proper heading hierarchies.
3.  **Color Conventions for Case States:**
    *   **Pending / Pendiente:** Amber/Yellow badge (`text-amber-600 bg-amber-50` or custom classes).
    *   **In Progress / En Proceso:** Blue badge (`text-blue-600 bg-blue-50`).
    *   **Resolved / Respondida:** Green badge (`text-green-600 bg-green-50`).
    *   **High Priority:** Red background/borders with animations.

---

## 🛡️ 4. Guards & RBAC (Role-Based Access Control)

Before displaying paths or buttons:
*   Wrap restricted components with `<PermissionGuard module="module_name" action="READ/WRITE">...</PermissionGuard>`.
*   Wrap routes in `src/App.jsx` with `<AdminRoute>...</AdminRoute>` to restrict access to administrator screens.
