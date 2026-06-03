import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark-pro' ? 'dark-pro-theme' : 'bg-gray-50'} lg:grid lg:grid-cols-[256px_1fr]`}>
      <ConstellationBackground baseOpacity={0.2} isTutelas={true} />
      {/* Botón hamburguesa (móvil) */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg shadow-md border ${theme === 'dark-pro' ? 'bg-[#050A05] border-[#1A441A]' : 'bg-white border-gray-200'}`}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Botón de Tema (Fijo) */}
      <button onClick={toggleTheme} className="fixed bottom-4 right-4 z-[70] p-3 bg-blue-600 text-white rounded-full shadow-lg">
        {theme === 'dark-pro' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Sidebar */}
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
