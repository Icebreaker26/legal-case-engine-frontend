import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ProtectedRoute from '../components/ProtectedRoute';

export default function CoreLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/selector')}
              className="flex items-center gap-2 text-[#002E6D] hover:text-[#001d4a] font-semibold text-sm transition-colors"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Core Operating System</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden md:block text-xs text-gray-400 font-medium">{user.nombre}</span>
            )}
            <NotificationBell />
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
          <Outlet />
        </main>

        <footer className="py-4 text-center text-[10px] text-gray-300 uppercase tracking-widest font-mono">
          ICEBREAKER © 2026 // ARCHITECTURE: ALEJANDRO TORRES
        </footer>
      </div>
    </ProtectedRoute>
  );
}
