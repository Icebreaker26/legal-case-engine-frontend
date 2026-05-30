import { Outlet, Link } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';

/**
 * Layout base para el módulo de rendimiento.
 * Protegido por autenticación.
 */
export default function RendimientoLayout() {
  const { hasPermission } = useAuth();

  return (
    <ProtectedRoute>
      <div className="rendimiento-layout bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 p-4 flex gap-4">
            <h1 className="text-xl font-bold text-gray-800">Módulo de Rendimiento</h1>
            <nav className="flex gap-2">
                <Link to="/rendimiento/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
                <Link to="/rendimiento/manager" className="text-blue-600 hover:underline">Manager</Link>
                {hasPermission('rendimiento', 'MANAGE_TEAMS') && (
                    <Link to="/rendimiento/equipos" className="text-blue-600 hover:underline">Equipos</Link>
                )}
            </nav>
        </header>
        <main className="p-4">
            <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
