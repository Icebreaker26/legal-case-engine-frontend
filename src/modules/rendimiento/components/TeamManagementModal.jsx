import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';

export default function TeamManagementModal({ equipo, onClose, onRefresh }) {
  const [abogados, setAbogados] = useState([]);
  const [selectedAbogado, setSelectedAbogado] = useState('');

  useEffect(() => {
    fetchAbogados();
  }, []);

  const fetchAbogados = async () => {
    try {
      const { data } = await apiService.get('/admin/usuarios');
      setAbogados(data);
    } catch (error) { toast.error('Error al cargar profesionales'); }
  };

  const handleAsignar = async () => {
    if (!selectedAbogado) return;
    try {
      await apiService.post('/rendimiento/equipos/asignar', { 
        equipo_id: equipo.id, 
        usuario_uuid: selectedAbogado
      });
      toast.success('Profesional asignado');
      onRefresh();
      onClose(); // <-- Cerramos el modal
    } catch (error) { toast.error('Error al asignar'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-black border border-green-900 w-full max-w-md rounded-lg shadow-2xl font-mono">
        <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-green-900">
          <h2 className="text-green-400 font-bold uppercase text-xs">Gestión: {equipo.nombre}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
        
        <div className="p-4 text-green-500 text-xs">
          <label className="block text-gray-500 mb-1 uppercase">Asignar Profesional:</label>
          <div className="flex gap-2">
            <select 
                className="bg-black border border-green-700 text-white w-full rounded p-2"
                value={selectedAbogado}
                onChange={(e) => setSelectedAbogado(e.target.value)}
            >
                <option value="">Seleccionar...</option>
                {abogados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <button onClick={handleAsignar} className="bg-green-800 text-white px-3 rounded hover:bg-green-600">Asignar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
