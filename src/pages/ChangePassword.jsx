import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.patch('/auth/change-password', { newPassword: password });
      toast.success('Contraseña actualizada. Inicia sesión de nuevo.');
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Error al actualizar la contraseña');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] font-mono relative overflow-hidden">
        <ConstellationBackground />
        <div className="bg-[#0F172A]/40 backdrop-blur-xl p-12 border border-slate-800 w-full max-w-sm shadow-2xl z-10">
            <ShieldCheck className="text-amber-400 mx-auto mb-6" size={48} />
            <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-6 text-center">[ CAMBIO REQUERIDO ]</h2>
            <p className="text-slate-400 text-xs mb-8 text-center">Tu contraseña ha sido reseteada por un administrador. Debes definir una nueva para continuar.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <Lock className="absolute left-0 top-3 text-[#1A441A]" size={18} />
                    <input 
                      type="password" placeholder="NUEVA CONTRASEÑA" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
                      onChange={(e) => setPassword(e.target.value)} required
                    />
                </div>
                <button type="submit" className="w-full py-4 bg-[#1A441A] text-[#33FF33] hover:bg-[#33FF33] hover:text-[#050A05] font-bold uppercase tracking-[0.2em] transition-all duration-300 border border-[#33FF33]">
                    [ ACTUALIZAR ]
                </button>
            </form>
        </div>
    </div>
  );
}
