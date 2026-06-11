import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, BarChart3, Settings, Shield, Mail, LogOut, Wallet, User } from 'lucide-react';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function ModuleSelector() {
  const { hasPermission, logout } = useAuth();

  const modules = [
    {
      id: 'tutelas',
      name: 'Derechos de Petición',
      description: 'Gestión documental y flujo de procesos legales',
      path: '/',
      icon: <FileText size={40} className="text-blue-400" />,
      permission: ['tutelas', 'READ'],
      hoverGlow: 'hover:border-blue-500 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.5)]'
    },
    {
      id: 'rendimiento',
      name: 'Módulo Rendimiento',
      description: 'Analítica avanzada y seguimiento de objetivos',
      path: '/rendimiento',
      icon: <BarChart3 size={40} className="text-emerald-400" />,
      permission: ['rendimiento', 'READ'],
      hoverGlow: 'hover:border-emerald-500 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)]'
    },
    {
      id: 'comunicaciones',
      name: 'Comunicaciones',
      description: 'Gestión de correspondencia y trazabilidad',
      path: '/comunicaciones/dashboard',
      icon: <Mail size={40} className="text-amber-400" />,
      permission: ['comunicaciones', 'READ_COM'],
      hoverGlow: 'hover:border-amber-500 hover:shadow-[0_0_25px_-5px_rgba(251,191,36,0.5)]'
    },
    {
      id: 'pagos',
      name: 'Módulo Pagos (PDP)',
      description: 'Gestión y trazabilidad de pagos SAP',
      path: '/pagos',
      icon: <Wallet size={40} className="text-sky-400" />,
      permission: ['pagos', 'READ_PAGO'],
      hoverGlow: 'hover:border-sky-500 hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.5)]'
    },
    {
      id: 'conformidades',
      name: 'Módulo Conformidades',
      description: 'Gestión y trazabilidad de conformidades',
      path: '/conformidades',
      icon: <Shield size={40} className="text-emerald-400" />,
      permission: ['conformidades', 'READ'],
      hoverGlow: 'hover:border-emerald-500 hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)]'
    },
    {
      id: 'perfil',
      name: 'Mi Perfil',
      description: 'Ver mis tareas y actividades asignadas',
      path: '/perfil',
      icon: <User size={40} className="text-slate-400" />,
      permission: ['perfil', 'READ'], 
      hoverGlow: 'hover:border-slate-500 hover:shadow-[0_0_25px_-5px_rgba(148,163,184,0.5)]'
    },
    {
      id: 'admin',
      name: 'Administración',
      description: 'Configuración, usuarios y permisos del sistema',
      path: '/usuarios',
      icon: <Settings size={40} className="text-purple-400" />,
      permission: ['admin', 'READ'],
      hoverGlow: 'hover:border-purple-500 hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.5)]'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 flex flex-col items-center relative overflow-hidden">
        <ConstellationBackground />
        
        <header className="w-full max-w-6xl mb-16 flex justify-between items-center border-b border-slate-800/50 pb-8 z-10">
            <div>
                <h1 className="text-xl font-medium tracking-[0.3em] text-white uppercase">ICEBREAKER CORE OPERATING SYSTEM</h1>
                <p className="text-emerald-900 text-[10px] font-mono mt-1 tracking-[0.2em]">{'>'} GESTIÓN CENTRALIZADA</p>
            </div>
            <div className="text-right font-mono flex flex-col items-end gap-2">
                <button onClick={logout} className="text-xs text-red-500 hover:text-red-300 flex items-center gap-1 uppercase tracking-widest transition-colors">
                    <LogOut size={12} /> Logout
                </button>
                <p className="text-[10px] text-slate-500">VERSION: 2.0.26</p>
            </div>
        </header>

        <main className="w-full max-w-6xl z-10">
            <h2 className="text-2xl font-light text-slate-400 mb-12 uppercase tracking-[0.3em] text-center">Seleccione un módulo operativo</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {modules
                  .filter(mod => hasPermission(mod.permission[0], mod.permission[1]))
                  .map((mod) => (
                        <Link 
                            key={mod.id} 
                            to={mod.path}
                            className={`group bg-slate-900/50 backdrop-blur-md p-8 rounded-none border border-slate-700 hover:border-slate-500 transition-all duration-300 ${mod.hoverGlow} flex flex-col items-center text-center shadow-xl`}
                        >
                            <div className="mb-8 p-6 bg-[#020617] rounded-full group-hover:scale-105 transition-transform duration-300 border border-slate-800">
                                {mod.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{mod.name}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">{mod.description}</p>
                            <div className="mt-auto text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                                [ ACCEDER ]
                            </div>
                        </Link>
                ))}
            </div>
        </main>

        <footer className="mt-auto pt-20 text-slate-700 text-[10px] uppercase tracking-[0.2em] font-mono flex flex-col items-center gap-2 z-10">
            <span>ICEBREAKER © 2026 // ARCHITECTURE: ALEJANDRO TORRES</span>
            <span className="text-slate-800">// SECURE_ENTERPRISE_ENVIRONMENT //</span>
        </footer>
    </div>
  );
}
