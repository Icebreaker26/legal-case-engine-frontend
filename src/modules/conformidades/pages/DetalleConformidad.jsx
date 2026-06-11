import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import conformidadesService from '../../../services/conformidadesService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { calcularTiempoTranscurrido } from '../../../utils/dateUtils';

export default function DetalleConformidad() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [conformidad, setConformidad] = useState(null);
    const [trazabilidad, setTrazabilidad] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [grupos, setGrupos] = useState([]);
    const [searchGrupo, setSearchGrupo] = useState('');
    
    const [editando, setEditando] = useState(false);
    const [conformidadEditada, setConformidadEditada] = useState(null);

    useEffect(() => {
        fetchConformidad();
        fetchTrazabilidad();
        fetchGrupos();
    }, [id]);

    const fetchConformidad = async () => {
        try {
            const { data } = await conformidadesService.getAll();
            const found = data.find(c => c.id === parseInt(id));
            setConformidad(found);
        } catch (error) { toast.error('Error al cargar conformidad'); }
    };

    const fetchTrazabilidad = async () => {
        try {
            const { data } = await conformidadesService.getTrazabilidad(id);
            setTrazabilidad(data);
        } catch (error) { toast.error('Error al cargar trazabilidad'); }
    };

    const fetchGrupos = async () => {
        try {
            const { data } = await conformidadesService.getGrupos();
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const handleToggleGrupo = async (grupo) => {
        try {
            const esAsignado = conformidad.grupos?.includes(grupo.nombre);
            if (esAsignado) {
                await conformidadesService.removeGrupo(id, grupo.id);
                toast.success('Grupo removido');
            } else {
                await conformidadesService.assignGrupo(id, grupo.id);
                toast.success('Grupo asignado');
            }
            fetchConformidad();
        } catch (error) { toast.error('Error al actualizar grupo'); }
    };

    const handleAgregarComentario = async (e) => {
        e.preventDefault();
        try {
            await conformidadesService.updateEstado(id, {
                estado: conformidad.estado,
                comentario: nuevoComentario,
                estado_anterior: conformidad.estado
            });
            setNuevoComentario('');
            fetchTrazabilidad();
            toast.success('Comentario añadido');
        } catch (error) { toast.error('Error al añadir comentario'); }
    };

    const handleCambiarEstado = async (nuevoEstado) => {
        try {
            await conformidadesService.updateEstado(id, {
                estado: nuevoEstado,
                comentario: `Cambio de estado a: ${nuevoEstado}`,
                estado_anterior: conformidad.estado
            });
            fetchConformidad();
            fetchTrazabilidad();
            toast.success(`Estado cambiado a ${nuevoEstado}`);
        } catch (error) { toast.error('Error al cambiar estado'); }
    };

    const toggleEdit = () => {
        if (editando) setConformidadEditada(null);
        else setConformidadEditada({ ...conformidad });
        setEditando(!editando);
    };

    const handleSave = async () => {
        try {
            await conformidadesService.updateEstado(id, {
                estado: conformidad.estado,
                estado_anterior: conformidad.estado,
                comentario: 'Edición de datos contables',
                ...conformidadEditada
            });
            setConformidad(conformidadEditada);
            setEditando(false);
            toast.success('Conformidad actualizada');
        } catch (error) { toast.error('Error al actualizar'); }
    };

    if (!conformidad) return <div className="text-[#e0dcc8]">Cargando...</div>;

    const gruposFiltrados = grupos.filter(g => g.nombre.toLowerCase().includes(searchGrupo.toLowerCase()));
    const estadosFlujo = ['SOLICITADO', 'CREACION DE BAREMOS', 'ENVIADO PARA LIBERAR', 'LIBERADO', 'CREACION HOJA CONTABLE', 'ENVIADO PARA LIBERACION CONTABLE', 'CONFORMADO'];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Detalle de Conformidad</h2>
                    <button onClick={toggleEdit} className="bg-[#2d4a3e] text-[#e0dcc8] px-3 py-1 text-xs font-bold uppercase">
                        {editando ? 'Cancelar' : 'Editar Datos'}
                    </button>
                </div>

                {editando ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" placeholder="Hoja Contable Normal" value={conformidadEditada.hoja_contable_normal || ''} onChange={e => setConformidadEditada({...conformidadEditada, hoja_contable_normal: e.target.value})} />
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" placeholder="Hoja Contable Reembolsable" value={conformidadEditada.hoja_contable_reembolsable || ''} onChange={e => setConformidadEditada({...conformidadEditada, hoja_contable_reembolsable: e.target.value})} />
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" placeholder="Número Conformidad" value={conformidadEditada.numero_conformidad || ''} onChange={e => setConformidadEditada({...conformidadEditada, numero_conformidad: e.target.value})} />
                        <input className="col-span-2 border-b-2 border-[#2d4a3e] p-2 bg-transparent text-sm" placeholder="Link Acta" value={conformidadEditada.link_acta || ''} onChange={e => setConformidadEditada({...conformidadEditada, link_acta: e.target.value})} />
                        <button onClick={handleSave} className="col-span-2 bg-[#10b981] text-white py-2 font-bold uppercase">Guardar Cambios</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            {label: 'Concepto', val: conformidad.concepto},
                            {label: 'Entidad', val: conformidad.entidad_nombre},
                            {label: 'Responsable', val: conformidad.responsable_nombre},
                            {label: 'Valor', val: `$${parseFloat(conformidad.valor).toLocaleString('es-CO')}`},
                            {label: 'Estado', val: conformidad.estado},
                            {label: 'OT', val: conformidad.ot},
                            {label: 'WBE', val: conformidad.wbe},
                            {label: 'Tiempo', val: calcularTiempoTranscurrido(conformidad.fecha_solicitud, conformidad.estado)},
                            {label: 'Hoja Normal', val: conformidad.hoja_contable_normal},
                            {label: 'Hoja Reembolsable', val: conformidad.hoja_contable_reembolsable},
                            {label: 'Nº Conformidad', val: conformidad.numero_conformidad},
                            {label: 'Link Acta', val: conformidad.link_acta ? <a href={conformidad.link_acta} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver Acta</a> : 'N/A'},
                        ].map(field => (
                            <div key={field.label} className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                                <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">{field.label}</p>
                                <p className="text-sm font-semibold">{field.val}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 border-t border-[#2d4a3e]/30 pt-4">
                    <p className="text-xs uppercase font-bold text-[#2d4a3e] mb-2">Cambiar Estado:</p>
                    <div className="flex flex-wrap gap-2">
                        {estadosFlujo.map(est => (
                            <button 
                                key={est}
                                className={`text-[10px] px-2 py-1 uppercase font-bold border ${conformidad.estado === est ? 'bg-[#2d4a3e] text-[#e0dcc8]' : 'border-[#2d4a3e] text-[#2d4a3e] hover:bg-[#2d4a3e]/10'}`}
                                onClick={() => handleCambiarEstado(est)}
                            >
                                {est.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 border-t border-[#2d4a3e]/30 pt-4">
                    <p className="text-xs uppercase font-bold text-[#2d4a3e] mb-2">Gestionar Grupos:</p>
                    <input 
                        className="w-full bg-[#e0dcc8] border-b border-[#2d4a3e] p-2 text-xs uppercase placeholder-[#2d4a3e]/50 outline-none mb-2" 
                        placeholder="Buscar grupos..." 
                        value={searchGrupo} 
                        onChange={e => setSearchGrupo(e.target.value)} 
                    />
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 border-[#2d4a3e]/30">
                        {gruposFiltrados.map(g => (
                            <button 
                                key={g.id}
                                className={`text-[10px] px-2 py-1 uppercase font-bold border ${conformidad.grupos?.includes(g.nombre) ? 'bg-[#2d4a3e] text-[#e0dcc8]' : 'border-[#2d4a3e] text-[#2d4a3e]'}`}
                                onClick={() => handleToggleGrupo(g)}
                            >
                                {g.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                <h3 className="text-lg font-bold uppercase text-[#2d4a3e] mb-4">Trazabilidad</h3>
                
                <form onSubmit={handleAgregarComentario} className="mb-4">
                    <textarea 
                        className="w-full bg-[#e0dcc8] border-b border-[#2d4a3e] p-2 text-xs uppercase placeholder-[#2d4a3e]/50 outline-none"
                        placeholder="Añadir comentario de trazabilidad..."
                        value={nuevoComentario}
                        onChange={(e) => setNuevoComentario(e.target.value)}
                        required
                    />
                    <button type="submit" className="mt-2 bg-[#2d4a3e] text-[#e0dcc8] px-4 py-1 text-xs font-bold uppercase hover:bg-[#1a2e26]">
                        Añadir Comentario
                    </button>
                </form>

                <div className="space-y-2">
                    {trazabilidad.map(t => (
                        <div key={t.id} className="border-b border-[#2d4a3e] pb-2 text-xs">
                            <p className="font-bold">{new Date(t.created_at).toLocaleString()} - {t.usuario_nombre}</p>
                            <p>Estado: <span className="font-bold">{t.estado_anterior} {t.estado_anterior ? '→' : ''} {t.estado_nuevo}</span></p>
                            <p className="italic">{t.comentario}</p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
