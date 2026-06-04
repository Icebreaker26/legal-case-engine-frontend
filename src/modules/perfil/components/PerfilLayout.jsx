import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';
import NotificationBell from '../../../components/NotificationBell';

export default function PerfilLayout() {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${theme === 'dark-pro' ? 'dark-pro-theme' : 'bg-gray-50'}`}>
      <ConstellationBackground baseOpacity={0.2} isTutelas={true} />
      
      <header className="fixed top-0 w-full p-4 flex justify-end items-center gap-4 z-[70] bg-transparent">
        <NotificationBell theme="light" />
        <button onClick={() => navigate('/selector')} className="p-2 rounded-full bg-slate-800 text-white shadow-lg" title="Módulos">
          <LayoutGrid size={20} />
        </button>
        <button onClick={logout} className="p-2 rounded-full bg-red-600 text-white shadow-lg" title="Cerrar Sesión">
          <LogOut size={20} />
        </button>
      </header>

      {/* Contenido principal - Sin Sidebar */}
      <main className="p-4 lg:p-10 pt-20 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
