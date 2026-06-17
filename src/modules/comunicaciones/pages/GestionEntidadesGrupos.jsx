import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Trash2, Plus, RefreshCw, Archive, X, Pencil, Check } from 'lucide-react';

export default function GestionEntidadesGrupos() {
    const [entidades, setEntidades] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [inactivas, setInactivas] = useState({ entidades: [], grupos: [] });
    const [nuevaEntidad, setNuevaEntidad] = useState('');
    const [nuevoGrupo, setNuevoGrupo] = useState('');
    const [mostrarPapelera, setMostrarPapelera] = useState(false);
    
    // Estados para edición en línea
    const [editandoId, setEditandoId] = useState(null);
    const [valorEditado, setValorEditado] = useState('');
    const [tipoEditando, setTipoEditando] = useState(null);

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        try {
            const [e, g] = await Promise.all([
                apiService.get('/core/entidades'),
                apiService.get('/core/grupos')
            ]);
            // El backend del core devuelve activos e inactivos filtrados por el controller, 
            // pero si necesitas separarlos para la papelera, ajusta la lógica según lo que devuelva el endpoint
            setEntidades(e.data.filter(i => i.is_active));
            setGrupos(g.data.filter(i => i.is_active));
            
            // Asumimos un endpoint para inactivos o que filtramos del total
            // Para mantener la lógica simple:
            const [ei, gi] = await Promise.all([
                apiService.get('/core/entidades/inactivas'),
                apiService.get('/core/grupos/inactivas')
            ]);
            setInactivas({ entidades: ei.data, grupos: gi.data });
        } catch (error) { toast.error('Error al cargar datos'); }
    };

    const handleCrear = async (tipo, nombre) => {
        if (!nombre.trim()) return;
        try {
            await apiService.post(`/core/${tipo}`, { nombre });
            toast.success(`${tipo === 'entidades' ? 'Entidad' : 'Grupo'} creado`);
            fetchDatos();
            tipo === 'entidades' ? setNuevaEntidad('') : setNuevoGrupo('');
        } catch (error) { toast.error('Error al crear'); }
    };

    const iniciarEdicion = (tipo, id, nombre) => {
        setEditandoId(id);
        setTipoEditando(tipo);
        setValorEditado(nombre);
    };

    const guardarEdicion = async () => {
        if (!valorEditado.trim()) return;
        try {
            await apiService.patch(`/core/${tipoEditando}/${editandoId}`, { nombre: valorEditado });
            toast.success('Actualizado');
            setEditandoId(null);
            setTipoEditando(null);
            fetchDatos();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const handleEliminar = async (tipo, id) => {
        if (!confirm('¿Archivar este elemento?')) return;
        try {
            await apiService.delete(`/core/${tipo}/${id}`);
            toast.success('Elemento archivado');
            fetchDatos();
        } catch (error) { toast.error('Error al archivar'); }
    };

    const handleRecuperar = async (tipo, id) => {
        try {
            await apiService.patch(`/core/${tipo}/${id}/recuperar`);
            toast.success('Elemento recuperado');
            fetchDatos();
        } catch (error) { toast.error('Error al recuperar'); }
    };

    return (
        <div className="space-y-8 font-mono text-[#1a1a1a] max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#2d4a3e] pb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Gestión de Entidades y Grupos</h2>
                <button onClick={() => setMostrarPapelera(!mostrarPapelera)} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase flex items-center gap-2">
                    <Archive size={16}/> {mostrarPapelera ? 'Cerrar Papelera' : 'Ver Papelera'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Entidades */}
                <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <h3 className="font-bold uppercase mb-4 text-[#2d4a3e]">Entidades</h3>
                    <div className="flex gap-2 mb-4">
                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" placeholder="Nueva entidad..." value={nuevaEntidad} onChange={e => setNuevaEntidad(e.target.value)} />
                        <button onClick={() => handleCrear('entidades', nuevaEntidad)} className="bg-[#2d4a3e] text-[#e0dcc8] px-2"><Plus size={16}/></button>
                    </div>
                    <ul className="space-y-2">
                        {entidades.map(e => (
                            <li key={e.id} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/30 p-1">
                                {editandoId === e.id && tipoEditando === 'entidades' ? (
                                    <div className="flex gap-1 flex-1">
                                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" value={valorEditado} onChange={e => setValorEditado(e.target.value)} />
                                        <button onClick={guardarEdicion} className="text-[#2d4a3e]"><Check size={14}/></button>
                                    </div>
                                ) : (
                                    <>
                                        {e.nombre}
                                        <div className="flex gap-1">
                                            <button onClick={() => iniciarEdicion('entidades', e.id, e.nombre)} className="text-[#2d4a3e]"><Pencil size={14}/></button>
                                            <button onClick={() => handleEliminar('entidades', e.id)} className="text-red-800"><Trash2 size={14}/></button>
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
                                {editandoId === g.id && tipoEditando === 'grupos' ? (
                                    <div className="flex gap-1 flex-1">
                                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" value={valorEditado} onChange={e => setValorEditado(e.target.value)} />
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

            {/* Papelera Modal */}
            {mostrarPapelera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4 border-b border-[#2d4a3e] pb-2">
                            <h3 className="font-bold uppercase">Papelera (Elementos Archivados)</h3>
                            <button onClick={() => setMostrarPapelera(false)}><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <h4 className="font-bold mb-2">Entidades</h4>
                                {inactivas.entidades.map(e => (
                                    <div key={e.id} className="flex justify-between mb-1">{e.nombre} <button onClick={() => handleRecuperar('entidades', e.id)} className="text-blue-800"><RefreshCw size={12}/></button></div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">Grupos</h4>
                                {inactivas.grupos.map(g => (
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
