import { Outlet, Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, LayoutGrid, BarChart2 } from 'lucide-react';
import NotificationBell from '../../../components/NotificationBell';

export default function ReportesLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
          <Link to="/reportes" className="text-xl font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-2 hover:text-indigo-900 transition-colors">
            <BarChart2 /> Reportes
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={() => navigate('/selector')} className="text-gray-600 hover:text-indigo-700 transition-colors" title="Cambiar Módulo">
              <LayoutGrid size={18} />
            </button>
            <button onClick={logout} className="text-gray-600 hover:text-red-600 transition-colors" title="Cerrar Sesión">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
