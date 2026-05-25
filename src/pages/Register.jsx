import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, BookOpen } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      await axios.post('http://localhost:4000/api/auth/register', formData);
      toast.success('Usuario registrado exitosamente');
      navigate('/login');
    } catch (error) {
      toast.error('Error al registrar usuario: ' + (error.response?.data?.error || 'Intente de nuevo'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-[#002E6D] mb-6">Crear Cuenta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Nombre completo" className="w-full pl-10 pr-4 py-2 border rounded-lg"
              onChange={(e) => setFormData({...formData, nombre: e.target.value})} required
            />
          </div>
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
          <div className="relative">
            <BookOpen className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Especialidad (ej: Civil, Ambiental)" className="w-full pl-10 pr-4 py-2 border rounded-lg"
              onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full py-2 bg-[#002E6D] text-white rounded-lg font-bold hover:bg-[#001d4a]">
            Registrarse
          </button>
        </form>
      </div>
    </div>
  );
}
