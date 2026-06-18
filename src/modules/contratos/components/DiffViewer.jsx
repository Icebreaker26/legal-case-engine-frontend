import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import { GitCompare, Plus, Minus, Equal, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function DiffViewer({ auditoriaId }) {
    const [partes, setPartes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandido, setExpandido] = useState(true);
    const [solocambios, setSoloCambios] = useState(false);

    useEffect(() => {
        const fetchDiff = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await apiService.get(`/contratos/auditorias/${auditoriaId}/diff`);
                setPartes(data.partes);
            } catch (err) {
                const msg = err.response?.data?.error || 'Error al cargar la comparativa';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchDiff();
    }, [auditoriaId]);

    const stats = partes.reduce(
        (acc, p) => {
            if (p.added) acc.agregadas += 1;
            else if (p.removed) acc.eliminadas += 1;
            return acc;
        },
        { agregadas: 0, eliminadas: 0 }
    );

    const partesVisibles = solocambios ? partes.filter(p => p.added || p.removed) : partes;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <GitCompare size={18} className="text-pink-600" />
                    <h3 className="font-bold text-gray-800 text-sm">Comparativa de Documentos</h3>
                    {!loading && partes.length > 0 && (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                <Plus size={10} /> {stats.agregadas} párr. agregados
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                <Minus size={10} /> {stats.eliminadas} párr. eliminados
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {!loading && partes.length > 0 && (
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={solocambios}
                                onChange={e => setSoloCambios(e.target.checked)}
                                className="rounded accent-pink-600"
                            />
                            Solo cambios
                        </label>
                    )}
                    <button
                        onClick={() => setExpandido(v => !v)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {expandido && (
                <div className="p-5">
                    {loading && (
                        <div className="flex items-center justify-center py-12 gap-3">
                            <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-400">Calculando diferencias...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    {!loading && !error && partes.length > 0 && (
                        <>
                            {/* Leyenda */}
                            <div className="flex flex-wrap gap-4 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" /> Agregado por tercero</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" /> Eliminado del estándar</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200 inline-block" /> Sin cambios</span>
                            </div>

                            {/* Diff — una card por párrafo */}
                            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                {partesVisibles.map((parte, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded-xl border-l-4 px-4 py-3 text-sm leading-relaxed ${
                                            parte.added
                                                ? 'bg-green-50 border-green-400 text-green-900'
                                                : parte.removed
                                                ? 'bg-red-50 border-red-400 text-red-900'
                                                : 'bg-gray-50 border-transparent text-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`shrink-0 mt-0.5 ${
                                                parte.added ? 'text-green-500' : parte.removed ? 'text-red-400' : 'text-gray-300'
                                            }`}>
                                                {parte.added ? <Plus size={13} /> : parte.removed ? <Minus size={13} /> : <Equal size={13} />}
                                            </span>
                                            <pre className={`flex-1 whitespace-pre-wrap break-words font-sans ${
                                                parte.removed ? 'line-through opacity-80' : ''
                                            }`}>
                                                {parte.value}
                                            </pre>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {!loading && !error && partes.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <GitCompare size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-bold">No hay diferencias entre los documentos</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
