import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, BookOpen, Shield } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    especialidad: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.post('/auth/register', formData);
      toast.success('Usuario registrado exitosamente');
      navigate('/login');
    } catch (error) {
      toast.error('Error al registrar usuario: ' + (error.response?.data?.error || 'Intente de nuevo'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] font-mono relative overflow-hidden">
        <ConstellationBackground />
      <div className="bg-[#0F172A]/40 backdrop-blur-xl p-12 border border-slate-800 w-full max-w-sm shadow-2xl z-10 animate-neon-pulse">
        <div className="flex flex-col items-center mb-10">
            <Shield className="text-emerald-500 mb-4" size={48} />
            <h2 className="text-lg font-bold text-white uppercase tracking-normal">[ REGISTRO_SISTEMA ]</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute left-0 top-3 text-[#1A441A]" size={18} />
            <input 
              type="text" placeholder="NOMBRE COMPLETO" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
              onChange={(e) => setFormData({...formData, nombre: e.target.value})} required
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-0 top-3 text-[#1A441A]" size={18} />
            <input 
              type="email" placeholder="CORREO" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
              onChange={(e) => setFormData({...formData, email: e.target.value})} required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-0 top-3 text-[#1A441A]" size={18} />
            <input 
              type="password" placeholder="CONTRASEÑA" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
              onChange={(e) => setFormData({...formData, password: e.target.value})} required
            />
          </div>
          <div className="relative">
            <BookOpen className="absolute left-0 top-3 text-[#1A441A]" size={18} />
            <input 
              type="text" placeholder="ESPECIALIDAD" className="w-full bg-transparent border-b border-[#1A441A] pl-8 pr-4 py-3 text-white outline-none focus:border-[#33FF33] transition-colors uppercase tracking-widest text-sm"
              onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full py-4 bg-[#1A441A] text-[#33FF33] hover:bg-[#33FF33] hover:text-[#050A05] font-bold uppercase tracking-[0.2em] transition-all duration-300 border border-[#33FF33]">
            [ REGISTRARSE ]
          </button>
        </form>
        <p className="mt-8 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em]">
          ¿Ya tienes acceso? <Link to="/login" className="text-blue-500 hover:text-white transition-colors">ACCEDER AL SISTEMA</Link>
        </p>
      </div>
    </div>
  );
}
