import { useState, useCallback, useEffect } from 'react';
import { History, ShieldCheck, Bookmark, ChevronRight, Edit, Trash2, AlertCircle, FileText, Maximize2, Send, Clock, Mail, Plus, Download, ThumbsUp, ThumbsDown, Loader2, Copy, Check, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { generarBorradorPDF } from '../../utils/generarBorradorPDF';
import toast from 'react-hot-toast';
import apiService from '../../../../services/apiService';
import { tutelaService } from '../../services/tutelaService';

const RESULTADO_COLOR = {
    favorable:    'bg-green-50 text-green-700 border-green-100',
    desfavorable: 'bg-red-50 text-red-700 border-red-100',
    referencia:   'bg-gray-50 text-gray-600 border-gray-100',
};

function PrecedentesRAG({ sugerencias, loadingSugerencias, handleVerDocumentoCompleto }) {
    const [expandidos,  setExpandidos]  = useState({});  // fragmento legal
    const [analisisOpen, setAnalisisOpen] = useState({}); // panel comprension
    const [copiados,    setCopiados]    = useState({});

    const toggleExpand  = (docId) => setExpandidos(p  => ({ ...p, [docId]: !p[docId] }));
    const toggleAnalisis = (docId) => setAnalisisOpen(p => ({ ...p, [docId]: !p[docId] }));

    const copiar = (docId, texto) => {
        navigator.clipboard.writeText(texto);
        setCopiados(prev => ({ ...prev, [docId]: true }));
        setTimeout(() => setCopiados(prev => ({ ...prev, [docId]: false })), 2000);
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-4 px-1">
                <Bookmark size={18} className="text-[#002E6D]" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Precedentes Similares</h3>
            </div>
            <div className="space-y-3">
                {loadingSugerencias ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Buscando precedentes...</span>
                    </div>
                ) : sugerencias.length > 0 ? sugerencias.map((sug) => {
                    const docId      = sug.documento_id;
                    const abierto    = expandidos[docId];
                    const analAbierto = analisisOpen[docId];
                    const copiado    = copiados[docId];
                    const comp       = sug.comprension_doc || null;

                    return (
                        <div key={docId} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border ${comp ? 'border-purple-100' : 'border-gray-200'}`}>
                            {/* Cabecera — identidad del documento */}
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-black text-white bg-[#002E6D] px-2 py-0.5 rounded-md uppercase tracking-widest">
                                            {sug.categoria}
                                        </span>
                                        {comp && (
                                            <button
                                                onClick={() => toggleAnalisis(docId)}
                                                className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase transition-colors ${
                                                    analAbierto
                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                        : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                                                }`}
                                            >
                                                RAG+ {analAbierto ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                                            </button>
                                        )}
                                    </div>
                                    {sug.score && (
                                        <span className="text-[10px] font-black text-gray-400 shrink-0">
                                            {Math.round(sug.score * 100)}% relevancia
                                        </span>
                                    )}
                                </div>

                                {/* Título = identidad del documento */}
                                <p className="font-bold text-gray-800 text-sm leading-snug">{sug.titulo_referencia}</p>

                                {/* Panel de análisis semántico */}
                                {analAbierto && comp && (
                                    <div className="mt-3 bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3 animate-fade-in">
                                        {comp.que_resuelve && (
                                            <div>
                                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Qué resuelve</p>
                                                <p className="text-sm text-gray-700 leading-relaxed">{comp.que_resuelve}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-3">
                                            {comp.tipo_caso && (
                                                <div>
                                                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Tipo de caso</p>
                                                    <p className="text-xs text-gray-600">{comp.tipo_caso}</p>
                                                </div>
                                            )}
                                            {comp.resultado && (
                                                <div>
                                                    <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Resultado</p>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${RESULTADO_COLOR[comp.resultado] || RESULTADO_COLOR.referencia}`}>
                                                        {comp.resultado}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {comp.derechos_involucrados?.length > 0 && (
                                            <div>
                                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1.5">Derechos / figuras jurídicas</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {comp.derechos_involucrados.map((d, i) => (
                                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-white border border-purple-100 text-gray-600 rounded-full">{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Toggle fragmento legal */}
                                <button
                                    onClick={() => toggleExpand(docId)}
                                    className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-[#002E6D] transition-colors"
                                >
                                    {abierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    {abierto ? 'Ocultar fragmento' : 'Ver fragmento relevante'}
                                </button>

                                {abierto && (
                                    <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
                                        <p className="text-sm text-gray-600 italic leading-relaxed">"{sug.contenido_legal}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer — acciones */}
                            <div className="px-5 pb-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 pt-3">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => copiar(docId, sug.contenido_legal)}
                                        className="text-[#002E6D] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {copiado ? <><Check size={12} className="text-green-600" /> Copiado</> : <><Copy size={12} /> Copiar argumento</>}
                                    </button>
                                    {docId && (
                                        <button
                                            onClick={() => handleVerDocumentoCompleto(sug)}
                                            className="text-gray-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:text-[#002E6D] hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Maximize2 size={12} /> Ver documento
                                        </button>
                                    )}
                                </div>
                                {docId && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-gray-400 uppercase tracking-widest mr-1">¿Útil?</span>
                                        <button
                                            onClick={async () => {
                                                const { tutelaService } = await import('../../services/tutelaService');
                                                await tutelaService.registrarFeedback(docId, true);
                                                toast.success('Gracias por tu valoración');
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                        >
                                            <ThumbsUp size={13} />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const { tutelaService } = await import('../../services/tutelaService');
                                                await tutelaService.registrarFeedback(docId, false);
                                                toast('Valoración registrada', { icon: '👎' });
                                            }}
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
                    );
                }) : (
                    <div className="bg-white border border-dashed border-gray-300 p-12 text-center rounded-2xl">
                        <Bookmark size={32} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-sm text-gray-400 font-bold">No se encontraron precedentes similares en la memoria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

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
    fetchData,
    onRespuestaChange,
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
    const [respuestaAcumulada, setRespuestaAcumuladaInternal] = useState(null);
    const setRespuestaAcumulada = useCallback((v) => {
        setRespuestaAcumuladaInternal(v);
        onRespuestaChange?.(v);
    }, [onRespuestaChange]);

    // ── Comprensión estructurada ──
    const [promptComprension, setPromptComprension]         = useState('');
    const [jsonComprension, setJsonComprension]             = useState('');
    const [guardandoComprension, setGuardandoComprension]   = useState(false);
    const [comprensionActiva, setComprensionActiva]         = useState(tutela?.analisis_comprension || null);

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
        await import('jspdf-autotable');
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        // ── Paleta ────────────────────────────────────────────────────────────
        const C = {
            azul:       [0,   46,  109],
            azulClaro:  [0,   82,  165],
            acento:     [230, 126,  34],
            gris:       [55,  65,   81],
            grisClaro:  [107, 114, 128],
            grisFondo:  [248, 249, 250],
            grisBorde:  [209, 213, 219],
            amarillo:   [254, 243, 199],
            amarilloBrd:[252, 211,  77],
            blanco:     [255, 255, 255],
        };

        const PW = 210;           // page width mm
        const ML = 14;            // margin left
        const MR = 14;            // margin right
        const W  = PW - ML - MR; // content width
        const FOOTER_H = 12;
        const PAGE_BOTTOM = 297 - FOOTER_H - 4;

        let y = 0;
        const enc = respuestaAcumulada.encabezado || {};

        // ── Helpers ───────────────────────────────────────────────────────────
        const nuevaPagina = () => { doc.addPage(); y = 20; };
        const checkY = (needed = 20) => { if (y + needed > PAGE_BOTTOM) nuevaPagina(); };

        const txt = (texto, x, yy, opts = {}) => {
            const { size = 9, bold = false, color = C.gris, align = 'left', maxW = W } = opts;
            doc.setFontSize(size);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(...color);
            const lines = doc.splitTextToSize(String(texto || '—'), maxW);
            doc.text(lines, x, yy, { align });
            return lines.length;
        };

        const block = (texto, opts = {}) => {
            const { size = 9, bold = false, color = C.gris, indent = 0, leading = 5 } = opts;
            const lines = doc.splitTextToSize(String(texto || ''), W - indent);
            checkY(lines.length * leading + 2);
            doc.setFontSize(size);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setTextColor(...color);
            doc.text(lines, ML + indent, y);
            y += lines.length * leading + 2;
        };

        const hline = (color = C.grisBorde, x = ML, w = W, thickness = 0.2) => {
            doc.setDrawColor(...color);
            doc.setLineWidth(thickness);
            doc.line(x, y, x + w, y);
        };

        // ── PORTADA / HEADER ──────────────────────────────────────────────────
        // Franja azul oscuro
        doc.setFillColor(...C.azul);
        doc.rect(0, 0, PW, 32, 'F');
        // Línea de acento naranja
        doc.setFillColor(...C.acento);
        doc.rect(0, 32, PW, 1.5, 'F');

        // Título principal
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.blanco);
        doc.text('RESPUESTA A DERECHO DE PETICIÓN', ML, 13);

        // Sub-línea empresa + fecha
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 200, 230);
        doc.text('Enel Colombia S.A. E.S.P.  ·  Defensa Jurídica', ML, 20);
        doc.text('Equipo Jurídico Corporativo', ML, 26);
        doc.setTextColor(...C.blanco);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })}`, PW - MR, 26, { align: 'right' });

        y = 42;

        // ── DATOS DE LA COMUNICACIÓN ──────────────────────────────────────────
        // Fondo gris suave
        doc.setFillColor(...C.grisFondo);
        doc.setDrawColor(...C.grisBorde);
        doc.setLineWidth(0.3);
        doc.roundedRect(ML, y, W, 34, 2, 2, 'FD');

        // Label de sección encima
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.azulClaro);
        doc.text('DATOS DE LA COMUNICACIÓN', ML + 3, y + 5);

        const campos = [
            ['Radicado',  enc.radicado_peticion || tutela.radicado],
            ['Para',      enc.para              || tutela.accionante],
            ['Fecha',     enc.ciudad_fecha      || new Date().toLocaleDateString('es-CO')],
            ['Asunto',    enc.asunto            || tutela.derecho_vulnerado],
        ];

        // Dos columnas
        const colW = (W - 6) / 2;
        campos.forEach(([k, v], i) => {
            const cx = ML + 3 + (i % 2) * (colW + 3);
            const cy = y + 12 + Math.floor(i / 2) * 10;
            doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.grisClaro);
            doc.text(k.toUpperCase(), cx, cy);
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gris);
            const val = doc.splitTextToSize(String(v || '—'), colW - 4);
            doc.text(val[0] || '—', cx, cy + 5); // solo primera línea en la celda
        });

        y += 40;

        // ── INTRODUCCIÓN ──────────────────────────────────────────────────────
        if (respuestaAcumulada.introduccion) {
            checkY(28);
            // Pill encabezado
            doc.setFillColor(...C.azul);
            doc.setDrawColor(...C.azul);
            doc.roundedRect(ML, y, W, 7, 1.5, 1.5, 'F');
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
            doc.text('INTRODUCCIÓN', ML + 4, y + 4.8);
            y += 10;

            block(`Reciba un cordial saludo, Sr./Sra. ${enc.para || tutela.accionante}.`, { bold: true, color: C.gris });
            block(respuestaAcumulada.introduccion, { color: C.gris, leading: 5.2 });
            y += 4;
        }

        // ── RESPUESTA DE FONDO ────────────────────────────────────────────────
        checkY(20);
        doc.setFillColor(...C.azul);
        doc.roundedRect(ML, y, W, 7, 1.5, 1.5, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
        doc.text(`RESPUESTA DE FONDO  (${respuestaAcumulada.items.length} punto${respuestaAcumulada.items.length > 1 ? 's' : ''})`, ML + 4, y + 4.8);
        y += 11;

        for (const item of respuestaAcumulada.items) {
            // Estimar altura necesaria para toda la tarjeta
            const solicLns = doc.splitTextToSize(String(item.solicitud || ''), W - 20).length;
            const respLns  = doc.splitTextToSize(String(item.respuesta  || ''), W - 8).length;
            const normasH  = item.normas_citadas?.length ? 8 : 0;
            const cardH    = 8 + solicLns * 4.8 + 4 + respLns * 5.2 + normasH + 6;

            checkY(Math.min(cardH, PAGE_BOTTOM - 30));

            const cardTop = y;

            // ── Número circular ───────────────────────────────────────────────
            doc.setFillColor(...C.azulClaro);
            doc.circle(ML + 4.5, y + 4.5, 4.5, 'F');
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
            doc.text(String(item.numero), ML + 4.5, y + 5.8, { align: 'center' });

            // ── Etiqueta "Solicitud" ──────────────────────────────────────────
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.azulClaro);
            doc.text('SOLICITUD', ML + 12, y + 3.5);

            // ── Texto de la solicitud ─────────────────────────────────────────
            const solicLines = doc.splitTextToSize(String(item.solicitud || ''), W - 20);
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bolditalic'); doc.setTextColor(...C.gris);
            doc.text(solicLines, ML + 12, y + 8);
            y += 8 + solicLines.length * 4.8 + 3;

            // Divisor sutil
            hline(C.grisBorde, ML + 12, W - 12);
            y += 3;

            // ── Etiqueta "Respuesta" ──────────────────────────────────────────
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.acento);
            doc.text('RESPUESTA JURÍDICA', ML + 4, y);
            y += 4;

            // ── Texto de respuesta ────────────────────────────────────────────
            const respLines = doc.splitTextToSize(String(item.respuesta || ''), W - 8);
            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gris);

            // Paginación dentro de respuestas largas
            let linesLeft = respLines;
            while (linesLeft.length > 0) {
                const available = Math.floor((PAGE_BOTTOM - y) / 5.2);
                if (available <= 0) { nuevaPagina(); continue; }
                const chunk = linesLeft.slice(0, available);
                doc.text(chunk, ML + 4, y);
                y += chunk.length * 5.2;
                linesLeft = linesLeft.slice(available);
                if (linesLeft.length > 0) nuevaPagina();
            }
            y += 3;

            // ── Normas citadas como chips ─────────────────────────────────────
            if (item.normas_citadas?.length) {
                checkY(8);
                doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.grisClaro);
                doc.text('NORMAS:', ML + 4, y);
                let chipX = ML + 22;
                for (const norma of item.normas_citadas) {
                    const tw = doc.getTextWidth(norma) + 4;
                    if (chipX + tw > PW - MR) { y += 6; chipX = ML + 22; }
                    doc.setFillColor(235, 245, 255);
                    doc.setDrawColor(...C.grisBorde);
                    doc.setLineWidth(0.2);
                    doc.roundedRect(chipX, y - 3.5, tw, 5, 1, 1, 'FD');
                    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.azulClaro);
                    doc.text(norma, chipX + 2, y + 0.2);
                    chipX += tw + 2;
                }
                y += 7;
            }

            // Borde izquierdo de la tarjeta (acento visual)
            doc.setFillColor(...C.azulClaro);
            doc.rect(ML, cardTop, 1, y - cardTop, 'F');

            y += 5;
            // Línea separadora entre tarjetas
            if (item !== respuestaAcumulada.items.at(-1)) {
                hline([220, 230, 240]);
                y += 5;
            }
        }

        // ── PRESCRIPCIÓN EXTINTIVA ────────────────────────────────────────────
        const presc = respuestaAcumulada.prescripcion;
        if (presc?.aplica && presc?.fundamento) {
            checkY(30);
            y += 4;
            // Caja ámbar
            const prescLines = doc.splitTextToSize(String(presc.fundamento), W - 12);
            const normaLines = presc.norma ? doc.splitTextToSize(`Base: ${presc.norma}`, W - 12) : [];
            const boxH = 10 + (prescLines.length + normaLines.length) * 5 + 4;

            doc.setFillColor(...C.amarillo);
            doc.setDrawColor(...C.amarilloBrd);
            doc.setLineWidth(0.4);
            doc.roundedRect(ML, y, W, boxH, 2, 2, 'FD');

            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(146, 64, 14);
            doc.text('⚖  PRESCRIPCIÓN EXTINTIVA APLICABLE', ML + 4, y + 6);
            y += 10;

            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(92, 52, 10);
            doc.text(prescLines, ML + 4, y);
            y += prescLines.length * 5 + 2;

            if (normaLines.length) {
                doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(146, 64, 14);
                doc.text(normaLines, ML + 4, y);
                y += normaLines.length * 5;
            }
            y += 6;
        }

        // ── CIERRE ────────────────────────────────────────────────────────────
        if (respuestaAcumulada.cierre) {
            checkY(24);
            y += 4;
            doc.setFillColor(...C.azul);
            doc.roundedRect(ML, y, W, 7, 1.5, 1.5, 'F');
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
            doc.text('POSICIÓN INSTITUCIONAL Y CIERRE', ML + 4, y + 4.8);
            y += 11;
            block(respuestaAcumulada.cierre, { color: C.gris, leading: 5.2 });

            // Firma
            checkY(22);
            y += 8;
            hline(C.grisBorde, ML + 40, W - 80, 0.4);
            y += 4;
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.azul);
            doc.text('Enel Colombia S.A. E.S.P.', PW / 2, y, { align: 'center' });
            y += 4;
            doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.grisClaro);
            doc.text('Defensa Jurídica — Equipo Jurídico Corporativo', PW / 2, y, { align: 'center' });
        }

        // ── PIE DE PÁGINA en todas las páginas ────────────────────────────────
        const totalPags = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPags; p++) {
            doc.setPage(p);
            // Línea
            doc.setDrawColor(...C.grisBorde);
            doc.setLineWidth(0.3);
            doc.line(ML, 285, PW - MR, 285);
            // Texto izquierda
            doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.grisClaro);
            doc.text('Enel Colombia S.A. E.S.P.  ·  Documento generado por el sistema de gestión jurídica', ML, 290);
            // Número derecha
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.azul);
            doc.text(`${p} / ${totalPags}`, PW - MR, 290, { align: 'right' });
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

    const handleGenerarPromptComprension = async () => {
        try {
            const { data } = await apiService.get(`/tutelas/${id}/prompt-comprension`);
            setPromptComprension(data.prompt);
        } catch {
            toast.error('Error al generar el prompt de comprensión');
        }
    };

    const handleGuardarComprension = async () => {
        if (!jsonComprension.trim()) return toast.error('Pega el JSON del LLM primero.');
        setGuardandoComprension(true);
        try {
            const { data } = await apiService.post(`/tutelas/${id}/comprension`, { json_comprension: jsonComprension });
            setComprensionActiva(data.comprension);
            setJsonComprension('');
            setPromptComprension('');
            toast.success('Análisis guardado — el RAG usará esta comprensión al generar prompts');
        } catch (err) {
            toast.error(err?.response?.data?.error || 'JSON inválido o estructura incorrecta.');
        } finally {
            setGuardandoComprension(false);
        }
    };

    const handleExportarAnalisisPDF = async (comp) => {
        if (!comp) return;
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });

        const C = {
            azul:      [0,   46,  109],
            purpura:   [109,  40,  217],
            purpClaro: [237, 233, 254],
            purpBorde: [167, 139, 250],
            acento:    [230, 126,  34],
            gris:      [55,  65,   81],
            grisClaro: [107, 114, 128],
            grisFondo: [248, 249, 250],
            grisBorde: [209, 213, 219],
            blanco:    [255, 255, 255],
            rojo:      [185,  28,  28],
            amber:     [180, 100,   0],
            verde:     [ 21, 128,  61],
        };

        const PW = 210;
        const ML = 14;
        const W  = PW - ML * 2;
        const FOOTER_H = 12;
        const PAGE_BOTTOM = 297 - FOOTER_H - 4;
        let y = 0;

        const checkY = (needed = 20) => { if (y + needed > PAGE_BOTTOM) { doc.addPage(); y = 20; } };

        const block = (texto, opts = {}) => {
            const { size = 9, bold = false, italic = false, color = C.gris, indent = 0, leading = 5.2 } = opts;
            const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
            const lines = doc.splitTextToSize(String(texto || ''), W - indent);
            checkY(lines.length * leading + 2);
            doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...color);
            doc.text(lines, ML + indent, y);
            y += lines.length * leading + 2;
        };

        const pill = (texto, opts = {}) => {
            const { bg = C.purpClaro, border = C.purpBorde, color = C.purpura } = opts;
            checkY(9);
            doc.setFillColor(...bg); doc.setDrawColor(...border); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, W, 7, 1.5, 1.5, 'FD');
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...color);
            doc.text(texto.toUpperCase(), ML + 4, y + 4.8);
            y += 10;
        };

        // ── Header ────────────────────────────────────────────────────────────
        doc.setFillColor(...C.azul);
        doc.rect(0, 0, PW, 32, 'F');
        doc.setFillColor(...C.purpura);
        doc.rect(0, 32, PW, 1.5, 'F');
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
        doc.text('ANÁLISIS SEMÁNTICO DE PETICIÓN', ML, 13);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 200, 230);
        doc.text('Enel Colombia S.A. E.S.P.  ·  Defensa Jurídica', ML, 20);
        const radicado = tutela?.radicado || id;
        doc.text(`Radicado: ${radicado}`, ML, 26);
        doc.setTextColor(...C.blanco);
        doc.text(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }), PW - ML, 26, { align: 'right' });
        y = 42;

        // ── Metadatos de la petición ──────────────────────────────────────────
        doc.setFillColor(...C.grisFondo); doc.setDrawColor(...C.grisBorde); doc.setLineWidth(0.3);
        doc.roundedRect(ML, y, W, 24, 2, 2, 'FD');
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.purpura);
        doc.text('DATOS DE LA PETICIÓN', ML + 3, y + 5);
        const colW = (W - 6) / 2;
        const meta = [
            ['Peticionario', tutela?.accionante],
            ['Materia',      tutela?.derecho_vulnerado],
            ['Entidad',      tutela?.entidad_nombre || '—'],
            ['Fecha límite', tutela?.fecha_vencimiento ? new Date(tutela.fecha_vencimiento).toLocaleDateString('es-CO') : '—'],
        ];
        meta.forEach(([k, v], i) => {
            const cx = ML + 3 + (i % 2) * (colW + 3);
            const cy = y + 11 + Math.floor(i / 2) * 8;
            doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.grisClaro);
            doc.text(k.toUpperCase(), cx, cy);
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gris);
            const val = doc.splitTextToSize(String(v || '—'), colW - 4);
            doc.text(val[0], cx, cy + 4.5);
        });
        y += 28;

        // ── Análisis ──────────────────────────────────────────────────────────
        pill('Análisis semántico — resultado del LLM');

        if (comp.tema_central) {
            block('Tema central', { size: 7.5, bold: true, color: C.purpura });
            block(comp.tema_central, { indent: 3, leading: 5.5 });
            y += 2;
        }

        if (comp.extracto_clave) {
            checkY(16);
            doc.setFillColor(245, 243, 255); doc.setDrawColor(...C.purpBorde); doc.setLineWidth(0.25);
            const extLines = doc.splitTextToSize(`"${comp.extracto_clave}"`, W - 12);
            doc.roundedRect(ML, y, W, extLines.length * 5 + 8, 2, 2, 'FD');
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.purpura);
            doc.text('EXTRACTO CLAVE', ML + 4, y + 5);
            doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gris);
            doc.text(extLines, ML + 4, y + 10);
            y += extLines.length * 5 + 12;
        }

        if (comp.peticiones?.length > 0) {
            checkY(14);
            block('Peticiones detectadas', { size: 7.5, bold: true, color: C.purpura });
            comp.peticiones.forEach((p, i) => {
                checkY(12);
                // Número circular
                doc.setFillColor(...C.purpura); doc.circle(ML + 4, y + 2, 3, 'F');
                doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
                doc.text(String(i + 1), ML + 4, y + 3, { align: 'center' });
                // Texto
                const pLines = doc.splitTextToSize(String(p), W - 14);
                doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gris);
                doc.text(pLines, ML + 10, y + 2);
                // Barra izquierda
                doc.setFillColor(...C.purpura); doc.rect(ML, y - 1, 0.8, pLines.length * 5 + 2, 'F');
                y += pLines.length * 5 + 5;
            });
        }

        if (comp.derechos_invocados?.length > 0) {
            checkY(14);
            y += 2;
            block('Derechos invocados', { size: 7.5, bold: true, color: C.purpura });
            let chipX = ML;
            for (const d of comp.derechos_invocados) {
                const tw = doc.getTextWidth(d) + 6;
                if (chipX + tw > PW - ML) { y += 7; chipX = ML; }
                doc.setFillColor(245, 243, 255); doc.setDrawColor(...C.purpBorde); doc.setLineWidth(0.2);
                doc.roundedRect(chipX, y - 3.5, tw, 5.5, 1.5, 1.5, 'FD');
                doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.purpura);
                doc.text(d, chipX + 3, y + 0.5);
                chipX += tw + 3;
            }
            y += 9;
        }

        if (comp.urgencia_declarada) {
            checkY(10);
            const urgColor = comp.urgencia_declarada === 'alta'  ? C.rojo  :
                             comp.urgencia_declarada === 'media' ? C.amber : C.verde;
            const urgBg    = comp.urgencia_declarada === 'alta'  ? [254, 226, 226] :
                             comp.urgencia_declarada === 'media' ? [254, 243, 199] : [220, 252, 231];
            const urgLabel = `Urgencia declarada: ${comp.urgencia_declarada.toUpperCase()}`;
            const tw = doc.getTextWidth(urgLabel) + 10;
            doc.setFillColor(...urgBg); doc.setDrawColor(...urgColor); doc.setLineWidth(0.3);
            doc.roundedRect(ML, y, tw, 6.5, 1.5, 1.5, 'FD');
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...urgColor);
            doc.text(urgLabel, ML + 5, y + 4.5);
            y += 10;
        }

        // ── Texto original de la petición ─────────────────────────────────────
        if (tutela?.contenido_original) {
            checkY(20);
            y += 4;
            doc.setFillColor(...C.azul);
            doc.roundedRect(ML, y, W, 7, 1.5, 1.5, 'F');
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.blanco);
            doc.text('TEXTO ORIGINAL DE LA PETICIÓN', ML + 4, y + 4.8);
            y += 11;

            const texto = String(tutela.contenido_original || '');
            const lineas = doc.splitTextToSize(texto, W - 6);
            let restantes = lineas;
            while (restantes.length > 0) {
                const disponibles = Math.floor((PAGE_BOTTOM - y) / 5);
                if (disponibles <= 0) { doc.addPage(); y = 20; continue; }
                const chunk = restantes.slice(0, disponibles);
                doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gris);
                doc.text(chunk, ML + 3, y);
                y += chunk.length * 5;
                restantes = restantes.slice(disponibles);
                if (restantes.length > 0) { doc.addPage(); y = 20; }
            }
        }

        // ── Footer ────────────────────────────────────────────────────────────
        const totalPags = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPags; p++) {
            doc.setPage(p);
            doc.setDrawColor(...C.grisBorde); doc.setLineWidth(0.3);
            doc.line(ML, 285, PW - ML, 285);
            doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.grisClaro);
            doc.text('Enel Colombia S.A. E.S.P.  ·  Análisis generado por el sistema de gestión jurídica', ML, 290);
            doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.purpura);
            doc.text(`${p} / ${totalPags}`, PW - ML, 290, { align: 'right' });
        }

        doc.save(`analisis_peticion_${tutela?.radicado || id}.pdf`);
    };

    const tabsSecundarias = [
        { key: 'solicitudes', label: 'Solicitudes Internas', icon: <Mail size={13} />, badge: requerimientos.filter(r => r.estado === 'Pendiente').length },
        { key: 'trazabilidad', label: 'Trazabilidad y Gestión', icon: <History size={13} /> },
    ];
    const [menuSecundario, setMenuSecundario] = useState(false);
    const tabSecActiva = tabsSecundarias.find(t => t.key === activeTab);

    return (
        <div className="space-y-6">
            {/* ——— Navegación de Pestañas ——— */}
            <div className="flex items-center gap-2">
                {/* Tabs principales — prominentes */}
                <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl shadow-inner flex-1">
                    {[
                        { key: 'contexto', label: 'Contexto Legal y RAG', icon: <Bookmark size={15} /> },
                        { key: 'borrador', label: 'Borrador & IA',        icon: <ShieldCheck size={15} /> },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                activeTab === tab.key
                                ? 'bg-white text-[#002E6D] shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Menú secundario — discreto */}
                <div className="relative">
                    <button
                        onClick={() => setMenuSecundario(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all border ${
                            tabSecActiva
                                ? 'bg-white text-gray-700 border-gray-300 shadow-sm'
                                : 'text-gray-400 border-gray-200 hover:text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                        title="Otras secciones"
                    >
                        {tabSecActiva ? tabSecActiva.icon : <History size={13} />}
                        <span className="hidden sm:inline">{tabSecActiva ? tabSecActiva.label : 'Más'}</span>
                        {tabsSecundarias.some(t => t.badge > 0) && !tabSecActiva && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                        {tabSecActiva?.badge > 0 && (
                            <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                {tabSecActiva.badge}
                            </span>
                        )}
                        <ChevronDown size={11} className={`transition-transform ${menuSecundario ? 'rotate-180' : ''}`} />
                    </button>

                    {menuSecundario && (
                        <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[190px] py-1 overflow-hidden">
                            {tabsSecundarias.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => { setActiveTab(tab.key); setMenuSecundario(false); }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors text-left ${
                                        activeTab === tab.key
                                            ? 'bg-gray-50 text-[#002E6D]'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.badge > 0 && (
                                        <span className="ml-auto bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                            {tabSecActiva && (
                                <button
                                    onClick={() => { setActiveTab('contexto'); setMenuSecundario(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 border-t border-gray-100 mt-1 transition-colors"
                                >
                                    <ChevronUp size={11} /> Volver a vista principal
                                </button>
                            )}
                        </div>
                    )}
                </div>
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
                    {/* ── Panel: Comprensión Estructurada ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                <Layers size={16} className="text-[#002E6D]" /> Análisis de Comprensión
                                <span className="text-[10px] font-normal text-gray-400 ml-1">Opcional — mejora el RAG</span>
                            </h3>
                            {comprensionActiva && (
                                <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Activo</span>
                            )}
                        </div>

                        <div className="p-6">
                            {/* Estado C — comprensión guardada */}
                            {comprensionActiva ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black text-[#002E6D] uppercase tracking-widest mb-1">Tema central</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">{comprensionActiva.tema_central}</p>
                                        </div>
                                        {comprensionActiva.peticiones?.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-black text-[#002E6D] uppercase tracking-widest mb-1">Peticiones detectadas</p>
                                                <ol className="list-decimal list-inside space-y-1">
                                                    {comprensionActiva.peticiones.map((p, i) => (
                                                        <li key={i} className="text-xs text-gray-600 leading-relaxed">{p}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 pt-1">
                                            {comprensionActiva.urgencia_declarada && (
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                    comprensionActiva.urgencia_declarada === 'alta'  ? 'bg-red-100 text-red-700'    :
                                                    comprensionActiva.urgencia_declarada === 'media' ? 'bg-amber-100 text-amber-700' :
                                                                                                       'bg-gray-100 text-gray-600'
                                                }`}>
                                                    Urgencia: {comprensionActiva.urgencia_declarada}
                                                </span>
                                            )}
                                            {comprensionActiva.derechos_invocados?.length > 0 && (
                                                <p className="text-[10px] text-gray-400">
                                                    Derechos: {comprensionActiva.derechos_invocados.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            onClick={() => { setComprensionActiva(null); setPromptComprension(''); }}
                                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            Actualizar análisis
                                        </button>
                                        <button
                                            onClick={() => handleExportarAnalisisPDF(comprensionActiva)}
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors border border-purple-100"
                                        >
                                            <Download size={12} /> Exportar análisis + petición
                                        </button>
                                    </div>
                                </div>
                            ) : promptComprension ? (
                                /* Estado B — prompt generado, esperando JSON */
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 mb-2">Prompt generado — cópialo al LLM corporativo:</p>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-32 overflow-y-auto">
                                            <pre className="text-[11px] text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">{promptComprension}</pre>
                                        </div>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(promptComprension); toast.success('Copiado al portapapeles'); }}
                                            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#002E6D] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Copy size={12} /> Copiar al portapapeles
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-700 mb-2">Pega aquí el JSON que devolvió el LLM:</p>
                                        <textarea
                                            className="w-full h-32 p-3 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#002E6D] bg-gray-50/50 resize-none"
                                            value={jsonComprension}
                                            onChange={e => setJsonComprension(e.target.value)}
                                            placeholder={'{\n  "tema_central": "...",\n  "peticiones": ["..."],\n  ...\n}'}
                                        />
                                        <button
                                            onClick={handleGuardarComprension}
                                            disabled={guardandoComprension || !jsonComprension.trim()}
                                            className="mt-2 w-full py-2.5 bg-[#002E6D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#001d4a] transition-colors disabled:opacity-50"
                                        >
                                            {guardandoComprension ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                            Guardar análisis → mejorar RAG
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Estado A — sin comprensión */
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                                        Genera un prompt para que el LLM identifique el tema central y las peticiones del documento.<br />
                                        <span className="text-xs text-gray-400">El resultado enriquece la búsqueda de precedentes en el RAG.</span>
                                    </p>
                                    <button
                                        onClick={handleGenerarPromptComprension}
                                        className="px-6 py-2.5 bg-[#002E6D] text-white rounded-xl text-sm font-bold hover:bg-[#001d4a] transition-colors flex items-center gap-2 mx-auto"
                                    >
                                        <Layers size={15} /> Generar prompt de análisis
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

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
                    <PrecedentesRAG
                        sugerencias={sugerencias}
                        loadingSugerencias={loadingSugerencias}
                        handleVerDocumentoCompleto={handleVerDocumentoCompleto}
                    />
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
