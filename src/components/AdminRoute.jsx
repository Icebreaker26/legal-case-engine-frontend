import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para restringir rutas solo a administradores.
 * Valida que el usuario tenga el permiso 'admin:READ'.
 */
const AdminRoute = ({ children }) => {
  const { hasPermission, loading } = useAuth();
  
  if (loading) return null; // Opcional: mostrar un spinner aquí
  
  if (hasPermission('admin', 'READ')) {
    return children;
  }
  
  // Si no tiene permisos, redirigir al inicio
  return <Navigate to="/" replace />;
};

export default AdminRoute;
