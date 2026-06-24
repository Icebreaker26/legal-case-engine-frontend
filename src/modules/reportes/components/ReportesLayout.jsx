import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut, BarChart2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import NotificationBell from '../../../components/NotificationBell';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';

export default function ReportesLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-mono relative overflow-hidden">
        <ConstellationBackground />

        <header className="relative z-50 border-b border-slate-800/50 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/reportes')}
              className="flex items-center gap-2 text-sm font-medium tracking-[0.3em] text-white uppercase hover:text-indigo-400 transition-colors"
            >
              <BarChart2 size={15} className="text-indigo-400" />
              REPORTES
            </button>
            <span className="text-indigo-900 text-[10px] tracking-[0.2em]">{'>'} CONSULTA CROSS-MÓDULO</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:block text-[10px] text-slate-500 uppercase tracking-widest">{user.nombre}</span>
            )}
            <div className="[&_button]:text-slate-400 [&_button:hover]:text-slate-200 [&_button:hover]:bg-slate-800/50">
              <NotificationBell />
            </div>
            <button
              onClick={() => navigate('/selector')}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 transition-all"
            >
              <LayoutGrid size={13} /> [ MÓDULOS ]
            </button>
            <button
              onClick={logout}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 hover:text-red-300 flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </header>

        <main className="relative z-10 flex-1 px-6 py-8 w-full max-w-[1400px] mx-auto">
          <Outlet />
        </main>

        <footer className="relative z-10 py-5 text-center text-slate-800 text-[10px] uppercase tracking-[0.2em] border-t border-slate-900">
          ICEBREAKER © 2026 // ARCHITECTURE: ALEJANDRO TORRES
        </footer>
      </div>
    </ProtectedRoute>
  );
}
