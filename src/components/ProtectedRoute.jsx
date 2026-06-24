import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';
import NotFound from '../pages/NotFound';

const KNOWN_PATHS = [
  '/', '/selector', '/login', '/landing', '/register', '/registration-pending',
  '/change-password', '/perfil', '/usuarios', '/catalogos', '/catalogos/areas',
  '/comunicaciones', '/pagos', '/rendimiento', '/conformidades', '/contratos',
  '/ambiental', '/reportes', '/core', '/notificaciones',
  '/procesar', '/entrenar', '/memoria', '/calendario', '/papelera', '/admin', '/informes',
];

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-[#4ade80] font-mono relative overflow-hidden">
        <ConstellationBackground />
        <motion.div 
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="uppercase tracking-[0.3em] z-10"
        >
          INICIALIZANDO CORE...
        </motion.div>
      </div>
    );
  }
  
  if (user && user.mustChangePassword && window.location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
  }

  if (!user) {
    const isKnown = KNOWN_PATHS.some(p =>
      location.pathname === p || location.pathname.startsWith(p + '/')
    );
    return isKnown ? <Navigate to="/landing" replace /> : <NotFound />;
  }
  
  return children;
}
