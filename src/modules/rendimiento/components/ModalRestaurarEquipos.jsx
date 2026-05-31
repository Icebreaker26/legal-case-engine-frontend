import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { RotateCcw, X } from 'lucide-react';

export default function ModalRestaurarEquipos({ onClose, onRefresh }) {
  const [equiposEliminados, setEquiposEliminados] = useState([]);

  useEffect(() => {
    fetchEliminados();
  }, []);

  const fetchEliminados = async () => {
    try {
      const { data } = await apiService.get('/rendimiento/equipos/eliminados');
      setEquiposEliminados(data);
    } catch (error) { toast.error('Error al cargar equipos eliminados'); }
  };

  const handleRestaurar = async (id) => {
    try {
      await apiService.patch(`/rendimiento/equipos/${id}/restaurar`);
      fetchEliminados();
      onRefresh();
      toast.success('Equipo restaurado');
    } catch (error) { toast.error('Error al restaurar equipo'); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-green-900 p-6 rounded-lg w-full max-w-md text-green-500 font-mono">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase">Restaurar Equipos</h3>
            <button onClick={onClose}><X size={20} /></button>
        </div>
        <ul className="space-y-2">
            {equiposEliminados.map(e => (
                <li key={e.id} className="border border-green-900 p-2 flex justify-between items-center">
                    <span>{e.nombre}</span>
                    <button onClick={() => handleRestaurar(e.id)} className="text-green-500 hover:text-green-300"><RotateCcw size={16} /></button>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
