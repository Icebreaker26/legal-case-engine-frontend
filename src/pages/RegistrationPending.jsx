import { Link } from 'react-router-dom';
import { ShieldCheck, Mail } from 'lucide-react';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function RegistrationPending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] font-mono relative overflow-hidden text-center">
        <ConstellationBackground />
        <div className="bg-[#0F172A]/40 backdrop-blur-xl p-12 border border-slate-800 w-full max-w-md shadow-2xl z-10">
            <ShieldCheck className="text-amber-400 mx-auto mb-6" size={64} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-4">[ REGISTRO COMPLETADO ]</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Tu solicitud ha sido enviada correctamente. <br/><br/>
                Para mantener la seguridad del sistema, un administrador debe revisar y aprobar tu acceso antes de que puedas ingresar.
            </p>
            <div className="flex items-center justify-center gap-2 text-emerald-900 text-xs mb-8">
                <Mail size={16} />
                <span>RECIBIRÁS UNA NOTIFICACIÓN POR EMAIL</span>
            </div>
            <Link to="/login" className="block w-full py-4 bg-[#1A441A] text-[#33FF33] hover:bg-[#33FF33] hover:text-[#050A05] font-bold uppercase tracking-[0.2em] transition-all duration-300 border border-[#33FF33]">
                [ VOLVER AL LOGIN ]
            </Link>
        </div>
    </div>
  );
}
