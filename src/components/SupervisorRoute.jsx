import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SupervisorRoute = ({ children }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;

  if (hasPermission('supervisor', 'READ') || hasPermission('admin', 'READ')) {
    return children;
  }

  return <Navigate to="/" replace />;
};

export default SupervisorRoute;
