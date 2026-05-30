import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

export default function ModalAsignarUsuarios({ equipoId, onClose, onRefresh }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data: todosAbogados } = await apiService.get('/admin/abogados-activos');
      const miembrosEquipo = todosAbogados.filter(u => Number(u.equipo_id) === Number(equipoId));
      setUsuarios(todosAbogados);
      setUsuariosSeleccionados(miembrosEquipo.map(m => Number(m.id)));
    } catch (error) { 
        toast.error('Error al cargar datos'); 
    }
  };

  const handleGuardar = async () => {
    try {
        const { data: todosAbogados } = await apiService.get('/admin/abogados-activos');
        const idsIniciales = todosAbogados
            .filter(u => Number(u.equipo_id) === Number(equipoId))
            .map(m => Number(m.id));

        const aRemover = idsIniciales.filter(id => !usuariosSeleccionados.includes(id));
        const aAsignar = usuariosSeleccionados.filter(id => !idsIniciales.includes(id));

        let errores = 0;

        for (const usuarioId of aRemover) {
            try {
                await apiService.patch('/rendimiento/equipos/remover-usuario', { usuario_id: usuarioId, equipo_id: equipoId });
            } catch (error) {
                errores++;
            }
        }

        for (const usuarioId of aAsignar) {
            try {
                await apiService.post('/rendimiento/equipos/asignar', { equipo_id: equipoId, usuario_id: usuarioId });
            } catch (error) {
                const mensajeError = error.response?.data?.error || 'Error al asignar usuario.';
                toast.error(mensajeError);
                errores++;
            }
        }
        
        if (errores === 0) {
            toast.success('Cambios guardados correctamente');
            onRefresh();
            onClose();
        }
    } catch (error) { toast.error('Error general al guardar cambios'); }
  };

  const toggleUsuario = (id) => {
    const numericId = Number(id);
    setUsuariosSeleccionados(prev => 
        prev.includes(numericId) ? prev.filter(uId => uId !== numericId) : [...prev, numericId]
    );
  };

  const filteredUsuarios = usuarios.filter(u => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="bg-gray-900 border border-green-900 p-6 rounded-lg w-full max-w-md text-green-500 font-mono">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold uppercase">Asignar Usuarios al Equipo</h3>
            <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <input 
            className="w-full bg-black border border-green-700 p-2 text-sm text-white mb-4"
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
        />

        <ul className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {filteredUsuarios.map(u => (
                <li key={u.id} className="border border-green-900 p-2 flex justify-between items-center">
                    <span>{u.nombre}</span>
                    <input 
                        type="checkbox" 
                        checked={usuariosSeleccionados.includes(u.id)}
                        onChange={() => toggleUsuario(u.id)}
                        className="accent-green-500"
                    />
                </li>
            ))}
        </ul>

        <button onClick={handleGuardar} className="w-full bg-green-800 text-white p-2 hover:bg-green-600">Guardar Asignaciones</button>
      </div>
    </div>
  );
}
