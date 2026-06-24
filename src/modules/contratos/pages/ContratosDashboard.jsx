import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
    Plus, Search, FileText, Clock, CheckCircle,
    AlertCircle, Archive, TrendingUp, Calendar, ChevronRight,
    BarChart2, X
} from 'lucide-react';
import HelpButton from '../../../components/HelpButton';
import toast from 'react-hot-toast';

const ESTADOS = ['Todos', 'Pendiente', 'En revisión', 'Completado', 'Archivado'];

const estadoConfig = {
    'Pendiente':   { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', icon: <Clock size={12} /> },
    'En revisión': { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400',   icon: <AlertCircle size={12} /> },
    'Completado':  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400',  icon: <CheckCircle size={12} /> },
    'Archivado':   { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400',   icon: <Archive size={12} /> },
};

function EstadoBadge({ estado }) {
    const cfg = estadoConfig[estado] || estadoConfig['Pendiente'];
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            {cfg.icon} {estado || 'Pendiente'}
        </span>
    );
}

function StatCard({ label, value, sub, color, icon }) {
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4`}>
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black text-gray-800">{value}</p>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
                {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

export default function ContratosDashboard() {
    const [auditorias, setAuditorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await apiService.get('/contratos/auditorias');
                setAuditorias(data);
            } catch {
                toast.error('Error al cargar auditorías');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    // ── Estadísticas ──────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = auditorias.length;
        const pendientes = auditorias.filter(a => (a.estado_seguimiento || 'Pendiente') === 'Pendiente').length;
        const enRevision = auditorias.filter(a => a.estado_seguimiento === 'En revisión').length;
        const completadas = auditorias.filter(a => a.estado_seguimiento === 'Completado').length;
        const archivadas = auditorias.filter(a => a.estado_seguimiento === 'Archivado').length;

        // Terceros únicos
        const tercerosUnicos = new Set(auditorias.map(a => a.tercero_nombre)).size;

        // Auditorías este mes
        const ahora = new Date();
        const esteMes = auditorias.filter(a => {
            const d = new Date(a.created_at);
            return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
        }).length;

        // Distribución por minuta (top 3)
        const porMinuta = auditorias.reduce((acc, a) => {
            acc[a.minuta_titulo] = (acc[a.minuta_titulo] || 0) + 1;
            return acc;
        }, {});
        const topMinutas = Object.entries(porMinuta)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return { total, pendientes, enRevision, completadas, archivadas, tercerosUnicos, esteMes, topMinutas };
    }, [auditorias]);

    // ── Filtros ───────────────────────────────────────────────────
    const auditoriasFiltradas = useMemo(() => {
        return auditorias.filter(a => {
            const coincideBusqueda =
                !busqueda ||
                a.minuta_titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                a.tercero_nombre?.toLowerCase().includes(busqueda.toLowerCase());

            const coincideEstado =
                filtroEstado === 'Todos' ||
                (a.estado_seguimiento || 'Pendiente') === filtroEstado;

            return coincideBusqueda && coincideEstado;
        });
    }, [auditorias, busqueda, filtroEstado]);

    const hayFiltros = busqueda || filtroEstado !== 'Todos';

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800">Auditoría Contractual</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Gestión y seguimiento de contratos de terceros</p>
                    </div>
                    <HelpButton
                        title="Cómo usar el módulo de Contratos"
                        color="text-pink-600"
                        tips={[
                            'Sube el contrato del tercero (PDF o DOCX) y selecciona la minuta estándar a comparar.',
                            'El sistema detecta automáticamente las diferencias párrafo a párrafo.',
                            'Genera el prompt de análisis para la herramienta corporativa de IA y pega el resultado.',
                            'Exporta el informe PDF con todas las desviaciones identificadas y su análisis.',
                        ]}
                        sections={[
                            {
                                title: '¿Qué hace este módulo?',
                                content: (
                                    <p>
                                        Este módulo permite auditar contratos que envían terceros (proveedores, contratistas, socios)
                                        comparándolos contra las minutas estándar aprobadas por el área jurídica. El sistema identifica
                                        automáticamente qué cláusulas fueron modificadas, eliminadas o agregadas, generando un informe
                                        de desviaciones que facilita la negociación y aprobación contractual.
                                    </p>
                                )
                            },
                            {
                                title: 'Paso 1 — Crear una nueva auditoría',
                                content: (
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Haz clic en <b>Nueva Auditoría</b> en la parte superior derecha.</li>
                                        <li>Sube el archivo del contrato del tercero en formato PDF o DOCX.</li>
                                        <li>Escribe el nombre del tercero (empresa o persona que envió el contrato).</li>
                                        <li>Selecciona la <b>minuta estándar</b> que corresponde al tipo de contrato.</li>
                                        <li>Guarda — el sistema procesará el documento y lo dejará listo para analizar.</li>
                                    </ol>
                                )
                            },
                            {
                                title: 'Paso 2 — Revisar el diff de diferencias',
                                content: (
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Abre el detalle de la auditoría creada.</li>
                                        <li>El sistema muestra párrafo a párrafo las diferencias entre el contrato del tercero y la minuta.</li>
                                        <li>Los párrafos en <b>rojo</b> fueron eliminados de la minuta; los en <b>verde</b> fueron agregados por el tercero; los en <b>amarillo</b> fueron modificados.</li>
                                        <li>Puedes agregar comentarios internos a cada párrafo con observaciones para la negociación.</li>
                                    </ol>
                                )
                            },
                            {
                                title: 'Paso 3 — Análisis con herramienta de IA',
                                content: (
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Haz clic en <b>Generar prompt de análisis</b> — el sistema construye un prompt estructurado con todas las diferencias.</li>
                                        <li>Copia el prompt y pégalo en la herramienta corporativa de inteligencia artificial.</li>
                                        <li>La IA analizará los riesgos jurídicos de cada desviación.</li>
                                        <li>Copia la respuesta de la IA y pégala de vuelta en el campo correspondiente del sistema.</li>
                                    </ol>
                                )
                            },
                            {
                                title: 'Paso 4 — Exportar el informe',
                                content: (
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Con el análisis completo, haz clic en <b>Exportar informe PDF</b>.</li>
                                        <li>El PDF incluye: resumen ejecutivo, tabla de desviaciones, análisis de riesgo y recomendaciones.</li>
                                        <li>Cambia el estado de la auditoría a <b>Completado</b> para indicar que fue revisada.</li>
                                        <li>Usa <b>Archivado</b> para contratos ya negociados y cerrados, manteniéndolos en el historial.</li>
                                    </ol>
                                )
                            },
                            {
                                title: 'Gestión de minutas estándar',
                                content: (
                                    <p>
                                        Las minutas son los contratos modelo aprobados por el área. Se administran desde <b>Gestión de Minutas</b>
                                        en el menú lateral. Solo usuarios con permiso <b>WRITE</b> pueden crear o modificar minutas.
                                        Es importante mantenerlas actualizadas: cada vez que el área apruebe una nueva versión de un contrato tipo,
                                        debe actualizarse la minuta correspondiente en el sistema.
                                    </p>
                                )
                            }
                        ]}
                    />
                </div>
                <button
                    onClick={() => navigate('/contratos/nueva')}
                    className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-sm"
                >
                    <Plus size={18} /> Nueva Auditoría
                </button>
            </div>

            {/* ── KPIs ── */}
            {!loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total auditorías"
                        value={stats.total}
                        sub={`${stats.esteMes} este mes`}
                        color="bg-pink-50 text-pink-600"
                        icon={<FileText size={20} />}
                    />
                    <StatCard
                        label="Pendientes"
                        value={stats.pendientes}
                        sub={stats.total ? `${Math.round(stats.pendientes / stats.total * 100)}% del total` : '—'}
                        color="bg-orange-50 text-orange-500"
                        icon={<Clock size={20} />}
                    />
                    <StatCard
                        label="Completadas"
                        value={stats.completadas}
                        sub={stats.enRevision > 0 ? `${stats.enRevision} en revisión` : 'Sin revisiones activas'}
                        color="bg-green-50 text-green-600"
                        icon={<CheckCircle size={20} />}
                    />
                    <StatCard
                        label="Terceros distintos"
                        value={stats.tercerosUnicos}
                        sub="entidades evaluadas"
                        color="bg-blue-50 text-blue-600"
                        icon={<TrendingUp size={20} />}
                    />
                </div>
            )}

            {/* ── Fila: Distribución por estado + Top minutas ── */}
            {!loading && stats.total > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Barra de distribución por estado */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <BarChart2 size={14} /> Distribución por estado
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Pendiente',   val: stats.pendientes,  cfg: estadoConfig['Pendiente'] },
                                { label: 'En revisión', val: stats.enRevision,  cfg: estadoConfig['En revisión'] },
                                { label: 'Completado',  val: stats.completadas, cfg: estadoConfig['Completado'] },
                                { label: 'Archivado',   val: stats.archivadas,  cfg: estadoConfig['Archivado'] },
                            ].map(({ label, val, cfg }) => {
                                const pct = stats.total ? Math.round(val / stats.total * 100) : 0;
                                return (
                                    <div key={label}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-xs font-bold ${cfg.text}`}>{label}</span>
                                            <span className="text-xs text-gray-400">{val} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${cfg.dot}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top minutas más auditadas */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText size={14} /> Minutas más auditadas
                        </h3>
                        {stats.topMinutas.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Sin datos</p>
                        ) : (
                            <div className="space-y-3">
                                {stats.topMinutas.map(([titulo, cantidad], i) => {
                                    const pct = stats.total ? Math.round(cantidad / stats.total * 100) : 0;
                                    const colores = ['bg-pink-400', 'bg-purple-400', 'bg-blue-400'];
                                    return (
                                        <div key={titulo}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-semibold text-gray-700 truncate max-w-[70%]" title={titulo}>
                                                    {i + 1}. {titulo}
                                                </span>
                                                <span className="text-xs text-gray-400">{cantidad} uso{cantidad !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${colores[i]}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Buscador + Filtros ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por minuta o tercero..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-pink-500 transition-shadow"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {ESTADOS.map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                filtroEstado === estado
                                    ? 'bg-pink-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-600'
                            }`}
                        >
                            {estado}
                            {estado !== 'Todos' && (
                                <span className="ml-1.5 opacity-70">
                                    ({auditorias.filter(a => (a.estado_seguimiento || 'Pendiente') === estado).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Lista ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                    <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Cargando auditorías...</span>
                </div>
            ) : auditoriasFiltradas.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="font-bold text-gray-400">
                        {hayFiltros ? 'No hay resultados para estos filtros' : 'No hay auditorías registradas'}
                    </p>
                    {hayFiltros ? (
                        <button onClick={() => { setBusqueda(''); setFiltroEstado('Todos'); }} className="mt-3 text-sm text-pink-600 hover:underline">
                            Limpiar filtros
                        </button>
                    ) : (
                        <button onClick={() => navigate('/contratos/nueva')} className="mt-3 text-sm text-pink-600 hover:underline">
                            Crear la primera auditoría
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <p className="text-xs text-gray-400 -mt-4">
                        Mostrando {auditoriasFiltradas.length} de {auditorias.length} auditorías
                        {hayFiltros && <button onClick={() => { setBusqueda(''); setFiltroEstado('Todos'); }} className="ml-2 text-pink-500 hover:underline">limpiar filtros</button>}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {auditoriasFiltradas.map(aud => {
                            const cfg = estadoConfig[aud.estado_seguimiento] || estadoConfig['Pendiente'];
                            return (
                                <div
                                    key={aud.id}
                                    onClick={() => navigate(`/contratos/auditoria/${aud.id}`)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-pink-200 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                                        <EstadoBadge estado={aud.estado_seguimiento || 'Pendiente'} />
                                    </div>

                                    <h3 className="font-bold text-gray-800 leading-snug mb-1 group-hover:text-pink-600 transition-colors line-clamp-2">
                                        {aud.minuta_titulo}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4 truncate">
                                        Tercero: <span className="font-semibold">{aud.tercero_nombre}</span>
                                    </p>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                            <Calendar size={11} />
                                            {new Date(aud.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-500 transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

        </div>
    );
}
