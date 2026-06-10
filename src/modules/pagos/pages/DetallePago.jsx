import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function DetallePago() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pago, setPago] = useState(null);
    const [trazabilidad, setTrazabilidad] = useState([]);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [grupos, setGrupos] = useState([]);
    const [searchGrupo, setSearchGrupo] = useState('');
    
    // Hooks moved to top level
    const [editando, setEditando] = useState(false);
    const [pagoEditado, setPagoEditado] = useState(null);

    useEffect(() => {
        fetchPago();
        fetchTrazabilidad();
        fetchGrupos();
    }, [id]);

    const fetchPago = async () => {
        try {
            const { data } = await apiService.get('/pagos'); 
            const found = data.find(p => p.id === parseInt(id));
            setPago(found);
        } catch (error) { toast.error('Error al cargar pago'); }
    };

    const fetchTrazabilidad = async () => {
        try {
            const { data } = await apiService.get(`/pagos/${id}/trazabilidad`);
            setTrazabilidad(data);
        } catch (error) { toast.error('Error al cargar trazabilidad'); }
    };

    const fetchGrupos = async () => {
        try {
            const { data } = await apiService.get('/pagos/grupos');
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const handleToggleGrupo = async (grupo) => {
        try {
            const esAsignado = pago.grupos?.includes(grupo.nombre);
            if (esAsignado) {
                await apiService.delete(`/pagos/${id}/grupos/${grupo.id}`);
                toast.success('Grupo removido');
            } else {
                await apiService.post(`/pagos/${id}/grupos`, { grupo_id: grupo.id });
                toast.success('Grupo asignado');
            }
            fetchPago();
        } catch (error) { toast.error('Error al actualizar grupo'); }
    };

    const handleAgregarComentario = async (e) => {
        e.preventDefault();
        try {
            await apiService.patch(`/pagos/${id}/estado`, {
                estado: pago.estado,
                comentario: nuevoComentario
            });
            setNuevoComentario('');
            fetchTrazabilidad();
            toast.success('Comentario añadido');
        } catch (error) { toast.error('Error al añadir comentario'); }
    };

    const handleCambiarEstado = async (nuevoEstado) => {
        try {
            await apiService.patch(`/pagos/${id}/estado`, {
                estado: nuevoEstado,
                comentario: `Cambio de estado a: ${nuevoEstado}`
            });
            fetchPago();
            fetchTrazabilidad();
            toast.success(`Estado cambiado a ${nuevoEstado}`);
        } catch (error) { toast.error('Error al cambiar estado'); }
    };

    const toggleEdit = () => {
        if (editando) {
            setPagoEditado(null);
        } else {
            setPagoEditado({ ...pago });
        }
        setEditando(!editando);
    };

    const handleSave = async () => {
        try {
            await apiService.patch(`/pagos/${id}/estado`, {
                estado: pago.estado,
                comentario: 'Edición de datos básicos',
                ...pagoEditado
            });
            setPago(pagoEditado);
            setEditando(false);
            toast.success('Pago actualizado');
        } catch (error) { toast.error('Error al actualizar'); }
    };

    if (!pago) return <div className="text-[#e0dcc8]">Cargando...</div>;

    const gruposFiltrados = grupos.filter(g => g.nombre.toLowerCase().includes(searchGrupo.toLowerCase()));
    const estadosFlujo = ['solicitado', 'subido_sap_espera_liberacion', 'liberado', 'espera_firmas', 'firmado', 'radicado', 'completado', 'pagado', 'rechazado'];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Detalle de Pago</h2>
                    <button onClick={toggleEdit} className="bg-[#2d4a3e] text-[#e0dcc8] px-3 py-1 text-xs font-bold uppercase">
                        {editando ? 'Cancelar' : 'Editar'}
                    </button>
                </div>

                {editando ? (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" value={pagoEditado.concepto} onChange={e => setPagoEditado({...pagoEditado, concepto: e.target.value})} />
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" value={pagoEditado.nit} onChange={e => setPagoEditado({...pagoEditado, nit: e.target.value})} />
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" type="number" value={pagoEditado.monto} onChange={e => setPagoEditado({...pagoEditado, monto: e.target.value})} />
                        <input className="border-b border-[#2d4a3e] p-1 bg-transparent" value={pagoEditado.soportes_link} onChange={e => setPagoEditado({...pagoEditado, soportes_link: e.target.value})} />
                        <button onClick={handleSave} className="col-span-2 bg-[#10b981] text-white py-2 font-bold uppercase">Guardar Cambios</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Concepto</p>
                            <p className="text-sm font-semibold">{pago.concepto}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">NIT</p>
                            <p className="text-sm font-semibold">{pago.nit}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Monto</p>
                            <p className="text-sm font-semibold">${parseFloat(pago.monto).toLocaleString('es-CO')}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Estado Actual</p>
                            <p className="text-sm font-semibold text-[#2d4a3e]">{pago.estado}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Solicitante</p>
                            <p className="text-sm font-semibold">{pago.solicitante_nombre}</p>
                        </div>
                        <div className="border border-[#2d4a3e] p-2 bg-[#d8d4c2]">
                            <p className="text-[10px] uppercase font-bold text-[#2d4a3e]">Soportes</p>
                            <p className="text-sm font-semibold">{pago.soportes_link ? <a href={pago.soportes_link} target="_blank" rel="noreferrer" className="text-blue-800 underline">Link</a> : 'N/A'}</p>
                        </div>
                    </div>
                )}

                <div className="mt-6 border-t border-[#2d4a3e]/30 pt-4">
                    <p className="text-xs uppercase font-bold text-[#2d4a3e] mb-2">Cambiar Estado:</p>
                    <div className="flex flex-wrap gap-2">
                        {estadosFlujo.map(est => (
                            <button 
                                key={est}
                                className={`text-[10px] px-2 py-1 uppercase font-bold border ${pago.estado === est ? 'bg-[#2d4a3e] text-[#e0dcc8]' : 'border-[#2d4a3e] text-[#2d4a3e] hover:bg-[#2d4a3e]/10'}`}
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
                                className={`text-[10px] px-2 py-1 uppercase font-bold border ${pago.grupos?.includes(g.nombre) ? 'bg-[#2d4a3e] text-[#e0dcc8]' : 'border-[#2d4a3e] text-[#2d4a3e]'}`}
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
                            <p className="font-bold">{new Date(t.fecha).toLocaleString()} - {t.autor}</p>
                            <p>Estado: <span className="font-bold">{t.estado_nuevo}</span></p>
                            <p className="italic">{t.comentario}</p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
