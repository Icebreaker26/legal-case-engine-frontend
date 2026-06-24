import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from '../../../components/NotificationBell';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const isTutelas = theme === 'light';

  return (
    <div className={`min-h-screen ${theme === 'dark-pro' ? 'dark-pro-theme' : 'bg-gray-50'} lg:grid lg:grid-cols-[256px_1fr]`}>
      <ConstellationBackground baseOpacity={0.2} isTutelas={isTutelas} />
      {/* Botón hamburguesa (móvil) */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg shadow-md border ${theme === 'dark-pro' ? 'bg-[#050A05] border-[#1A441A]' : 'bg-white border-gray-200'}`}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Header con Acciones */}
      <header className="fixed top-4 right-4 z-[70] flex items-center gap-2">
         <NotificationBell />
         <button onClick={() => navigate('/selector')} className={`p-2 rounded-lg ${theme === 'dark-pro' ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-white text-gray-500 hover:text-blue-600'} border ${theme === 'dark-pro' ? 'border-slate-700' : 'border-gray-200'}`} title="Cambiar Módulo">
             <LayoutDashboard size={20} />
         </button>
         <button onClick={logout} className={`p-2 rounded-lg ${theme === 'dark-pro' ? 'bg-slate-800 text-red-400 hover:text-red-300' : 'bg-white text-red-600 hover:text-red-700'} border ${theme === 'dark-pro' ? 'border-slate-700' : 'border-gray-200'}`} title="Cerrar Sesión">
             <LogOut size={20} />
         </button>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 ${theme === 'dark-pro' ? 'bg-[#020617] border-r border-slate-800' : 'bg-white border-r border-gray-200'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Overlay oscuro móvil */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Contenido principal */}
      <main className="p-4 lg:p-10 pt-16 lg:pt-10 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
