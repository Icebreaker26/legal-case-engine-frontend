import { Outlet, Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, LayoutGrid } from 'lucide-react';

export default function ComunicacionesLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="comunicaciones-layout bg-[#2c2c2c] min-h-screen font-mono text-[#1a1a1a]">
        <header className="bg-[#e0dcc8] border-b-2 border-[#2d4a3e] p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Sistema de Comunicaciones</h1>
            
            <nav className="flex items-center gap-6">
                <nav className="flex gap-4">
                    <Link to="/comunicaciones/dashboard" className="text-[#2d4a3e] font-bold hover:underline uppercase tracking-wide text-sm">Dashboard</Link>
                    <Link to="/comunicaciones" className="text-[#2d4a3e] font-bold hover:underline uppercase tracking-wide text-sm">Lista</Link>
                    <Link to="/comunicaciones/gestion" className="text-[#2d4a3e] font-bold hover:underline uppercase tracking-wide text-sm">Gestión</Link>
                    <Link to="/comunicaciones/nueva" className="text-[#2d4a3e] font-bold hover:underline uppercase tracking-wide text-sm">Nueva</Link>
                </nav>
                
                <div className="flex items-center gap-4 border-l-2 border-[#2d4a3e] pl-4">
                    <button onClick={() => navigate('/selector')} className="text-[#2d4a3e] flex items-center gap-1 hover:text-black transition-colors" title="Cambiar Módulo">
                        <LayoutGrid size={18} />
                    </button>
                    <button onClick={logout} className="text-[#2d4a3e] flex items-center gap-1 hover:text-red-700 transition-colors" title="Cerrar Sesión">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>
        </header>
        <main className="p-6">
            <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
