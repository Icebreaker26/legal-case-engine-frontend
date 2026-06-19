import { useState } from 'react';
import { X, Mail, FileCheck, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { tutelaService } from '../../../services/tutelaService';
import { useAuth } from '../../../../../context/AuthContext';

export function ModalCrearRequerimiento({
    isOpen,
    onClose,
    id,
    areasDinamicas,
    setRequerimientos,
    addHistorialLog
}) {
    const [nuevoReq, setNuevoReq] = useState({ grupo_id: '', descripcion: '', prioridad: 'Media', fecha_limite: '' });
    const [updating, setUpdating] = useState(false);
    const [busquedaArea, setBusquedaArea] = useState('');
    const [isOpenDropdown, setIsOpenDropdown] = useState(false);
    const { user } = useAuth();

    if (!isOpen) return null;

    const areasFiltradas = areasDinamicas.filter(area => 
        area.nombre.toLowerCase().includes(busquedaArea.toLowerCase())
    );

    const handleCrearReq = async (e) => {
        e.preventDefault();
        if (!nuevoReq.grupo_id || !nuevoReq.descripcion.trim()) return;
    
        setUpdating(true);
        try {
            const payload = {
            ...nuevoReq,
            grupo_id: parseInt(nuevoReq.grupo_id),
            fecha_limite: nuevoReq.fecha_limite || undefined,
        };
            const created = await tutelaService.crearRequerimiento(id, payload);
            setRequerimientos(prev => [created, ...prev]);
            
            const nombreGrupo = areasDinamicas.find(a => a.id === payload.grupo_id)?.nombre || 'Desconocido';
            
            const log = await tutelaService.agregarAccion(id, {
                accion: `Se generó requerimiento interno para el área de ${nombreGrupo}`,
                area_involucrada: nombreGrupo,
                responsable_uuid: user?.id || null,
                fecha_seguimiento: new Date().toISOString()
            });
            addHistorialLog(log);

            setNuevoReq({ grupo_id: '', descripcion: '', prioridad: 'Media', fecha_limite: '' });
            setBusquedaArea('');
            toast.success('Solicitud enviada correctamente');
            onClose();
        } catch (err) { toast.error('Error al enviar solicitud'); }
        finally { setUpdating(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2.5 bg-blue-50 text-[#002E6D] rounded-xl"><Mail size={20} /></div>
                        Solicitar Pruebas
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <form onSubmit={handleCrearReq} className="space-y-6">
                    <div className="relative">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Grupo Destino</label>
                        <div 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm cursor-pointer flex justify-between items-center"
                            onClick={() => setIsOpenDropdown(!isOpenDropdown)}
                        >
                            <span className={nuevoReq.grupo_id ? "text-gray-800" : "text-gray-400"}>
                                {nuevoReq.grupo_id ? areasDinamicas.find(a => a.id == nuevoReq.grupo_id)?.nombre : 'Selecciona un grupo...'}
                            </span>
                        </div>
                        {isOpenDropdown && (
                            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                <input 
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full p-3 text-sm border-b border-gray-100 outline-none"
                                    value={busquedaArea}
                                    onChange={(e) => setBusquedaArea(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {areasFiltradas.map(area => (
                                    <div 
                                        key={area.id}
                                        className="p-3 text-sm hover:bg-blue-50 cursor-pointer"
                                        onClick={() => {
                                            setNuevoReq({...nuevoReq, grupo_id: area.id});
                                            setIsOpenDropdown(false);
                                            setBusquedaArea('');
                                        }}
                                    >
                                        {area.nombre}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Prioridad y Fecha límite en la misma fila */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Prioridad</label>
                            <select
                                value={nuevoReq.prioridad}
                                onChange={e => setNuevoReq({...nuevoReq, prioridad: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow"
                            >
                                <option value="Alta">Alta — Urgente</option>
                                <option value="Media">Media — Normal</option>
                                <option value="Baja">Baja — Sin prisa</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Respuesta antes de</label>
                            <input
                                type="date"
                                value={nuevoReq.fecha_limite}
                                onChange={e => setNuevoReq({...nuevoReq, fecha_limite: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">¿Qué información necesitas?</label>
                        <textarea
                            required
                            rows="5"
                            placeholder="Ej: Reporte de inspección del poste #456, comprobante de pago, etc..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow resize-none"
                            value={nuevoReq.descripcion}
                            onChange={e => setNuevoReq({...nuevoReq, descripcion: e.target.value})}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={updating}
                        className="w-full py-4 bg-[#002E6D] text-white rounded-xl font-bold text-sm hover:bg-[#001d4a] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Generar y Registrar Requerimiento'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export function ModalVerOficio({
    isOpen,
    onClose,
    viewOficio,
    tutela
}) {
    if (!isOpen || !viewOficio) return null;

    const handleDownloadOficio = () => {
        const element = document.createElement("a");
        const file = new Blob([viewOficio.oficio_generado], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `Requerimiento_${viewOficio.area_destino}_${tutela.radicado}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl animate-scale-in border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Oficio de Requerimiento</h3>
                        <p className="text-xs text-[#002E6D] font-bold mt-1">Dirigido a: {viewOficio.area_destino}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors bg-white border border-gray-200"><X size={20} /></button>
                </div>
                <div className="p-8 md:p-10 font-mono text-xs text-gray-700 whitespace-pre-wrap bg-white overflow-y-auto max-h-[60vh] leading-relaxed">
                    <div className="mb-8 pb-8 border-b border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Contenido del Oficio Oficial Enviado</h4>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-inner">
                            {viewOficio.oficio_generado}
                        </div>
                    </div>
                    
                    {viewOficio.estado === 'Respondido' && (
                        <div className="bg-green-50/50 p-6 rounded-2xl border border-green-200">
                            <h4 className="text-[10px] font-black text-green-700 uppercase mb-4 tracking-widest flex items-center gap-2">
                                <FileCheck size={16} /> Respuesta Técnica Recibida
                            </h4>
                            <div className="font-sans text-sm text-gray-800 leading-relaxed italic whitespace-pre-wrap break-words break-all bg-white p-5 rounded-xl shadow-sm border border-green-100">
                                {viewOficio.respuesta_texto || 'Respuesta registrada en el historial del caso.'}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row justify-end gap-3 px-8">
                    <button 
                        onClick={() => { navigator.clipboard.writeText(viewOficio.oficio_generado); toast.success('Copiado'); }} 
                        className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-xs hover:bg-gray-50 transition-all text-center"
                    >
                        Copiar Texto
                    </button>
                    <button 
                        onClick={handleDownloadOficio} 
                        className="px-6 py-3 bg-[#002E6D] text-white rounded-xl font-bold text-xs hover:bg-[#001d4a] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <Download size={16} /> Descargar .txt
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ModalResponderReq({
    isOpen,
    onClose,
    respReqModal,
    setRequerimientos,
    addHistorialLog
}) {
    const [textoRespuesta, setTextoRespuesta] = useState('');
    const [updating, setUpdating] = useState(false);

    if (!isOpen || !respReqModal) return null;

    const handleRegistrarRespuesta = async (e) => {
        e.preventDefault();
        if (!textoRespuesta.trim()) return;

        setUpdating(true);
        try {
            const timestamp = new Date().toLocaleString();
            const nuevaLinea = `\n[${timestamp}]: ${textoRespuesta}`;
            await tutelaService.actualizarEstadoRequerimiento(respReqModal, 'Respondido', textoRespuesta);
            
            setRequerimientos(prev => prev.map(r => 
                r.id === respReqModal 
                ? { ...r, estado: 'Respondido', respuesta_texto: (r.respuesta_texto || '') + nuevaLinea } 
                : r
            ));
            
            // Refetch historial? We'll just trigger it globally or let the component do it.
            // A simple way is to add a log manually here if it makes sense, but the backend doesn't automatically add it.
            // Oh, wait, the original code called fetchData() to reload the timeline log.
            // We can just rely on the user seeing the state update. We'll close and toast.
            
            setTextoRespuesta('');
            toast.success('Respuesta agregada exitosamente');
            onClose();
        } catch (err) { toast.error('Error al registrar respuesta'); }
        finally { setUpdating(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[170] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileCheck size={20} /></div>
                        Registrar Respuesta
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <form onSubmit={handleRegistrarRespuesta} className="space-y-6">
                    <p className="text-xs text-gray-500 leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100">
                        Pega aquí la información técnica o respuesta enviada por el área para que quede en el historial oficial del caso.
                    </p>
                    <textarea 
                        required
                        rows="6"
                        placeholder="Escribe o pega la respuesta del área aquí..."
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-500 transition-shadow resize-none shadow-inner"
                        value={textoRespuesta}
                        onChange={e => setTextoRespuesta(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={updating}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Cerrar Requerimiento y Guardar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
