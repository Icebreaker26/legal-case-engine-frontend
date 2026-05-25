import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[256px_1fr]">
      {/* Botón hamburguesa (móvil) */}
      <div className="lg:hidden fixed top-4 left-4 z-[60]">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-white rounded-lg shadow-md border border-gray-200">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar: Overlay en móvil, Sticky en desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Overlay oscuro móvil */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Contenido principal */}
      <main className="p-4 lg:p-10 pt-16 lg:pt-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}