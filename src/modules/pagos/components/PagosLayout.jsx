import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, LayoutGrid, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationBell from '../../../components/NotificationBell';

export default function PagosLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/pagos/dashboard", label: "Dashboard" },
    { to: "/pagos", label: "Lista" },
    { to: "/pagos/gestion", label: "Gestión" },
    { to: "/pagos/nueva", label: "Nueva Solicitud" }
  ];

  return (
    <ProtectedRoute>
      <div className="pagos-layout bg-[#2c2c2c] min-h-screen font-mono text-[#1a1a1a] relative overflow-hidden">
        
        {/* Efecto Ruido/Grano de Película */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-20" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')"}}></div>

        {/* Efecto Scanlines */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)", backgroundSize: "100% 4px"}}></div>
        
        {/* Animación de Barrido */}
        <motion.div 
            className="absolute top-0 left-0 w-full h-[2px] bg-black opacity-[0.1] z-20 pointer-events-none"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        <header className="bg-[#e0dcc8] border-b-4 border-double border-[#2d4a3e] p-4 flex justify-between items-center relative z-50">
            <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-[#2d4a3e]">Módulo de Pagos (PDP)</h1>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
                <nav className="flex gap-4">
                    {navLinks.map(link => (
                        <Link key={link.to} to={link.to} className="text-[#2d4a3e] font-bold hover:underline uppercase tracking-widest text-sm">{link.label}</Link>
                    ))}
                </nav>
                
                <div className="flex items-center gap-4 border-l-2 border-[#2d4a3e] pl-4">
                    <NotificationBell />
                    <button onClick={() => navigate('/selector')} className="text-[#2d4a3e] flex items-center gap-1 hover:text-black transition-colors" title="Cambiar Módulo">
                        <LayoutGrid size={18} />
                    </button>
                    <button onClick={logout} className="text-[#2d4a3e] flex items-center gap-1 hover:text-red-700 transition-colors" title="Cerrar Sesión">
                        <LogOut size={18} />
                    </button>
                </div>
            </nav>

            {/* Mobile Nav Button */}
            <button className="md:hidden text-[#2d4a3e]" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X /> : <Menu />}
            </button>
        </header>

        {/* Mobile Menu */}
        {isOpen && (
            <div className="md:hidden bg-[#e0dcc8] p-4 border-b-4 border-double border-[#2d4a3e] z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <NotificationBell />
                    <button onClick={() => setIsOpen(false)}><X /></button>
                </div>
                {navLinks.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className="text-[#2d4a3e] font-bold uppercase tracking-widest">{link.label}</Link>
                ))}
                <div className="flex gap-4 pt-4 border-t border-[#2d4a3e]">
                    <button onClick={() => navigate('/selector')} className="text-[#2d4a3e]"><LayoutGrid size={24} /></button>
                    <button onClick={logout} className="text-[#2d4a3e]"><LogOut size={24} /></button>
                </div>
            </div>
        )}

        <main className="p-6 relative z-10 flex-grow">
            <Outlet />
        </main>

        <footer className="mt-auto py-6 text-[#2d4a3e] text-[10px] uppercase tracking-[0.2em] font-mono flex flex-col items-center gap-2 z-10 border-t border-[#2d4a3e]">
            <span>ICEBREAKER © 2026 // ARCHITECTURE: ALEJANDRO TORRES</span>
            <span className="opacity-70">// SECURE_ENTERPRISE_ENVIRONMENT //</span>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
