import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, BrainCircuit, LogOut, User, UserCog, FileBarChart, Bell, BookOpen, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PermissionGuard from './PermissionGuard';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const handleNav = () => {
    if (onClose) onClose();
  };

  const linkClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
    }`;

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-enel-blue flex items-center gap-2">
           {import.meta.env.VITE_APP_NAME}
        </h2>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Enel LegalTech
        </span>
      </div>

      <nav className="flex-1 p-4 mt-4 space-y-2 overflow-y-auto" onClick={handleNav}>
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/procesar" className={linkClass}>
          <FileText size={20} />
          <span>Procesar</span>
        </NavLink>
        <NavLink to="/entrenar" className={linkClass}>
          <BrainCircuit size={20} />
          <span>Conocimiento</span>
        </NavLink>
        <NavLink to="/memoria" className={linkClass}>
          <BookOpen size={20} />
          <span>Memoria</span>
        </NavLink>
        <NavLink to="/calendario" className={linkClass}>
          <CalendarIcon size={20} />
          <span>Calendario</span>
        </NavLink>
        <PermissionGuard modulo="tutelas" accion="DELETE">
          <NavLink to="/papelera" className={linkClass}>
            <Trash2 size={20} />
            <span>Papelera</span>
          </NavLink>
        </PermissionGuard>
        <NavLink to="/informes" className={linkClass}>
          <FileBarChart size={20} />
          <span>Informes</span>
        </NavLink>
        <NavLink to="/notificaciones" className={linkClass}>
          <Bell size={20} />
          <span>Notificaciones</span>
        </NavLink>
        <PermissionGuard modulo="admin" accion="READ">
          <NavLink to="/admin" className={linkClass}>
            <UserCog size={20} />
            <span>Administración</span>
          </NavLink>
        </PermissionGuard>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{user?.nombre || 'Usuario'}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-xs text-red-600 font-bold hover:bg-red-50 py-2 rounded-lg transition-colors"
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
