import { useAuth } from '../context/AuthContext';

/**
 * Componente para proteger partes de la UI basándose en permisos.
 * 
 * @param {string} modulo - Nombre del módulo (ej: 'tutelas')
 * @param {string} accion - Acción requerida (ej: 'READ', 'WRITE')
 * @param {React.ReactNode} children - Componentes a proteger
 * @param {React.ReactNode} fallback - (Opcional) Componente a mostrar si no hay permisos
 */
const PermissionGuard = ({ modulo, accion, children, fallback = null }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) return null; // O un spinner

  if (hasPermission(modulo, accion)) {
    return children;
  }

  return fallback;
};

export default PermissionGuard;
