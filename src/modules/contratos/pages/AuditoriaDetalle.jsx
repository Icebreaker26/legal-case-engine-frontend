import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import {
    ArrowLeft, GitCompare, ClipboardPaste, Clock,
    Copy, CheckCircle, AlertCircle, Calendar, FileText, Download
} from 'lucide-react';
import { generarInformeAuditoria } from '../utils/generarInformeAuditoria';
import DiffViewer from '../components/DiffViewer';
import SearchableSelect from '../components/SearchableSelect';

const ESTADOS = ['Pendiente', 'En revisión', 'Completado', 'Archivado'];

const estadoColors = {
    'Pendiente': 'bg-orange-100 text-orange-700',
    'En revisión': 'bg-blue-100 text-blue-700',
    'Completado': 'bg-green-100 text-green-700',
    'Archivado': 'bg-gray-100 text-gray-600',
};

export default function AuditoriaDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [auditoria, setAuditoria] = useState(null);
    const [minutas, setMinutas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('comparacion');

    // Tab 1 — Comparación
    const [minutaSeleccionada, setMinutaSeleccionada] = useState('');
    const [generando, setGenerando] = useState(false);
    const [promptGenerado, setPromptGenerado] = useState('');
    const [copiado, setCopiado] = useState(false);

    // Tab 2 — Resultados
    const [resultadoLlm, setResultadoLlm] = useState('');
    const [jsonLlm, setJsonLlm] = useState('');
    const [resultadoJson, setResultadoJson] = useState(null);
    const [guardandoJson, setGuardandoJson] = useState(false);

    // Tab 3 — Seguimiento
    const [estado, setEstado] = useState('Pendiente');
    const [fechaSeguimiento, setFechaSeguimiento] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [{ data: aud }, { data: mins }] = await Promise.all([
                    apiService.get(`/contratos/auditorias/${id}`),
                    apiService.get('/contratos/minutas'),
                ]);
                setAuditoria(aud);
                setMinutas(mins);
                setPromptGenerado(aud.prompt_generado || '');
                setResultadoLlm(aud.resultado_llm_texto || '');
                if (aud.resultado_llm_json) setResultadoJson(aud.resultado_llm_json);
                setEstado(aud.estado_seguimiento || 'Pendiente');
                setFechaSeguimiento(aud.fecha_seguimiento ? aud.fecha_seguimiento.split('T')[0] : '');
                if (aud.minuta_estandar_id) setMinutaSeleccionada(aud.minuta_estandar_id);
            } catch {
                toast.error('Error al cargar la auditoría');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleRegenerarPrompt = async () => {
        if (!minutaSeleccionada) return toast.error('Selecciona una minuta estándar');
        setGenerando(true);
        try {
            const { data } = await apiService.post(`/contratos/auditorias/${id}/regenerar-prompt`, {
                minuta_estandar_id: minutaSeleccionada,
            });
            setPromptGenerado(data.prompt);
            toast.success('Prompt regenerado');
        } catch {
            toast.error('Error al generar el prompt');
        } finally {
            setGenerando(false);
        }
    };

    const handleCopiarPrompt = () => {
        navigator.clipboard.writeText(promptGenerado);
        setCopiado(true);
        toast.success('Prompt copiado al portapapeles');
        setTimeout(() => setCopiado(false), 2500);
    };

    const handleGuardarResultado = async () => {
        setSaving(true);
        try {
            await apiService.patch(`/contratos/auditorias/${id}`, {
                resultado_llm_texto: resultadoLlm,
            });
            toast.success('Resultado guardado');
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleGuardarJson = async () => {
        let parsed;
        try {
            parsed = JSON.parse(jsonLlm);
        } catch {
            toast.error('JSON inválido — verifica la respuesta del LLM');
            return;
        }
        setGuardandoJson(true);
        try {
            await apiService.patch(`/contratos/auditorias/${id}`, {
                resultado_llm_json: parsed,
            });
            setResultadoJson(parsed);
            setJsonLlm('');
            toast.success('Análisis guardado correctamente');
        } catch {
            toast.error('Error al guardar el análisis');
        } finally {
            setGuardandoJson(false);
        }
    };

    const handleGuardarSeguimiento = async () => {
        setSaving(true);
        try {
            await apiService.patch(`/contratos/auditorias/${id}`, {
                estado_seguimiento: estado,
                fecha_seguimiento: fechaSeguimiento || null,
            });
            setAuditoria(prev => ({ ...prev, estado_seguimiento: estado, fecha_seguimiento: fechaSeguimiento }));
            toast.success('Seguimiento actualizado');
        } catch {
            toast.error('Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { key: 'comparacion', label: 'Comparación', icon: <GitCompare size={15} /> },
        { key: 'resultados', label: 'Resultados', icon: <ClipboardPaste size={15} /> },
        { key: 'seguimiento', label: 'Seguimiento', icon: <Clock size={15} /> },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!auditoria) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={() => navigate('/contratos')}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 mb-3 transition-colors"
                    >
                        <ArrowLeft size={16} /> Volver al Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">{auditoria.minuta_titulo || 'Auditoría Contractual'}</h1>
                    <p className="text-sm text-gray-500 mt-1">Tercero: <span className="font-semibold">{auditoria.tercero_nombre}</span></p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${estadoColors[auditoria.estado_seguimiento] || 'bg-gray-100 text-gray-600'}`}>
                    {auditoria.estado_seguimiento || 'Pendiente'}
                </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl shadow-inner overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'bg-white text-pink-600 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══ TAB 1: COMPARACIÓN ═══ */}
            {activeTab === 'comparacion' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Banner de resultado si ya fue analizado */}
                    {resultadoJson && (
                        <div className={`rounded-2xl border-2 p-5 ${
                            resultadoJson.nivel_riesgo === 'Alto'  ? 'border-red-300 bg-red-50' :
                            resultadoJson.nivel_riesgo === 'Medio' ? 'border-amber-300 bg-amber-50' :
                            'border-green-300 bg-green-50'
                        }`}>
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <span className={`text-2xl font-black ${
                                        resultadoJson.nivel_riesgo === 'Alto'  ? 'text-red-600' :
                                        resultadoJson.nivel_riesgo === 'Medio' ? 'text-amber-600' :
                                        'text-green-600'
                                    }`}>
                                        {resultadoJson.nivel_riesgo === 'Alto' ? '⚠' : resultadoJson.nivel_riesgo === 'Medio' ? '◆' : '✓'}
                                    </span>
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-widest ${
                                            resultadoJson.nivel_riesgo === 'Alto'  ? 'text-red-500' :
                                            resultadoJson.nivel_riesgo === 'Medio' ? 'text-amber-500' :
                                            'text-green-500'
                                        }`}>Nivel de Riesgo</p>
                                        <p className={`text-xl font-black ${
                                            resultadoJson.nivel_riesgo === 'Alto'  ? 'text-red-700' :
                                            resultadoJson.nivel_riesgo === 'Medio' ? 'text-amber-700' :
                                            'text-green-700'
                                        }`}>{resultadoJson.nivel_riesgo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 font-semibold">
                                        {resultadoJson.cambios?.length || 0} cambio{resultadoJson.cambios?.length !== 1 ? 's' : ''} detectado{resultadoJson.cambios?.length !== 1 ? 's' : ''}
                                    </span>
                                    <button
                                        onClick={() => generarInformeAuditoria({ ...auditoria, resultado_llm_json: resultadoJson })}
                                        className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-pink-700 transition-colors"
                                    >
                                        <Download size={14} /> Exportar PDF
                                    </button>
                                </div>
                            </div>
                            {resultadoJson.justificacion_riesgo && (
                                <p className="text-sm text-gray-600 mt-3 border-t border-black/10 pt-3">{resultadoJson.justificacion_riesgo}</p>
                            )}
                            {/* Mini tabla resumen */}
                            {resultadoJson.cambios?.length > 0 && (
                                <div className="mt-3 overflow-x-auto">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-black/10">
                                                <th className="text-left py-1.5 px-2 text-gray-500 font-bold">#</th>
                                                <th className="text-left py-1.5 px-2 text-gray-500 font-bold">Cláusula</th>
                                                <th className="text-left py-1.5 px-2 text-gray-500 font-bold">Tipo</th>
                                                <th className="text-left py-1.5 px-2 text-gray-500 font-bold">Recomendación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultadoJson.cambios.map((c, i) => (
                                                <tr key={i} className="border-b border-black/5">
                                                    <td className="py-1.5 px-2 text-gray-400 font-bold">{c.numero}</td>
                                                    <td className="py-1.5 px-2 text-gray-700 font-semibold">{c.clausula}</td>
                                                    <td className="py-1.5 px-2 text-gray-500">{c.tipo}</td>
                                                    <td className={`py-1.5 px-2 font-bold ${
                                                        c.recomendacion === 'Rechazar' ? 'text-red-600' :
                                                        c.recomendacion === 'Aceptar'  ? 'text-green-600' :
                                                        'text-amber-600'
                                                    }`}>{c.recomendacion}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    <DiffViewer auditoriaId={id} />
                </div>
            )}

            {/* ═══ TAB 2: RESULTADOS ═══ */}
            {activeTab === 'resultados' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Generar prompt */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <GitCompare size={18} className="text-pink-600" /> Generar Prompt de Comparación
                        </h3>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                                Minuta Estándar de Referencia
                            </label>
                            <SearchableSelect
                                options={minutas.map(m => ({
                                    value: m.id,
                                    label: m.titulo,
                                    sub: m.tipo_contrato,
                                }))}
                                value={minutaSeleccionada}
                                onChange={setMinutaSeleccionada}
                                placeholder="Selecciona una minuta..."
                                noResultsText="No hay minutas con ese nombre"
                            />
                        </div>

                        <button
                            onClick={handleRegenerarPrompt}
                            disabled={generando || !minutaSeleccionada}
                            className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-pink-700 disabled:opacity-50 transition-colors"
                        >
                            <GitCompare size={16} />
                            {generando ? 'Generando...' : 'Generar / Regenerar Prompt'}
                        </button>

                        {promptGenerado && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={13} className="text-pink-600" /> Prompt generado
                                    </p>
                                    <button
                                        onClick={handleCopiarPrompt}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                            copiado ? 'bg-green-100 text-green-700' : 'bg-pink-600 text-white hover:bg-pink-700'
                                        }`}
                                    >
                                        {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
                                        {copiado ? 'Copiado' : 'Copiar Prompt'}
                                    </button>
                                </div>
                                <pre className="text-xs bg-gray-50 border border-gray-200 p-5 rounded-xl h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
                                    {promptGenerado}
                                </pre>
                            </div>
                        )}
                    </div>

                    {/* Panel pegar JSON */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardPaste size={18} className="text-pink-600" /> Pegar respuesta del LLM (JSON)
                        </h3>

                        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle size={16} className="text-pink-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-pink-700">
                                Genera el prompt arriba, pégalo en Copilot y pega aquí el JSON que responda.
                            </p>
                        </div>

                        <textarea
                            className="w-full h-48 p-4 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-pink-500 resize-y leading-relaxed font-mono"
                            placeholder='{"nivel_riesgo": "Alto", "cambios": [...]}'
                            value={jsonLlm}
                            onChange={e => setJsonLlm(e.target.value)}
                        />

                        <button
                            onClick={handleGuardarJson}
                            disabled={guardandoJson || !jsonLlm.trim()}
                            className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-pink-700 disabled:opacity-50 transition-colors"
                        >
                            <CheckCircle size={16} />
                            {guardandoJson ? 'Guardando...' : 'Guardar análisis'}
                        </button>
                    </div>

                    {/* Resultado guardado */}
                    {resultadoJson && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-600" /> Análisis guardado
                                </h3>
                                <button
                                    onClick={() => generarInformeAuditoria({ ...auditoria, resultado_llm_json: resultadoJson })}
                                    className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:border-pink-300 hover:text-pink-600 transition-colors"
                                >
                                    <Download size={15} /> Exportar PDF
                                </button>
                            </div>

                            {/* Resumen nivel riesgo */}
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                                resultadoJson.nivel_riesgo === 'Alto'  ? 'bg-red-100 text-red-700' :
                                resultadoJson.nivel_riesgo === 'Medio' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                                Riesgo {resultadoJson.nivel_riesgo}
                            </div>
                            {resultadoJson.justificacion_riesgo && (
                                <p className="text-sm text-gray-600">{resultadoJson.justificacion_riesgo}</p>
                            )}

                            {/* Tabla de cambios */}
                            {resultadoJson.cambios?.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-pink-600 text-white">
                                                <th className="px-3 py-2 text-left w-8">#</th>
                                                <th className="px-3 py-2 text-left">Cláusula</th>
                                                <th className="px-3 py-2 text-left w-24">Tipo</th>
                                                <th className="px-3 py-2 text-left">Impacto</th>
                                                <th className="px-3 py-2 text-left w-24">Recomendación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultadoJson.cambios.map((c, i) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-3 py-2 text-center font-bold text-gray-500">{c.numero}</td>
                                                    <td className="px-3 py-2 font-semibold text-gray-800">{c.clausula}</td>
                                                    <td className="px-3 py-2 text-gray-600">{c.tipo}</td>
                                                    <td className="px-3 py-2 text-gray-600">{c.impacto}</td>
                                                    <td className={`px-3 py-2 font-bold ${
                                                        c.recomendacion === 'Rechazar' ? 'text-red-600' :
                                                        c.recomendacion === 'Aceptar'  ? 'text-green-600' :
                                                        'text-amber-600'
                                                    }`}>{c.recomendacion}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 3: SEGUIMIENTO ═══ */}
            {activeTab === 'seguimiento' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Clock size={18} className="text-pink-600" /> Estado y Trazabilidad
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                                    Estado del proceso
                                </label>
                                <select
                                    className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-pink-500"
                                    value={estado}
                                    onChange={e => setEstado(e.target.value)}
                                >
                                    {ESTADOS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                                    <Calendar size={12} /> Fecha de seguimiento
                                </label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-pink-500"
                                    value={fechaSeguimiento}
                                    onChange={e => setFechaSeguimiento(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleGuardarSeguimiento}
                                disabled={saving}
                                className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-pink-700 disabled:opacity-50 transition-colors"
                            >
                                <CheckCircle size={16} />
                                {saving ? 'Guardando...' : 'Actualizar Seguimiento'}
                            </button>
                            <button
                                onClick={() => generarInformeAuditoria({ ...auditoria, resultado_llm_json: resultadoJson, resultado_llm_texto: resultadoLlm, estado_seguimiento: estado, fecha_seguimiento: fechaSeguimiento })}
                                disabled={!resultadoJson && !resultadoLlm.trim()}
                                title={!resultadoJson && !resultadoLlm.trim() ? 'Primero registra el resultado del análisis en la pestaña Resultados' : ''}
                                className="flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-bold hover:border-pink-300 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Download size={16} /> Exportar PDF
                            </button>
                        </div>
                    </div>

                    {/* Info de la auditoría */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-widest">Información del Registro</h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            <div>
                                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tercero</dt>
                                <dd className="text-gray-800 font-semibold mt-0.5">{auditoria.tercero_nombre || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Minuta de referencia</dt>
                                <dd className="text-gray-800 font-semibold mt-0.5">{auditoria.minuta_titulo || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Creado por</dt>
                                <dd className="text-gray-800 font-semibold mt-0.5">{auditoria.creado_por_nombre || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha de creación</dt>
                                <dd className="text-gray-800 font-semibold mt-0.5">
                                    {auditoria.created_at ? new Date(auditoria.created_at).toLocaleDateString() : '—'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
}
