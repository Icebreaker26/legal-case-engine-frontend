import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Check, X, RotateCcw, UserPlus, Download } from 'lucide-react';
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

  const handleExportar = async (id, nombre) => {
    try {
        const { data } = await apiService.get(`/rendimiento/equipos/${id}/exportar-completo`);
        if (data.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }
        
        // Convertir a CSV (Datos completos)
        const headers = ['Profesional', 'Equipo', 'Email', 'Especialidad', 'Rol', 'Objetivo', 'Descripción', 'Meta', 'Estado', 'Mes', 'Año', 'Comentario Acción', 'Peso Acción', 'Fecha Acción'];
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                `"${item.profesional || ''}"`,
                `"${item.equipo_nombre || ''}"`,
                `"${item.email || ''}"`,
                `"${item.especialidad || ''}"`,
                `"${item.rol || ''}"`,
                `"${item.objetivo_titulo || ''}"`,
                `"${item.objetivo_descripcion || ''}"`,
                item.meta_acciones || 0,
                item.estado_objetivo || '',
                item.mes || '',
                item.anio || '',
                `"${item.accion_comentario || ''}"`,
                item.accion_peso || 0,
                item.accion_fecha || ''
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Reporte_Completo_${nombre}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Reporte exportado');
    } catch (error) { toast.error('Error al exportar datos'); }
  };

  return (
    <div className="terminal-border bg-[#050A05] border-2 border-[#1A441A] p-6 text-[#33FF33] font-mono shadow-[0_0_10px_rgba(51,255,51,0.1)]">
      <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-[#33FF33] border-b border-[#1A441A] pb-2">[ GESTI0N DE EQUIP0S ]</h2>

      <div className="mb-8 p-4 border border-[#1A441A] bg-[#0A140A]">
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider">Crear Nuevo Equipo</h3>
        <form onSubmit={handleCrearEquipo} className="flex gap-2">
            <input 
                className="bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] flex-1 outline-none focus:border-[#33FF33]"
                value={nuevoEquipoNombre}
                onChange={(e) => setNuevoEquipoNombre(e.target.value)}
                placeholder="Nombre del equipo..."
            />
            <button type="submit" className="bg-[#1A441A] text-[#33FF33] px-4 py-2 hover:bg-[#33FF33] hover:text-[#050A05]"><Plus size={16} /></button>
        </form>
      </div>

      <div className="flex justify-between items-center mb-4 border-b border-[#1A441A] pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider">Equipos Existentes</h3>
        <input 
            className="bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none focus:border-[#33FF33]"
            placeholder="Buscar equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
        />
        <button onClick={() => setShowModalRestaurar(true)} className="text-xs bg-[#1A441A] p-2 text-[#33FF33] hover:bg-[#33FF33] hover:text-[#050A05] flex items-center gap-1">
            <RotateCcw size={12}/> Restaurar Eliminados
        </button>
      </div>

      <ul className="space-y-2">
            {equipos.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(e => (
                <li key={e.id} className="border border-[#1A441A] p-3 flex justify-between items-center hover:bg-[#0A140A]">
                    {editingId === e.id ? (
                        <div className="flex gap-2 flex-1">
                            <input 
                                className="bg-[#050A05] border border-[#1A441A] p-1 text-sm text-[#33FF33] flex-1 outline-none focus:border-[#33FF33]"
                                value={editingNombre}
                                onChange={(e) => setEditingNombre(e.target.value)}
                            />
                            <button onClick={() => handleUpdateEquipo(e.id)} className="text-[#33FF33]"><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="text-[#FF3333]"><X size={16} /></button>
                        </div>
                    ) : (
                        <>
                            <span className="tracking-wider">{e.nombre} ({e.total_miembros} miembros)</span>
                            <div className="flex gap-4">
                                <button onClick={() => handleExportar(e.id, e.nombre)} className="text-[#33FF33] hover:text-white"><Download size={16} /></button>
                                <button onClick={() => setEquipoAAsignar(e.id)} className="text-[#33FF33] hover:text-white"><UserPlus size={16} /></button>
                                <button onClick={() => { setEditingId(e.id); setEditingNombre(e.nombre); }} className="text-[#33FF33] hover:text-white"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteEquipo(e.id)} className="text-[#FF3333] hover:text-white"><Trash2 size={16} /></button>
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
