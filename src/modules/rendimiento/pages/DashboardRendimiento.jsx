import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function DashboardRendimiento() {
  const { user } = useAuth();
  const [objetivos, setObjetivos] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [peso, setPeso] = useState(1);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (user) fetchObjetivos();
  }, [user]);

  const fetchObjetivos = async () => {
    try {
      // Endpoint que devuelve las metas con el progreso calculado
      const { data } = await apiService.get(`/rendimiento/cumplimiento/individual/${user.id}`);
      setObjetivos(data);
    } catch (error) { toast.error('Error al cargar objetivos'); }
  };

  const handleRegistrarAvance = async (objetivoId) => {
    try {
      await apiService.post('/rendimiento/acciones', {
        objetivo_id: objetivoId,
        comentario,
        peso: parseInt(peso)
      });
      toast.success('Avance registrado');
      setShowModal(null);
      setComentario('');
      setPeso(1);
      fetchObjetivos();
    } catch (error) { toast.error('Error al registrar avance'); }
  };

  return (
    <div className="bg-black border border-green-900 p-6 rounded-lg text-green-500 font-mono">
      <h2 className="text-xl font-bold mb-6 uppercase text-green-400">Mi Progreso</h2>
      
      <div className="space-y-4">
        {objetivos.map(obj => {
          const realizadas = obj.acciones_realizadas || 0;
          const meta = obj.meta_acciones || 1;
          const progreso = Math.min((realizadas / meta) * 100, 100);
          
          return (
            <div key={obj.id} className="border border-green-900 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{obj.titulo}</h3>
                <button onClick={() => setShowModal(obj.id)} className="bg-green-800 text-white px-2 py-1 text-xs rounded hover:bg-green-600 flex items-center gap-1">
                  <Plus size={12}/> Registrar Avance
                </button>
              </div>
              <div className="w-full bg-gray-900 h-4 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full" style={{ width: `${progreso}%` }}></div>
              </div>
              <p className="text-xs mt-1">{realizadas} / {meta} acciones ({Math.round(progreso)}%)</p>
            </div>
          );
        })}
        {objetivos.length === 0 && <p className="text-sm italic">No tienes objetivos asignados actualmente.</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-black border border-green-900 p-6 w-96 rounded-lg text-xs">
                <h3 className="font-bold mb-4 uppercase">Registrar Avance</h3>
                <input className="w-full bg-black border border-green-700 p-2 mb-2 text-white" type="number" placeholder="Peso (cant. acciones)" value={peso} onChange={e => setPeso(e.target.value)} />
                <textarea className="w-full bg-black border border-green-700 p-2 mb-2 text-white" placeholder="Comentario..." value={comentario} onChange={e => setComentario(e.target.value)} />
                <div className="flex gap-2">
                    <button onClick={() => handleRegistrarAvance(showModal)} className="bg-green-800 text-white px-4 py-2 flex-1">Guardar</button>
                    <button onClick={() => setShowModal(null)} className="bg-gray-800 text-white px-4 py-2 flex-1">Cancelar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
