import { useState, useCallback, useEffect } from 'react';
import { History, ShieldCheck, Bookmark, ChevronRight, Edit, Trash2, AlertCircle, FileText, Maximize2, Send, Clock, Mail, Plus, Download, ThumbsUp, ThumbsDown, Loader2, Copy, Check, Layers } from 'lucide-react';
import { generarBorradorPDF } from '../../utils/generarBorradorPDF';
import toast from 'react-hot-toast';
import apiService from '../../../../services/apiService';
import { tutelaService } from '../../services/tutelaService';

export default function MainTabs({
    id,
    tutela,
    historial,
    aiDraftContent,
    setAiDraftContent,
    isLockedByMe,
    lock,
    unlock,
    aiConfig,
    argumentos,
    setArgumentos,
    sugerencias,
    loadingSugerencias,
    handleVerDocumentoCompleto,
    // Props migrados de SidebarInfo
    updating,
    setUpdating,
    addHistorialLog,
    loadingAi,
    handleGenerarIA,
    requerimientos,
    setRequerimientos,
    areasDinamicas,
    openReqModal,
    openRespReqModal,
    setViewOficio,
    fetchData
}) {
    const [activeTab, setActiveTab] = useState('contexto');
    const [argEnEdicion, setArgEnEdicion] = useState(null);
    const [nuevoArgumento, setNuevoArgumento] = useState({ titulo: '', contenido: '' });
    const [promptsGenerados, setPromptsGenerados] = useState([]);
    const [generandoPrompts, setGenerandoPrompts] = useState(false);
    const [copiadoIdx, setCopiadoIdx] = useState(null);
    const [jsonLlm, setJsonLlm] = useState('');
    const [parteActual, setParteActual] = useState(0);
    const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);
    const [respuestaAcumulada, setRespuestaAcumulada] = useState(null);

    const respuestaATexto = (resp) => {
        if (!resp?.items?.length) return '';
        const enc = resp.encabezado || {};
        const lineas = [];

        if (enc.ciudad_fecha) lineas.push(enc.ciudad_fecha);
        if (enc.para)         lineas.push(`\nSeñor/a\n${enc.para}`);
        if (enc.radicado_peticion) lineas.push(`Radicado: ${enc.radicado_peticion}`);
        if (enc.asunto)       lineas.push(`Asunto: ${enc.asunto}`);

        if (resp.introduccion) lineas.push(`\n${resp.introduccion}`);

        for (const item of resp.items) {
            lineas.push(`\n${item.numero}.- ${item.solicitud}\n\nRespuesta.\n${item.respuesta}`);
            if (item.normas_citadas?.length) {
                lineas.push(`Normas: ${item.normas_citadas.join(', ')}`);
            }
        }

        const presc = resp.prescripcion;
        if (presc?.aplica && presc?.fundamento) {
            lineas.push(`\nPrescripción extintiva.\n${presc.fundamento}`);
            if (presc.norma) lineas.push(presc.norma);
        }

        if (resp.cierre) lineas.push(`\n${resp.cierre}`);

        return lineas.join('\n');
    };

    const cargarRespuesta = useCallback(async () => {
        try {
            const { data } = await apiService.get(`/tutelas/${id}/respuesta-peticion`);
            setRespuestaAcumulada(data);
            if (data?.items?.length) {
                setAiDraftContent(respuestaATexto(data));
            }
        } catch { /* silencioso */ }
    }, [id]);

    useEffect(() => { cargarRespuesta(); }, [cargarRespuesta]);

    const handleGuardarRespuesta = useCallback(async (modo = 'acumular') => {
        if (!jsonLlm.trim()) return toast.error('Pega el JSON del LLM primero.');
        setGuardandoRespuesta(true);
        try {
            // Strip markdown code fences that LLMs often add around JSON
            let cleanJson = jsonLlm.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            const start = cleanJson.indexOf('{');
            const end = cleanJson.lastIndexOf('}');
            if (start !== -1 && end !== -1) cleanJson = cleanJson.slice(start, end + 1);

            await apiService.post(`/tutelas/${id}/respuesta-peticion`, {
                resultado_llm_json: cleanJson,
                modo,
                parte_index: parteActual,
            });
            toast.success(`Parte ${parteActual + 1} guardada correctamente.`);
            setJsonLlm('');
            setParteActual(p => p + 1);
            await cargarRespuesta();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'JSON inválido o estructura incorrecta.');
        } finally {
            setGuardandoRespuesta(false);
        }
    }, [id, jsonLlm, parteActual, cargarRespuesta]);

    const handleLimpiarRespuesta = useCallback(async () => {
        if (!window.confirm('¿Eliminar toda la respuesta acumulada y empezar de nuevo?')) return;
        try {
            await apiService.delete(`/tutelas/${id}/respuesta-peticion`);
            setRespuestaAcumulada(null);
            setParteActual(0);
            setJsonLlm('');
            toast.success('Respuesta eliminada.');
        } catch { toast.error('Error al eliminar.'); }
    }, [id]);

    const handleExportarPDF = useCallback(async () => {
        if (!respuestaAcumulada?.items?.length) return toast.error('No hay respuesta guardada para exportar.');
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();
        const azul = [0, 46, 109];
        const gris = [75, 85, 99];
        const enc = respuestaAcumulada.encabezado || {};

        // Encabezado corporativo
        doc.setFillColor(...azul);
        doc.rect(0, 0, 210, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RESPUESTA A DERECHO DE PETICIÓN', 14, 11);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Enel Colombia S.A. E.S.P.', 14, 18);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 150, 18);

        let y = 36;
        const W = 182;

        const escribir = (texto, fontSize = 9, bold = false, color = gris) => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(...color);
            const lineas = doc.splitTextToSize(String(texto || '—'), W);
            if (y + lineas.length * 5 > 280) { doc.addPage(); y = 16; }
            doc.text(lineas, 14, y);
            y += lineas.length * 5 + 2;
        };

        const titulo = (texto) => {
            if (y > 260) { doc.addPage(); y = 16; }
            y += 2;
            doc.setFillColor(...azul);
            doc.rect(14, y - 4, W, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(texto.toUpperCase(), 16, y + 0.5);
            y += 8;
        };

        // Datos del encabezado
        titulo('Datos de la comunicación');
        [
            ['Radicado', enc.radicado_peticion || tutela.radicado],
            ['Para', enc.para || tutela.accionante],
            ['Fecha', enc.ciudad_fecha || new Date().toLocaleDateString('es-CO')],
            ['Asunto', enc.asunto || tutela.derecho_vulnerado],
        ].forEach(([k, v]) => {
            doc.setFontSize(9); doc.setTextColor(...gris);
            doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, 14, y);
            doc.setFont('helvetica', 'normal'); doc.text(String(v || '—'), 50, y);
            y += 5.5;
        });

        // Saludo e introducción
        if (respuestaAcumulada.introduccion) {
            titulo('Introducción');
            escribir(`Reciba un cordial saludo, Sr./Sra. ${enc.para || tutela.accionante}.`);
            y += 1;
            escribir(respuestaAcumulada.introduccion);
        }

        // Respuestas punto a punto
        titulo('Respuesta de fondo');
        for (const item of respuestaAcumulada.items) {
            if (y > 255) { doc.addPage(); y = 16; }
            escribir(`${item.numero}.- ${item.solicitud}`, 9, true, azul);
            y += 1;
            escribir('Respuesta.', 9, true, gris);
            escribir(item.respuesta);
            if (item.normas_citadas?.length) {
                escribir(`Normas: ${item.normas_citadas.join(' · ')}`, 8, false, [120, 120, 120]);
            }
            y += 3;
        }

        // Prescripción
        const presc = respuestaAcumulada.prescripcion;
        if (presc?.aplica && presc?.fundamento) {
            titulo('Prescripción extintiva');
            escribir(presc.fundamento);
            if (presc.norma) escribir(`Fundamento: ${presc.norma}`, 8, false, [120, 120, 120]);
        }

        // Cierre
        if (respuestaAcumulada.cierre) {
            titulo('Posición institucional y cierre');
            escribir(respuestaAcumulada.cierre);
        }

        // Pie de página
        const totalPags = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPags; p++) {
            doc.setPage(p);
            doc.setFontSize(7); doc.setTextColor(160, 160, 160);
            doc.text(`Enel Colombia S.A. E.S.P. — Documento generado automáticamente — Pág. ${p} de ${totalPags}`, 14, 292);
        }

        doc.save(`respuesta_peticion_${tutela.radicado || id}.pdf`);
    }, [respuestaAcumulada, tutela, id]);

    const handleGenerarPrompts = useCallback(async () => {
        setGenerandoPrompts(true);
        setPromptsGenerados([]);
        try {
            const { data } = await apiService.post(`/tutelas/${id}/generar-prompts-peticion`);
            setPromptsGenerados(data.prompts);
            if (data.total_partes === 1) {
                toast.success('Prompt listo — 1 parte');
            } else {
                toast.success(`Petición dividida en ${data.total_partes} partes (${data.total_solicitudes} solicitudes detectadas)`);
            }
        } catch {
            toast.error('Error al generar los prompts');
        } finally {
            setGenerandoPrompts(false);
        }
    }, [id]);

    const handleCopiarPrompt = useCallback((prompt, idx) => {
        navigator.clipboard.writeText(prompt);
        setCopiadoIdx(idx);
        toast.success(`Parte ${idx + 1} copiada al portapapeles`);
        setTimeout(() => setCopiadoIdx(null), 2000);
    }, []);

    // Gestión log state (migrado de SidebarInfo)
    const [nuevaAccion, setNuevaAccion] = useState({
        accion: '',
        area_involucrada: '',
        responsable_nombre: 'Alejandro Marín',
        dias_seguimiento: ''
    });

    // ——— Handlers originales de MainTabs ———
    const handleGuardarBorrador = async () => {
        try {
            await apiService.patch(`/tutelas/${id}/borrador`, { contestacion_generada: aiDraftContent });
            toast.success('Borrador guardado');
            await unlock();
        } catch (error) {
            toast.error('Error al guardar el borrador');
        }
    };

    const handleEliminarArgumento = async (argId) => {
        if (!window.confirm('¿Estás seguro de eliminar este argumento?')) return;
        try {
            await apiService.delete(`/tutelas/${id}/argumentos/${argId}`);
            setArgumentos(prev => prev.filter(a => a.id !== argId));
            toast.success('Argumento eliminado');
        } catch (error) { toast.error('Error al eliminar argumento'); }
    };

    const handleActualizarArgumento = async (e) => {
        e.preventDefault();
        try {
            await apiService.patch(`/tutelas/${id}/argumentos/${argEnEdicion.id}`, argEnEdicion);
            setArgumentos(prev => prev.map(a => a.id === argEnEdicion.id ? argEnEdicion : a));
            setArgEnEdicion(null);
            toast.success('Argumento actualizado');
        } catch (error) { toast.error('Error al actualizar argumento'); }
    };

    const handleAddArgumento = async (e) => {
        e.preventDefault();
        try {
            const { data } = await apiService.post(`/tutelas/${id}/argumentos`, nuevoArgumento);
            setArgumentos(prev => [data, ...prev]);
            setNuevoArgumento({ titulo: '', contenido: '' });
            toast.success('Argumento guardado');
        } catch (error) { toast.error('Error al guardar argumento'); }
    };

    // ——— Handlers migrados de SidebarInfo ———
    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!nuevaAccion.accion.trim()) return;

        setUpdating(true);
        try {
            let fecha_seguimiento = null;
            if (nuevaAccion.dias_seguimiento) {
                const date = new Date();
                date.setDate(date.getDate() + parseInt(nuevaAccion.dias_seguimiento));
                fecha_seguimiento = date.toISOString().split('T')[0];
            }

            const log = await tutelaService.agregarAccion(id, {
                ...nuevaAccion,
                fecha_seguimiento
            });

            addHistorialLog(log);
            setNuevaAccion({ ...nuevaAccion, accion: '', area_involucrada: '', dias_seguimiento: '' });
            toast.success('Gestión registrada correctamente');
        } catch (error) {
            toast.error('Error al registrar la acción');
        } finally {
            setUpdating(false);
        }
    };

    const handleActualizarEstadoReq = async (reqId, estado) => {
        try {
            await tutelaService.actualizarEstadoRequerimiento(reqId, estado);
            setRequerimientos(prev => prev.map(r => r.id === reqId ? { ...r, estado } : r));
            toast.success('Estado actualizado');
        } catch (err) { toast.error('Error al actualizar'); }
    };

    const handleDownloadOficio = (req) => {
        const element = document.createElement("a");
        const file = new Blob([req.oficio_generado], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `Requerimiento_${req.area_nombre || 'Grupo'}_${tutela.radicado}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    const tabs = [
        { key: 'contexto', label: 'Contexto Legal y RAG', icon: <Bookmark size={15} /> },
        { key: 'solicitudes', label: 'Solicitudes Internas', icon: <Mail size={15} />, badge: requerimientos.filter(r => r.estado === 'Pendiente').length },
        { key: 'borrador', label: 'Borrador & IA', icon: <ShieldCheck size={15} /> },
        { key: 'trazabilidad', label: 'Trazabilidad y Gestión', icon: <History size={15} /> },
    ];

    return (
        <div className="space-y-6">
            {/* ——— Navegación de Pestañas ——— */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.key
                            ? 'bg-white text-[#002E6D] shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge > 0 && (
                            <span className="ml-1 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* PESTAÑA 1: TRAZABILIDAD Y GESTIÓN                     */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'trazabilidad' && (
                <div className="animate-fade-in space-y-6">
                    {/* Formulario de Registrar Gestión (migrado de SidebarInfo) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                            <Send size={16} className="text-[#002E6D]" /> Registrar Gestión
                        </h3>
                        <form onSubmit={handleAddLog} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="text"
                                    placeholder="Área (ej: Permitting)"
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow"
                                    value={nuevaAccion.area_involucrada}
                                    onChange={(e) => setNuevaAccion({...nuevaAccion, area_involucrada: e.target.value})}
                                />
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input 
                                        type="number"
                                        placeholder="Días alerta"
                                        title="Días para volver a revisar esta gestión"
                                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow"
                                        value={nuevaAccion.dias_seguimiento}
                                        onChange={(e) => setNuevaAccion({...nuevaAccion, dias_seguimiento: e.target.value})}
                                    />
                                </div>
                            </div>
                            <textarea 
                                rows="3"
                                placeholder="Describe la acción realizada..."
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow resize-y"
                                value={nuevaAccion.accion}
                                onChange={(e) => setNuevaAccion({...nuevaAccion, accion: e.target.value})}
                                required
                            />
                            <button 
                                type="submit"
                                disabled={updating}
                                className="w-full px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                            >
                                <Send size={14} /> Registrar en Trazabilidad
                            </button>
                        </form>
                    </div>

                    {/* Línea de Tiempo del historial */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6">
                            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            {historial.length === 0 ? (
                                <p className="text-sm text-gray-400 italic pl-8">No hay registros de gestión aún.</p>
                            ) : historial.map((log) => (
                                <div key={log.id} className="relative pl-10 group">
                                <div className="absolute left-0 top-1 w-7 h-7 bg-white border-2 border-gray-200 group-hover:border-[#002E6D] rounded-full flex items-center justify-center z-10 transition-colors">
                                    <div className="w-2 h-2 bg-gray-300 group-hover:bg-[#002E6D] rounded-full transition-colors"></div>
                                </div>
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                                    <span className="text-[#002E6D]">{log.responsable_nombre}</span>{log.area_involucrada && <><span className="text-gray-400 font-normal"> · </span>{log.area_involucrada}</>}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <div className="flex flex-col h-auto w-full text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap break-words">
                                    {log.accion}
                                    </div>
                                    {log.fecha_seguimiento && (
                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 w-fit px-2 py-1.5 rounded-md border border-orange-100">
                                        <AlertCircle size={12} />
                                        REVISAR EL: {new Date(log.fecha_seguimiento).toLocaleDateString()}
                                    </div>
                                    )}
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* PESTAÑA 2: BORRADOR & IA                              */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'borrador' && (
                <div className="animate-fade-in space-y-6">
                    {/* Panel de Asistencia IA */}
                    <div className="bg-gradient-to-r from-[#002E6D] to-[#001d4a] p-5 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-blue-300" />
                                <div>
                                    <h3 className="font-bold text-white text-sm">Asistencia IA — Derecho de Petición</h3>
                                    <p className="text-blue-200 text-xs">Detecta cada solicitud y genera un prompt por lote</p>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerarPrompts}
                                disabled={generandoPrompts}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all bg-white text-[#002E6D] hover:bg-blue-50 hover:shadow-lg disabled:opacity-60"
                            >
                                {generandoPrompts
                                    ? <><Loader2 size={16} className="animate-spin" /> Analizando...</>
                                    : <><Layers size={16} /> Generar Prompts</>
                                }
                            </button>
                        </div>

                        {/* Prompts generados */}
                        {promptsGenerados.length > 0 && (
                            <div className="mt-4 space-y-3">
                                {promptsGenerados.map((p, idx) => (
                                    <div key={idx} className="bg-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-white text-xs font-bold">
                                                Parte {p.parte} de {p.total}
                                                {p.total > 1 && (
                                                    <span className="ml-2 text-blue-200 font-normal">
                                                        Solicitudes: {p.solicitudes.join(' · ')}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-blue-300 text-[10px] mt-0.5">
                                                {p.prompt.length.toLocaleString()} caracteres
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCopiarPrompt(p.prompt, idx)}
                                            className="flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-white text-[#002E6D] hover:bg-blue-50"
                                        >
                                            {copiadoIdx === idx
                                                ? <><Check size={13} className="text-green-600" /> Copiado</>
                                                : <><Copy size={13} /> Copiar</>
                                            }
                                        </button>
                                    </div>
                                ))}
                                <p className="text-blue-200 text-[10px] text-center pt-1">
                                    Copia cada parte al LLM en orden · Pega cada respuesta en el panel de abajo
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Panel: pegar JSON del LLM ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Pegar respuesta del LLM</h3>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    {promptsGenerados.length > 1
                                        ? `Guardando parte ${parteActual + 1} de ${promptsGenerados.length}`
                                        : 'Pega aquí el JSON que devolvió el LLM'}
                                </p>
                            </div>
                            {respuestaAcumulada && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                                        {respuestaAcumulada.items?.length || 0} solicitudes guardadas
                                    </span>
                                    <button onClick={handleLimpiarRespuesta} className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                        Limpiar
                                    </button>
                                </div>
                            )}
                        </div>

                        <textarea
                            className="w-full h-40 p-4 border border-gray-200 rounded-xl text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-[#002E6D] bg-gray-50/50 resize-none"
                            value={jsonLlm}
                            onChange={e => setJsonLlm(e.target.value)}
                            placeholder={'{\n  "respuestas": [\n    { "numero": 1, "solicitud": "...", "respuesta": "...", "normas_citadas": [] }\n  ],\n  "prescripcion": { "aplica": false }\n}'}
                        />

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleGuardarRespuesta('acumular')}
                                disabled={guardandoRespuesta || !jsonLlm.trim()}
                                className="flex-1 py-2.5 bg-[#002E6D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#001d4a] transition-colors disabled:opacity-50"
                            >
                                {guardandoRespuesta ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                {promptsGenerados.length > 1 ? `Guardar parte ${parteActual + 1} → poblar editor` : 'Guardar → poblar editor'}
                            </button>
                            {respuestaAcumulada?.items?.length > 0 && (
                                <button
                                    onClick={() => setAiDraftContent(respuestaATexto(respuestaAcumulada))}
                                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                                    title="Repoblar el editor con la respuesta guardada"
                                >
                                    ↺ Repoblar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Editor unificado */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-gray-800">Borrador de Respuesta</h3>
                                <p className="text-gray-400 text-xs mt-0.5">Generado por IA · editable antes de exportar</p>
                            </div>
                            <div className="flex gap-2">
                            <button
                                onClick={() => generarBorradorPDF({ tutela, contenido: aiDraftContent, radicadoLlm: respuestaAcumulada?.encabezado?.radicado_peticion })}
                                className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                            >
                                <Download size={13} /> Exportar PDF
                            </button>
                            {!isLockedByMe ? (
                                <button onClick={lock} className="px-4 py-2 bg-[#002E6D] text-white rounded-lg text-xs font-bold hover:bg-[#001d4a]">Editar Borrador</button>
                            ) : (
                                <button onClick={handleGuardarBorrador} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">Guardar y Liberar</button>
                            )}
                            </div>
                        </div>
                        
                        {isLockedByMe && (
                            <div className="flex flex-wrap gap-2 mb-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center mr-2">Insertar Rápido:</span>
                                <button onClick={() => setAiDraftContent(aiDraftContent + ` ${tutela.accionante} `)} className="text-[10px] bg-white text-gray-700 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 font-bold">[Accionante]</button>
                                <button onClick={() => setAiDraftContent(aiDraftContent + ` ${tutela.radicado} `)} className="text-[10px] bg-white text-gray-700 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 font-bold">[Radicado]</button>
                                <button onClick={() => setAiDraftContent(aiDraftContent + ` ${tutela.derecho_vulnerado} `)} className="text-[10px] bg-white text-gray-700 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 font-bold">[Derecho]</button>
                                {aiConfig.legal_notes?.map(nota => (
                                    <button key={nota.id} onClick={() => setAiDraftContent(aiDraftContent + `\n\n${nota.contenido}\n\n`)} className="text-[10px] bg-blue-100 text-[#002E6D] px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-200 font-bold">[{nota.titulo}]</button>
                                ))}
                            </div>
                        )}

                        <textarea 
                            className="w-full h-96 p-6 border border-gray-200 rounded-xl text-sm font-serif leading-relaxed outline-none focus:ring-2 focus:ring-[#002E6D] bg-gray-50/50 resize-y"
                            value={aiDraftContent}
                            onChange={(e) => setAiDraftContent(e.target.value)}
                            disabled={!isLockedByMe}
                            placeholder="El texto aparecerá aquí automáticamente al guardar la respuesta del LLM. Puedes editarlo libremente antes de exportar el PDF."
                        />

                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <h4 className="font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                                <Bookmark size={16} className="text-purple-600" /> Biblioteca de Argumentos
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            {argumentos.map(arg => (
                                <div key={arg.id} className="bg-white border border-purple-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-purple-900 leading-tight">{arg.titulo}</span>
                                                {arg.promovido_a_memoria && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                        En Memoria
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1">Creado por: {arg.creado_por_nombre || 'Desconocido'}</span>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => setAiDraftContent(aiDraftContent + `\n\n${arg.contenido}\n\n`)}
                                                className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold hover:bg-purple-200 transition-colors"
                                            >
                                                Insertar
                                            </button>
                                            {!arg.promovido_a_memoria && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await tutelaService.promoverArgumento(id, arg.id);
                                                            setArgumentos(prev => prev.map(a =>
                                                                a.id === arg.id ? { ...a, promovido_a_memoria: true } : a
                                                            ));
                                                            toast.success('Argumento promovido a la memoria legal del sistema');
                                                        } catch {
                                                            toast.error('Error al promover el argumento');
                                                        }
                                                    }}
                                                    title="Promover a Memoria Legal — estará disponible como precedente en casos futuros"
                                                    className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-100 transition-colors"
                                                >
                                                    Promover
                                                </button>
                                            )}
                                            <button onClick={() => setArgEnEdicion(arg)} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"><Edit size={12} /></button>
                                            <button onClick={() => handleEliminarArgumento(arg.id)} className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50/50 p-3 rounded-lg flex-1 leading-relaxed border border-gray-100">{arg.contenido}</p>
                                </div>
                            ))}
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-widest">Crear Nuevo Argumento</h4>
                                <form onSubmit={handleAddArgumento} className="space-y-4">
                                    <input 
                                        className="w-full border border-gray-200 bg-white p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                                        placeholder="Título descriptivo del argumento" 
                                        value={nuevoArgumento.titulo}
                                        onChange={e => setNuevoArgumento({...nuevoArgumento, titulo: e.target.value})}
                                        required
                                    />
                                    <textarea 
                                        className="w-full border border-gray-200 bg-white p-3 rounded-lg text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-purple-500 resize-y" 
                                        placeholder="Redacta aquí el contenido detallado del argumento legal..." 
                                        value={nuevoArgumento.contenido}
                                        onChange={e => setNuevoArgumento({...nuevoArgumento, contenido: e.target.value})}
                                        required
                                    />
                                    <button type="submit" className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors w-full sm:w-auto">Guardar Argumento</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* PESTAÑA 3: SOLICITUDES INTERNAS (REQUERIMIENTOS)       */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'solicitudes' && (
                <div className="animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Mail size={18} className="text-[#002E6D]" /> Solicitudes Internas (Requerimientos)
                            </h3>
                            <button 
                                onClick={openReqModal}
                                className="px-4 py-2 bg-[#002E6D] text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#001d4a] transition-colors"
                                title="Nueva solicitud de pruebas"
                            >
                                <Plus size={14} /> Nueva Solicitud
                            </button>
                        </div>
                        
                        {requerimientos.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-200 p-12 rounded-xl text-center">
                                <Mail size={32} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-sm text-gray-400 font-bold">No hay requerimientos activos</p>
                                <p className="text-xs text-gray-400 mt-1">Crea una solicitud interna para solicitar información a otras áreas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {requerimientos.map(req => {
                                    const estaVencido = req.fecha_limite && new Date(req.fecha_limite) < new Date() && req.estado !== 'Respondido';
                                    const diasRestantes = req.fecha_limite
                                        ? Math.ceil((new Date(req.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24))
                                        : null;

                                    const prioridadStyle = {
                                        Alta:  'bg-red-100 text-red-700',
                                        Media: 'bg-orange-100 text-orange-700',
                                        Baja:  'bg-gray-100 text-gray-600',
                                    }[req.prioridad] || 'bg-gray-100 text-gray-600';

                                    const estadoStyle = {
                                        'Respondido':  'bg-green-100 text-green-700',
                                        'En Gestión':  'bg-blue-100 text-blue-700',
                                        'Vencido':     'bg-red-100 text-red-700',
                                        'Pendiente':   'bg-orange-100 text-orange-700',
                                    }[req.estado] || 'bg-orange-100 text-orange-700';

                                    return (
                                    <div key={req.id} className={`bg-white border p-5 rounded-xl hover:shadow-sm transition-all ${estaVencido ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-black text-[#002E6D] uppercase bg-blue-50 px-2.5 py-1 rounded-md w-fit">{req.area_nombre || 'Sin Grupo'}</span>
                                                {req.prioridad && (
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded w-fit ${prioridadStyle}`}>
                                                        {req.prioridad === 'Alta' ? '⚡ ' : ''}{req.prioridad}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => setViewOficio(req)} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-[#002E6D] hover:border-[#002E6D] transition-colors" title="Ver oficio"><Maximize2 size={13}/></button>
                                                <button onClick={() => handleDownloadOficio(req)} className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-[#002E6D] hover:border-[#002E6D] transition-colors" title="Descargar oficio"><Download size={13}/></button>
                                            </div>
                                        </div>

                                        {/* Descripción */}
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">{req.descripcion}</p>

                                        {/* Fecha límite */}
                                        {req.fecha_limite && (
                                            <div className={`flex items-center gap-1.5 text-[10px] font-bold mb-3 ${estaVencido ? 'text-red-600' : diasRestantes <= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                <span>{estaVencido ? '🔴 Vencido el' : diasRestantes === 0 ? '🟠 Vence hoy —' : diasRestantes === 1 ? '🟠 Vence mañana —' : '📅 Límite:'}</span>
                                                <span>{new Date(req.fecha_limite).toLocaleDateString('es-CO')}</span>
                                                {!estaVencido && diasRestantes > 1 && <span className="text-gray-300">({diasRestantes}d)</span>}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                            <span className="text-[10px] text-gray-300 uppercase font-bold tracking-wider">
                                                {new Date(req.fecha_solicitud).toLocaleDateString('es-CO')}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {req.estado !== 'Respondido' && (
                                                    <button
                                                        onClick={() => openRespReqModal(req.id)}
                                                        className="text-[10px] font-black uppercase text-[#002E6D] hover:underline"
                                                    >
                                                        Responder
                                                    </button>
                                                )}
                                                <select
                                                    value={req.estado}
                                                    onChange={(e) => handleActualizarEstadoReq(req.id, e.target.value)}
                                                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border-none outline-none cursor-pointer shadow-sm ${estadoStyle}`}
                                                >
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="En Gestión">En Gestión</option>
                                                    <option value="Respondido">Respondido</option>
                                                    <option value="Vencido">Vencido</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* PESTAÑA 4: CONTEXTO LEGAL Y RAG                       */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeTab === 'contexto' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Texto Original */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                <FileText size={18} className="text-[#002E6D]" /> Texto Original Radicado
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="bg-gray-50 p-5 rounded-xl text-sm text-gray-600 font-serif leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto border border-gray-100 shadow-inner">
                                {tutela.contenido_original}
                            </div>
                        </div>
                    </div>

                    {/* Argumentos Fijos */}
                    {(aiConfig.legal_notes || []).length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <ShieldCheck size={18} className="text-[#002E6D]" />
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Línea de Defensa Institucional</h3>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {aiConfig.legal_notes.map((nota) => (
                                <div key={nota.id} className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-[#002E6D]">
                                            <Bookmark size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#002E6D] text-sm mb-1.5">{nota.titulo}</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">{nota.contenido}</p>
                                        </div>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RAG Sugerencias */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <Bookmark size={18} className="text-[#002E6D]" />
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Precedentes Similares (IA)</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {loadingSugerencias ? (
                                <div className="col-span-1 lg:col-span-2 p-12 text-center">
                                    <div className="w-8 h-8 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Analizando precedentes en la base de datos...</span>
                                </div>
                            ) : sugerencias.length > 0 ? (
                            sugerencias.map((sug, idx) => (
                                <div key={sug.documento_id ? `${sug.documento_id}-${idx}` : idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
                                    <span className="text-[10px] font-black text-white bg-[#002E6D] px-2 py-1 rounded-md w-fit uppercase tracking-widest mb-3">{sug.categoria}</span>
                                    <h4 className="font-bold text-gray-800 text-sm mb-3">{sug.titulo_referencia}</h4>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 flex-1">
                                        <p className="text-sm text-gray-600 italic leading-relaxed">"{sug.contenido_legal}"</p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(sug.contenido_legal);
                                                    toast.success('Copiado');
                                                }}
                                                className="text-[#002E6D] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Copiar <ChevronRight size={12} />
                                            </button>
                                            {sug.documento_id && (
                                                <button
                                                    onClick={() => handleVerDocumentoCompleto(sug)}
                                                    className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:text-[#002E6D] hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Maximize2 size={12} /> Ver Expediente
                                                </button>
                                            )}
                                        </div>
                                        {sug.documento_id && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] text-gray-400 uppercase tracking-widest mr-1">¿Útil?</span>
                                                <button
                                                    onClick={async () => {
                                                        await tutelaService.registrarFeedback(sug.documento_id, true);
                                                        toast.success('Gracias por tu valoración');
                                                    }}
                                                    title="Este precedente fue útil"
                                                    className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                                >
                                                    <ThumbsUp size={13} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        await tutelaService.registrarFeedback(sug.documento_id, false);
                                                        toast('Valoración registrada', { icon: '👎' });
                                                    }}
                                                    title="Este precedente no fue relevante"
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <ThumbsDown size={13} />
                                                </button>
                                                {sug.relevancia_score !== undefined && sug.relevancia_score !== 0 && (
                                                    <span className={`text-[9px] font-black ml-1 ${sug.relevancia_score > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                                        {sug.relevancia_score > 0 ? `+${sug.relevancia_score}` : sug.relevancia_score}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                            ) : (
                                <div className="col-span-1 lg:col-span-2 bg-white border border-dashed border-gray-300 p-12 text-center rounded-2xl">
                                    <Bookmark size={32} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-sm text-gray-400 font-bold">No se encontraron precedentes similares en la memoria.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de edición de argumento */}
            {argEnEdicion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
                        <h4 className="font-bold text-lg mb-6">Editar Argumento</h4>
                        <form onSubmit={handleActualizarArgumento} className="space-y-4">
                            <input 
                                className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                                value={argEnEdicion.titulo} 
                                onChange={e => setArgEnEdicion({...argEnEdicion, titulo: e.target.value})} 
                                required 
                            />
                            <textarea 
                                className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg text-sm h-40 outline-none focus:ring-2 focus:ring-purple-500 resize-y" 
                                value={argEnEdicion.contenido} 
                                onChange={e => setArgEnEdicion({...argEnEdicion, contenido: e.target.value})} 
                                required 
                            />
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setArgEnEdicion(null)} className="flex-1 bg-gray-100 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
