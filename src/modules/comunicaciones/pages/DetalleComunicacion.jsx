import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Search, X } from 'lucide-react';

export default function DetalleComunicacion() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [comunicacion, setComunicacion] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    
    // Estados para búsqueda de grupos
    const [searchGrupo, setSearchGrupo] = useState('');
    const [mostrarBusquedaGrupo, setMostrarBusquedaGrupo] = useState(false);
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchDetalle();
        fetchComentarios();
        fetchGrupos();
    }, [id]);

    const fetchDetalle = async () => {
        try {
            const { data } = await apiService.get('/comunicaciones');
            const item = data.find(c => c.id == id);
            setComunicacion(item);
            setFormData(item);
        } catch (error) { toast.error('Error al cargar detalle'); }
    };

    const fetchComentarios = async () => {
        try {
            const { data } = await apiService.get(`/comunicaciones/${id}/comentarios`);
            setComentarios(data);
        } catch (error) { toast.error('Error al cargar trazabilidad'); }
    };

    const fetchGrupos = async () => {
        try {
            const { data } = await apiService.get('/comunicaciones/grupos');
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const handleAgregarComentario = async () => {
        try {
            await apiService.post(`/comunicaciones/${id}/comentarios`, { comentario: nuevoComentario });
            setNuevoComentario('');
            fetchComentarios();
            toast.success('Comentario agregado');
        } catch (error) { toast.error('Error al comentar'); }
    };

    const handleAsignarGrupo = async (grupoId) => {
        try {
            await apiService.post(`/comunicaciones/${id}/grupos`, { grupo_id: parseInt(grupoId) });
            toast.success('Grupo asignado');
            fetchDetalle();
            setSearchGrupo('');
            setMostrarBusquedaGrupo(false);
        } catch (error) { toast.error('Error al asignar grupo'); }
    };

    const handleRemoverGrupo = async (grupoId) => {
        try {
            await apiService.delete(`/comunicaciones/${id}/grupos/${grupoId}`);
            toast.success('Grupo removido');
            fetchDetalle();
        } catch (error) { toast.error('Error al remover grupo'); }
    };

    const handleActualizar = async () => {
        try {
            await apiService.patch(`/comunicaciones/${id}`, formData);
            toast.success('Comunicación actualizada');
            setEditando(false);
            fetchDetalle();
            fetchComentarios();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const handleArchivar = async () => {
        if (!confirm('¿Archivar esta comunicación?')) return;
        try {
            await apiService.patch(`/comunicaciones/${id}/archivar`);
            toast.success('Comunicación archivada');
            fetchDetalle();
        } catch (error) { toast.error('Error al archivar'); }
    };

    const handleRecuperar = async () => {
        if (!confirm('¿Recuperar esta comunicación del archivo?')) return;
        try {
            await apiService.patch(`/comunicaciones/${id}/recuperar`);
            toast.success('Comunicación recuperada');
            fetchDetalle();
        } catch (error) { toast.error('Error al recuperar'); }
    };

    const handleMarcarRespondida = async () => {
        if (!confirm('¿Marcar esta comunicación como respondida?')) return;
        try {
            await apiService.patch(`/comunicaciones/${id}/respondida`);
            toast.success('Comunicación respondida');
            fetchDetalle();
        } catch (error) { toast.error('Error al marcar como respondida'); }
    };

    if (!comunicacion) return <div className="text-[#e0dcc8]">Cargando...</div>;

    return (
        <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] max-w-2xl mx-auto font-mono">
            {editando ? (
                <div className="space-y-4">
                    <input className="w-full bg-transparent border-b border-[#2d4a3e] p-2 text-2xl font-bold uppercase tracking-widest outline-none" value={formData.asunto} onChange={e => setFormData({...formData, asunto: e.target.value})} />
                    <textarea className="w-full bg-transparent border border-[#2d4a3e] p-2 text-xs outline-none" value={formData.descripcion || ''} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Descripción" />
                    <input className="w-full bg-transparent border-b border-[#2d4a3e] p-2 text-xs outline-none" value={formData.link || ''} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="Link" />
                    <div className="flex gap-2">
                        <button onClick={handleActualizar} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase">Guardar cambios</button>
                        <button onClick={() => setEditando(false)} className="bg-gray-500 text-white px-4 py-2 text-xs font-bold uppercase">Cancelar</button>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold uppercase tracking-widest mb-4 border-b border-[#2d4a3e] pb-2">{comunicacion.asunto}</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Entidad</p>
                            <p className="text-sm font-semibold">{comunicacion.entidad}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Tipo</p>
                            <p className="text-sm font-semibold">{comunicacion.tipo}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Responsable</p>
                            <p className="text-sm font-semibold">{comunicacion.responsable_nombre || 'No asignado'}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Estado</p>
                            <p className="text-sm font-semibold">{comunicacion.estado}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2] col-span-2">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Límite</p>
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold">{new Date(comunicacion.fecha_limite).toLocaleDateString()}</p>
                                {(() => {
                                    const diffTime = new Date(comunicacion.fecha_limite) - new Date();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    const colorClass = diffDays <= 0 ? 'text-red-600' : diffDays <= 3 ? 'text-orange-600' : 'text-green-700';
                                    return (
                                        <p className={`text-xs font-bold ${colorClass}`}>
                                            {diffDays <= 0 ? 'Vencido' : `${diffDays} día${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}`}
                                        </p>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-xs space-y-2 mb-6">
                        <p><strong>Descripción:</strong></p>
                        <div className="text-justify border border-[#2d4a3e] p-2 bg-[#d8d4c2]">{comunicacion.descripcion}</div>
                        <p><strong>Grupos:</strong></p>
                        <div className="flex flex-wrap gap-2">
                            {comunicacion.grupos && comunicacion.grupos.filter(g => g).map((g, index) => {
                                const grupoObj = grupos.find(gr => gr.nombre === g);
                                return (
                                    <span key={index} className="bg-[#2d4a3e] text-[#e0dcc8] px-2 py-1 text-[10px] flex items-center gap-1">
                                        {g}
                                        {grupoObj && <X size={10} className="cursor-pointer hover:text-white" onClick={() => handleRemoverGrupo(grupoObj.id)} />}
                                    </span>
                                );
                            })}
                        </div>
                        {comunicacion.link && (
                            <p className="break-all"><strong>Link:</strong> <a href={comunicacion.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{comunicacion.link}</a></p>
                        )}
                    </div>

                    {/* Búsqueda de Grupos */}
                    <div className="relative mb-6">
                        <button onClick={() => setMostrarBusquedaGrupo(!mostrarBusquedaGrupo)} className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase flex items-center gap-1">
                            {searchGrupo ? searchGrupo : "Añadir grupo..."} {mostrarBusquedaGrupo ? <X size={12}/> : <Search size={12}/>}
                        </button>
                        {mostrarBusquedaGrupo && (
                            <div className="absolute z-10 w-48 bg-[#e0dcc8] border border-[#2d4a3e] max-h-60 overflow-y-auto mt-1">
                                <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar..." value={searchGrupo} onChange={e => setSearchGrupo(e.target.value)} />
                                {grupos.filter(g => g.nombre.toLowerCase().includes(searchGrupo.toLowerCase())).map(g => (
                                    <div key={g.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs" onClick={() => handleAsignarGrupo(g.id)}>
                                        {g.nombre}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setEditando(true)} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase">Editar</button>
                        {comunicacion.estado === 'respondida' ? (
                            <button onClick={handleRecuperar} className="bg-yellow-700 text-white px-4 py-2 text-xs font-bold uppercase">Reactivar</button>
                        ) : (
                            <button onClick={handleMarcarRespondida} className="bg-green-700 text-white px-4 py-2 text-xs font-bold uppercase">Respondida</button>
                        )}
                        {comunicacion.is_active ? (
                            <button onClick={handleArchivar} className="bg-red-800 text-white px-4 py-2 text-xs font-bold uppercase">Archivar</button>
                        ) : (
                            <button onClick={handleRecuperar} className="bg-blue-800 text-white px-4 py-2 text-xs font-bold uppercase">Recuperar</button>
                        )}
                    </div>
                </>
            )}
            
            <div className="mt-6 border-t border-[#2d4a3e] pt-4">
                <h3 className="font-bold uppercase tracking-wider mb-2">Trazabilidad</h3>
                <div className="space-y-2 mb-4">
                    {comentarios.map(c => (
                        <div key={c.id} className="bg-[#2d4a3e] text-[#e0dcc8] p-2 text-xs">
                            <span className="font-bold">{c.autor || 'Sistema'}: </span>
                            {new Date(c.fecha).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })} {new Date(c.fecha).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })} - {c.comentario}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input className="flex-1 bg-transparent border border-[#2d4a3e] p-2 text-xs" value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} placeholder="Nuevo comentario..." />
                    <button onClick={handleAgregarComentario} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase">Agregar</button>
                </div>
            </div>
            <button onClick={() => navigate('/comunicaciones')} className="mt-6 text-[#2d4a3e] hover:underline uppercase text-xs font-bold">← Volver</button>
        </div>
    );
}
