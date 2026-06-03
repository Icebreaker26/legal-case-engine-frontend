import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Trash2, Plus, RefreshCw, Archive, X, Pencil, Check } from 'lucide-react';

export default function GestionEstadosYGrupos() {
    const [estados, setEstados] = useState([]);
    const [estadosInactivos, setEstadosInactivos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [gruposInactivos, setGruposInactivos] = useState([]);
    
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [mostrarPapelera, setMostrarPapelera] = useState(false);
    
    const [editando, setEditando] = useState({ id: null, tipo: null, valor: '' });

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        try {
            const [est, gru] = await Promise.all([
                apiService.get('/pagos/estados'),
                apiService.get('/pagos/grupos') // Asumiendo endpoint para listar todos los grupos del sistema
            ]);
            setEstados(est.data.filter(e => e.is_active));
            setEstadosInactivos(est.data.filter(e => !e.is_active));
            setGrupos(gru.data.filter(g => g.is_active)); // Ajustar si es necesario
            setGruposInactivos(gru.data.filter(g => !g.is_active));
        } catch (error) { toast.error('Error al cargar datos'); }
    };

    const handleCrear = async (tipo, nombre) => {
        if (!nombre.trim()) return;
        try {
            await apiService.post(`/pagos/${tipo}`, { nombre });
            toast.success('Creado');
            fetchDatos();
            tipo === 'estados' ? setNuevoEstado('') : setNuevoGrupo('');
        } catch (error) { toast.error('Error al crear'); }
    };

    const iniciarEdicion = (tipo, id, nombre) => {
        setEditando({ id, tipo, valor: nombre });
    };

    const guardarEdicion = async () => {
        if (!editando.valor.trim()) return;
        try {
            await apiService.patch(`/pagos/${editando.tipo}/${editando.id}`, { nombre: editando.valor });
            toast.success('Actualizado');
            setEditando({ id: null, tipo: null, valor: '' });
            fetchDatos();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const handleEliminar = async (tipo, id) => {
        if (!confirm('¿Archivar?')) return;
        try {
            await apiService.delete(`/pagos/${tipo}/${id}`);
            toast.success('Archivado');
            fetchDatos();
        } catch (error) { toast.error('Error al archivar'); }
    };

    const handleRecuperar = async (tipo, id) => {
        try {
            await apiService.patch(`/pagos/${tipo}/${id}/recuperar`);
            toast.success('Recuperado');
            fetchDatos();
        } catch (error) { toast.error('Error al recuperar'); }
    };

    return (
        <div className="space-y-8 font-mono text-[#1a1a1a] max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#2d4a3e] pb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Gestión Estados y Grupos (PDP)</h2>
                <button onClick={() => setMostrarPapelera(!mostrarPapelera)} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase flex items-center gap-2">
                    <Archive size={16}/> {mostrarPapelera ? 'Cerrar Papelera' : 'Ver Papelera'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Estados */}
                <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <h3 className="font-bold uppercase mb-4 text-[#2d4a3e]">Estados</h3>
                    <div className="flex gap-2 mb-4">
                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" placeholder="Nuevo estado..." value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} />
                        <button onClick={() => handleCrear('estados', nuevoEstado)} className="bg-[#2d4a3e] text-[#e0dcc8] px-2"><Plus size={16}/></button>
                    </div>
                    <ul className="space-y-2">
                        {estados.map(e => (
                            <li key={e.id} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/30 p-1">
                                {editando.id === e.id && editando.tipo === 'estados' ? (
                                    <div className="flex gap-1 flex-1">
                                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" value={editando.valor} onChange={e => setEditando({...editando, valor: e.target.value})} />
                                        <button onClick={guardarEdicion} className="text-[#2d4a3e]"><Check size={14}/></button>
                                    </div>
                                ) : (
                                    <>
                                        {e.nombre}
                                        <div className="flex gap-1">
                                            <button onClick={() => iniciarEdicion('estados', e.id, e.nombre)} className="text-[#2d4a3e]"><Pencil size={14}/></button>
                                            <button onClick={() => handleEliminar('estados', e.id)} className="text-red-800"><Trash2 size={14}/></button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Grupos */}
                <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <h3 className="font-bold uppercase mb-4 text-[#2d4a3e]">Grupos</h3>
                    <div className="flex gap-2 mb-4">
                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" placeholder="Nuevo grupo..." value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)} />
                        <button onClick={() => handleCrear('grupos', nuevoGrupo)} className="bg-[#2d4a3e] text-[#e0dcc8] px-2"><Plus size={16}/></button>
                    </div>
                    <ul className="space-y-2">
                        {grupos.map(g => (
                            <li key={g.id} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/30 p-1">
                                {editando.id === g.id && editando.tipo === 'grupos' ? (
                                    <div className="flex gap-1 flex-1">
                                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" value={editando.valor} onChange={e => setEditando({...editando, valor: e.target.value})} />
                                        <button onClick={guardarEdicion} className="text-[#2d4a3e]"><Check size={14}/></button>
                                    </div>
                                ) : (
                                    <>
                                        {g.nombre}
                                        <div className="flex gap-1">
                                            <button onClick={() => iniciarEdicion('grupos', g.id, g.nombre)} className="text-[#2d4a3e]"><Pencil size={14}/></button>
                                            <button onClick={() => handleEliminar('grupos', g.id)} className="text-red-800"><Trash2 size={14}/></button>
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {mostrarPapelera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4 border-b border-[#2d4a3e] pb-2">
                            <h3 className="font-bold uppercase">Papelera</h3>
                            <button onClick={() => setMostrarPapelera(false)}><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <h4 className="font-bold mb-2">Estados</h4>
                                {estadosInactivos.map(e => (
                                    <div key={e.id} className="flex justify-between mb-1">{e.nombre} <button onClick={() => handleRecuperar('estados', e.id)} className="text-blue-800"><RefreshCw size={12}/></button></div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">Grupos</h4>
                                {gruposInactivos.map(g => (
                                    <div key={g.id} className="flex justify-between mb-1">{g.nombre} <button onClick={() => handleRecuperar('grupos', g.id)} className="text-blue-800"><RefreshCw size={12}/></button></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
