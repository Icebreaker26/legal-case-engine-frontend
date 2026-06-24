import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ProtectedRoute from '../components/ProtectedRoute';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function CoreLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-mono relative overflow-hidden">
        <ConstellationBackground />

        {/* Navbar */}
        <header className="relative z-50 border-b border-slate-800/50 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium tracking-[0.3em] text-white uppercase">
              CORE OPERATING SYSTEM
            </span>
            <span className="text-emerald-900 text-[10px] tracking-[0.2em]">{'>'} SISTEMA CENTRALIZADO</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:block text-[10px] text-slate-500 uppercase tracking-widest">{user.nombre}</span>
            )}

            {/* Campana — adaptada al tema oscuro */}
            <div className="[&_button]:text-slate-400 [&_button:hover]:text-slate-200 [&_button:hover]:bg-slate-800/50">
              <NotificationBell />
            </div>

            <button
              onClick={() => navigate('/selector')}
              title="Selector de módulos"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 transition-all duration-200"
            >
              <LayoutGrid size={13} />
              [ MÓDULOS ]
            </button>

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 hover:text-red-300 flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="relative z-10 flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
          <Outlet />
        </main>

        <footer className="relative z-10 py-5 text-center text-slate-700 text-[10px] uppercase tracking-[0.2em] border-t border-slate-900">
          ICEBREAKER © 2026 // ARCHITECTURE: ALEJANDRO TORRES
        </footer>
      </div>
    </ProtectedRoute>
  );
}
