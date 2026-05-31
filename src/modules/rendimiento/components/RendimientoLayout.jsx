import { Outlet, Link } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';

/**
 * Layout base para el módulo de rendimiento.
 * Protegido por autenticación.
 */
export default function RendimientoLayout() {
  const { hasPermission } = useAuth();

  return (
    <ProtectedRoute>
      <div className="rendimiento-layout bg-[#050A05] min-h-screen text-[#33FF33] font-mono selection:bg-[#1A441A] selection:text-white">
        {/* Scanline effect overlay */}
        <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_4px,3px_100%]"></div>
        
        <header className="border-b-2 border-[#1A441A] p-4 flex gap-4 items-center">
            <h1 className="text-xl font-bold uppercase tracking-widest">[ R_M0DULO RENDIM1ENT0 ]</h1>
            <nav className="flex gap-4 ml-auto">
                <Link to="/rendimiento/dashboard" className="hover:bg-[#1A441A] px-2 uppercase">Dashboard</Link>
                <Link to="/rendimiento/manager" className="hover:bg-[#1A441A] px-2 uppercase">Manager</Link>
                {hasPermission('rendimiento', 'MANAGE_TEAMS') && (
                    <Link to="/rendimiento/equipos" className="hover:bg-[#1A441A] px-2 uppercase">Equipos</Link>
                )}
            </nav>
        </header>
        <main className="p-6">
            <Outlet />
        </main>
        
        <footer className="border-t-2 border-[#1A441A] p-4 text-[10px] uppercase tracking-widest text-[#1A441A] flex justify-between">
            <span>[ SYSTEM_ID: ICEBREAKER/DEV ]</span>
            <span>[ OPERATOR: ALEJANDRO TORRES ]</span>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
