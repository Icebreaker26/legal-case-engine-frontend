import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Check, X, RotateCcw, UserPlus } from 'lucide-react';
import ModalRestaurarEquipos from '../components/ModalRestaurarEquipos';
import ModalAsignarUsuarios from '../components/ModalAsignarUsuarios';

export default function GestorEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [nuevoEquipoNombre, setNuevoEquipoNombre] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [showModalRestaurar, setShowModalRestaurar] = useState(false);
  const [equipoAAsignar, setEquipoAAsignar] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      const { data } = await apiService.get('/rendimiento/equipos');
      setEquipos(data);
    } catch (error) { toast.error('Error al cargar equipos'); }
  };

  const handleCrearEquipo = async (e) => {
    e.preventDefault();
    if (!nuevoEquipoNombre.trim()) return;
    try {
        await apiService.post('/rendimiento/equipos', { nombre: nuevoEquipoNombre });
        setNuevoEquipoNombre('');
        fetchEquipos();
        toast.success('Equipo creado');
    } catch (error) { toast.error('Error al crear equipo'); }
  };

  const handleUpdateEquipo = async (id) => {
    if (!editingNombre.trim()) return;
    try {
        await apiService.patch(`/rendimiento/equipos/${id}`, { nombre: editingNombre });
        setEditingId(null);
        setEditingNombre('');
        fetchEquipos();
        toast.success('Equipo actualizado');
    } catch (error) { toast.error('Error al actualizar equipo'); }
  };

  const handleDeleteEquipo = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este equipo?')) return;
    try {
        await apiService.delete(`/rendimiento/equipos/${id}`);
        fetchEquipos();
        toast.success('Equipo eliminado');
    } catch (error) { toast.error('Error al eliminar equipo'); }
  };

  return (
    <div className="bg-black border border-green-900 p-6 rounded-lg text-green-500 font-mono">
      <h2 className="text-xl font-bold mb-6 uppercase text-green-400">Gestión de Equipos</h2>

      <div className="mb-8 p-4 border border-green-900 bg-gray-900">
        <h3 className="text-sm font-bold mb-4 uppercase">Crear Nuevo Equipo</h3>
        <form onSubmit={handleCrearEquipo} className="flex gap-2">
            <input 
                className="bg-black border border-green-700 p-2 text-sm text-white flex-1"
                value={nuevoEquipoNombre}
                onChange={(e) => setNuevoEquipoNombre(e.target.value)}
                placeholder="Nombre del equipo..."
            />
            <button type="submit" className="bg-green-800 text-white px-4 py-2 hover:bg-green-600"><Plus size={16} /></button>
        </form>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase">Equipos Existentes</h3>
        <input 
            className="bg-black border border-green-700 p-2 text-sm text-white"
            placeholder="Buscar equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
        />
        <button onClick={() => setShowModalRestaurar(true)} className="text-xs bg-gray-800 p-2 text-white hover:bg-gray-600 flex items-center gap-1">
            <RotateCcw size={12}/> Restaurar Eliminados
        </button>
      </div>

      <ul className="space-y-2">
            {equipos.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(e => (
                <li key={e.id} className="border border-green-900 p-3 flex justify-between items-center">
                    {editingId === e.id ? (
                        <div className="flex gap-2 flex-1">
                            <input 
                                className="bg-black border border-green-700 p-1 text-sm text-white flex-1"
                                value={editingNombre}
                                onChange={(e) => setEditingNombre(e.target.value)}
                            />
                            <button onClick={() => handleUpdateEquipo(e.id)} className="text-green-500"><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="text-red-500"><X size={16} /></button>
                        </div>
                    ) : (
                        <>
                            <span>{e.nombre} ({e.total_miembros} miembros)</span>
                            <div className="flex gap-2">
                                <button onClick={() => setEquipoAAsignar(e.id)} className="text-green-500 hover:text-green-300"><UserPlus size={16} /></button>
                                <button onClick={() => { setEditingId(e.id); setEditingNombre(e.nombre); }} className="text-blue-500 hover:text-blue-300"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteEquipo(e.id)} className="text-red-500 hover:text-red-300"><Trash2 size={16} /></button>
                            </div>
                        </>
                    )}
                </li>
            ))}
        </ul>

      {showModalRestaurar && (
        <ModalRestaurarEquipos 
            onClose={() => setShowModalRestaurar(false)}
            onRefresh={fetchEquipos}
        />
      )}
      
      {equipoAAsignar && (
        <ModalAsignarUsuarios 
            equipoId={equipoAAsignar}
            onClose={() => setEquipoAAsignar(null)}
            onRefresh={fetchEquipos}
        />
      )}
    </div>
  );
}
