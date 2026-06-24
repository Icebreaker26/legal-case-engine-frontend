import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, Terminal } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.post('/auth/login', formData);
      login(response.data.user);

      toast.success('Acceso autorizado');
      window.location.href = '/selector';
    } catch (error) {
      toast.error('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] font-mono relative overflow-hidden">
        <ConstellationBackground />

      <div className="bg-[#0F172A]/40 backdrop-blur-xl p-12 border border-slate-800 w-full max-w-sm shadow-2xl z-10 animate-neon-pulse">
        <div className="flex justify-start mb-6 -mt-4">
          <Link to="/landing" className="text-[9px] uppercase tracking-[0.2em] text-[#1A441A] hover:text-[#33FF33] transition-colors">
            {'<'} VOLVER AL INICIO
          </Link>
        </div>
        <div className="flex flex-col items-center mb-10">
            <Terminal className="text-[#33FF33] mb-4" size={48} />
            <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em]">[ SYSTEM_ACCESS ]</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-0 top-3 text-[#1A441A]" size={18} />
            <input 
              type="email" placeholder="USER_IDENTIFIER" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
              onChange={(e) => setFormData({...formData, email: e.target.value})} required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-0 top-3 text-[#1A441A]" size={18} />
            <input 
              type="password" placeholder="SECURITY_KEY" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
              onChange={(e) => setFormData({...formData, password: e.target.value})} required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-[#1A441A] text-[#33FF33] hover:bg-[#33FF33] hover:text-[#050A05] font-bold uppercase tracking-[0.2em] transition-all duration-300 border border-[#33FF33]">
            [ INITIALIZE_SESSION ]
          </button>
        </form>
        
        <p className="mt-8 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em]">
          ¿No tienes acceso? <Link to="/register" className="text-blue-500 hover:text-white transition-colors">SOLICITAR_REGISTRO</Link>
        </p>
      </div>
    </div>
  );
}
