import { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

export default function SolicitudesPorArea() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');

  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const { data } = await apiService.get('/core/grupos');
        setGrupos(data.filter(g => g.is_active));
      } catch (err) { toast.error('Error al cargar grupos'); }
    };
    fetchGrupos();
  }, []);

  useEffect(() => {
    if (!selectedArea) return;

    const fetchSolicitudes = async () => {
      setLoading(true);
      try {
        const { data } = await apiService.get(`/tutelas/requerimientos/area/${selectedArea}`);
        setSolicitudes(data);
      } catch (error) {
        toast.error('Error al cargar solicitudes del área');
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitudes();
  }, [selectedArea]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Mail size={18} className="text-[#002E6D]" /> Solicitudes Pendientes
        </h3>
        <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-[#002E6D]"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
        >
            <option value="">Seleccione un área...</option>
            {grupos.map(g => <option key={g.id} value={g.nombre}>{g.nombre}</option>)}
        </select>
      </div>
      
      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : selectedArea && solicitudes.length === 0 ? (
        <p className="text-sm text-gray-400">No hay solicitudes para esta área.</p>
      ) : !selectedArea ? (
        <p className="text-sm text-gray-400">Seleccione un área para ver las solicitudes.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solicitudes.map(req => {
            const grupo = grupos.find(g => g.id === req.grupo_id);
            return (
                <div key={req.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Área: {grupo?.nombre || 'Desconocido'}</p>
                    <p className="text-xs font-bold text-[#002E6D] mb-1">Tutela: {req.tutela_radicado}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{req.descripcion}</p>
                    <span className="text-[10px] uppercase font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded mt-2 inline-block">{req.estado}</span>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
