import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.post('/auth/login', formData);
      login(response.data.user);

      toast.success('Bienvenido de nuevo');
      navigate('/');
    } catch (error) {
      toast.error('Credenciales inválidas');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-[#002E6D] mb-6">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="email" placeholder="Correo corporativo" className="w-full pl-10 pr-4 py-2 border rounded-lg"
              onChange={(e) => setFormData({...formData, email: e.target.value})} required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="password" placeholder="Contraseña" className="w-full pl-10 pr-4 py-2 border rounded-lg"
              onChange={(e) => setFormData({...formData, password: e.target.value})} required
            />
          </div>
          <button type="submit" className="w-full py-2 bg-[#002E6D] text-white rounded-lg font-bold hover:bg-[#001d4a]">
            Ingresar
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ¿No tienes cuenta? <Link to="/register" className="text-[#002E6D] font-bold">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
