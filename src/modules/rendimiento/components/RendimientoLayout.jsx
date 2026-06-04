import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, LayoutGrid, Menu, X } from 'lucide-react';
import NotificationBell from '../../../components/NotificationBell';

export default function RendimientoLayout() {
  const { hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/rendimiento", label: "Dashboard" },
    { to: "/rendimiento/manager", label: "Manager", requiredPermission: ['rendimiento', 'MANAGE_TEAMS'] },
    { to: "/rendimiento/equipos", label: "Equipos", requiredPermission: ['rendimiento', 'MANAGE_TEAMS'] }
  ].filter(link => !link.requiredPermission || hasPermission(link.requiredPermission[0], link.requiredPermission[1]));

  return (
    <ProtectedRoute>
      <div className="rendimiento-layout bg-[#050A05] min-h-screen text-[#33FF33] font-mono selection:bg-[#1A441A] selection:text-white">
        {/* Scanline effect overlay */}
        <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_4px,3px_100%]"></div>
        
        <header className="border-b-2 border-[#1A441A] p-4 flex justify-between items-center relative z-[101]">
            <h1 className="text-xl font-bold uppercase tracking-widest text-[#33FF33]">[ R_M0DULO RENDIM1ENT0 ]</h1>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-4 items-center">
                {navLinks.map(link => (
                    <Link key={link.to} to={link.to} className="hover:bg-[#1A441A] px-2 uppercase">{link.label}</Link>
                ))}
                <div className="flex items-center gap-4 border-l border-[#1A441A] pl-4">
                    <NotificationBell theme="dark" />
                    <button onClick={() => navigate('/selector')} className="text-[#33FF33] hover:text-white"><LayoutGrid size={18} /></button>
                    <button onClick={logout} className="text-[#33FF33] hover:text-red-500"><LogOut size={18} /></button>
                </div>
            </nav>

            {/* Mobile Nav Button */}
            <button className="md:hidden text-[#33FF33]" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X /> : <Menu />}
            </button>
        </header>

        {/* Mobile Menu */}
        {isOpen && (
            <div className="md:hidden bg-[#050A05] border-b-2 border-[#1A441A] p-4 z-[101] flex flex-col gap-4 relative">
                <div className="flex items-center justify-between">
                    <NotificationBell theme="dark" />
                    <button onClick={() => setIsOpen(false)}><X /></button>
                </div>
                {navLinks.map(link => (
                    <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)} className="hover:bg-[#1A441A] px-2 uppercase">{link.label}</Link>
                ))}
                <div className="flex gap-4 pt-4 border-t border-[#1A441A]">
                    <button onClick={() => navigate('/selector')} className="text-[#33FF33]"><LayoutGrid size={24} /></button>
                    <button onClick={logout} className="text-[#33FF33]"><LogOut size={24} /></button>
                </div>
            </div>
        )}

        <main className="p-6 relative z-10">
            <Outlet />
        </main>
        
        <footer className="border-t-2 border-[#1A441A] p-4 text-[10px] uppercase tracking-widest text-[#1A441A] flex justify-between relative z-10">
            <span>[ SYSTEM_ID: ICEBREAKER/DEV ]</span>
            <span>[ OPERATOR: ALEJANDRO TORRES ]</span>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
