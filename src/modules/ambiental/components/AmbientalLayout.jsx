import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, LayoutGrid, Menu, X, Leaf } from 'lucide-react';
import NotificationBell from '../../../components/NotificationBell';

export default function AmbientalLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: '/ambiental',             label: 'Expedientes' },
    { to: '/ambiental/dashboard',   label: 'Dashboard'   },
    { to: '/ambiental/calendario',  label: 'Calendario'  },
  ];

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-bold uppercase tracking-widest text-green-700 flex items-center gap-2">
            <Leaf /> Derecho Ambiental
          </h1>

          <nav className="hidden md:flex items-center gap-6">
            <div className="flex gap-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-600 font-bold hover:text-green-700 uppercase tracking-widest text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4 border-l border-gray-300 pl-4">
              <NotificationBell />
              <button onClick={() => navigate('/selector')} className="text-gray-600 hover:text-green-700 transition-colors" title="Cambiar Módulo">
                <LayoutGrid size={18} />
              </button>
              <button onClick={logout} className="text-gray-600 hover:text-red-600 transition-colors" title="Cerrar Sesión">
                <LogOut size={18} />
              </button>
            </div>
          </nav>

          <button className="md:hidden text-gray-600" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </header>

        {isOpen && (
          <div className="md:hidden bg-white p-4 border-b border-gray-200 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="text-gray-600 font-bold uppercase tracking-widest"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
