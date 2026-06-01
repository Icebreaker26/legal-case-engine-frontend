import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
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
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
