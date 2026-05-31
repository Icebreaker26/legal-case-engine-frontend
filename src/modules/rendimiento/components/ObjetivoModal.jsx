import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';

export default function ObjetivoModal({ equipoId, onClose, onRefresh }) {
  const [abogados, setAbogados] = useState([]);
  const [formData, setFormData] = useState({
    usuario_id: '',
    meta_acciones: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    titulo: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchAbogados();
  }, []);

  const fetchAbogados = async () => {
    try {
      const { data } = await apiService.get('/admin/usuarios');
      console.log('Todos los abogados recibidos:', data);
      console.log('equipoId en ObjetivoModal:', equipoId);
      
      // Filtramos de forma más segura
      const filtrados = data.filter(u => String(u.equipo_id) === String(equipoId));
      
      console.log('Abogados filtrados por equipo:', filtrados);
      
      if (filtrados.length > 0) {
          setAbogados(filtrados);
      } else {
          console.warn('El filtro devolvió 0 resultados, mostrando todos los abogados para depurar.');
          setAbogados(data);
      }
    } catch (error) { toast.error('Error al cargar profesionales'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.post('/rendimiento/objetivos', {
        ...formData,
        usuario_id: parseInt(formData.usuario_id),
        meta_acciones: parseInt(formData.meta_acciones),
        mes: parseInt(formData.mes),
        anio: parseInt(formData.anio)
      });
      toast.success('Objetivo asignado');
      onRefresh();
      onClose();
    } catch (error) { toast.error('Error al asignar objetivo'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-black border border-green-900 w-full max-w-md rounded-lg shadow-2xl font-mono text-green-500">
        <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-green-900">
          <h2 className="text-green-400 font-bold uppercase text-xs">Asignar Nuevo Objetivo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div>
            <label className="block text-gray-500 mb-1">Profesional:</label>
            <select className="w-full bg-black border border-green-700 p-2 text-white" 
              onChange={e => setFormData({...formData, usuario_id: e.target.value})} required>
                <option value="">Seleccionar profesional...</option>
                {abogados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-500 mb-1">Título:</label>
            <input className="w-full bg-black border border-green-700 p-2 text-white" 
              onChange={e => setFormData({...formData, titulo: e.target.value})} required />
          </div>
          <div>
            <label className="block text-gray-500 mb-1">Descripción:</label>
            <textarea className="w-full bg-black border border-green-700 p-2 text-white" 
              onChange={e => setFormData({...formData, descripcion: e.target.value})} />
          </div>
          <div>
            <label className="block text-gray-500 mb-1">Meta de Acciones:</label>
            <input type="number" className="w-full bg-black border border-green-700 p-2 text-white" 
              onChange={e => setFormData({...formData, meta_acciones: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-500 mb-1">Mes:</label>
              <input type="number" className="w-full bg-black border border-green-700 p-2 text-white" min="1" max="12"
                value={formData.mes} onChange={e => setFormData({...formData, mes: e.target.value})} required />
            </div>
            <div>
              <label className="block text-gray-500 mb-1">Año:</label>
              <input type="number" className="w-full bg-black border border-green-700 p-2 text-white" 
                value={formData.anio} onChange={e => setFormData({...formData, anio: e.target.value})} required />
            </div>
          </div>
          <button type="submit" className="w-full bg-green-800 text-white py-2 mt-4 hover:bg-green-600">Asignar Objetivo</button>
        </form>
      </div>
    </div>
  );
}
