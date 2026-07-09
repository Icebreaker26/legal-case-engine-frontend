import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, RefreshCw, BarChart2, Building2, Tag, Layers,
  AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Info,
  FileText, TrendingUp, Clock
} from 'lucide-react';
import apiService from '../../../services/apiService.js';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

const RIESGO_COLOR = {
  alto:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'    },
  medio: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500'  },
  bajo:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500'  },
};

const riesgoStyle = (r) => RIESGO_COLOR[r] ?? { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' };

function RiesgoBadge({ nivel }) {
  const s = riesgoStyle(nivel);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {nivel ?? '—'}
    </span>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

// ── Sección Estadísticas ──────────────────────────────────────────────────────

function SeccionEstadisticas({ data, loading, onIgnorar }) {
  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );

  if (!data) return null;

  const { resumen, por_tipo, top_entidades, top_terminos } = data;

  return (
    <div className="space-y-6">
      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Expedientes', value: resumen?.total_expedientes ?? '—', icon: FileText, color: 'text-green-700' },
          { label: 'Con análisis', value: resumen?.con_analisis ?? '—', icon: BarChart2, color: 'text-blue-600' },
          { label: 'Con embedding', value: resumen?.con_embedding ?? '—', icon: Layers, color: 'text-purple-600' },
          { label: 'Tipos activos', value: por_tipo?.length ?? '—', icon: Tag, color: 'text-amber-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <kpi.icon size={20} className={kpi.color} />
            <div>
              <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Por tipo de instrumento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-green-700" /> Por tipo de instrumento
          </h3>
          {por_tipo?.length > 0 ? (
            <div className="space-y-3">
              {por_tipo.map(t => {
                const total = parseInt(t.total);
                const alto  = parseInt(t.riesgo_alto  || 0);
                const medio = parseInt(t.riesgo_medio || 0);
                const bajo  = parseInt(t.riesgo_bajo  || 0);
                const maxTotal = Math.max(...por_tipo.map(x => parseInt(x.total)));
                const pct = Math.round((total / maxTotal) * 100);
                return (
                  <div key={t.tipo_instrumento}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[60%]">{t.tipo_instrumento}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{total}</span>
                        <span className="text-[10px] text-gray-400">{t.dias_promedio}d prom.</span>
                      </div>
                    </div>
                    {/* Barra de riesgo apilada */}
                    <div className="flex h-2 rounded-full overflow-hidden bg-gray-100" style={{ width: `${pct}%` }}>
                      {alto  > 0 && <div className="bg-red-400"    style={{ width: `${(alto/total)*100}%`  }} />}
                      {medio > 0 && <div className="bg-amber-400"  style={{ width: `${(medio/total)*100}%` }} />}
                      {bajo  > 0 && <div className="bg-green-400"  style={{ width: `${(bajo/total)*100}%`  }} />}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-3 mt-2">
                {[['bg-red-400','Alto'],['bg-amber-400','Medio'],['bg-green-400','Bajo']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1 text-[10px] text-gray-400">
                    <span className={`w-2 h-2 rounded-sm ${c}`}/>{l}
                  </span>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-gray-400">Sin datos suficientes.</p>}
        </div>

        {/* Top entidades */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Building2 size={14} className="text-green-700" /> Entidades más frecuentes
          </h3>
          {top_entidades?.length > 0 ? (
            <div className="space-y-2.5">
              {top_entidades.map((e, i) => (
                <div key={e.nombre} className="flex items-center gap-3">
                  <span className="w-5 text-[11px] font-black text-gray-300 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700 truncate">{e.nombre}</span>
                      <span className="text-xs font-black text-gray-900 ml-2 shrink-0">{e.total}</span>
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      {parseInt(e.riesgo_alto)  > 0 && <span className="text-[10px] text-red-500 font-semibold">{e.riesgo_alto}A</span>}
                      {parseInt(e.riesgo_medio) > 0 && <span className="text-[10px] text-amber-500 font-semibold">{e.riesgo_medio}M</span>}
                      {parseInt(e.riesgo_bajo)  > 0 && <span className="text-[10px] text-green-500 font-semibold">{e.riesgo_bajo}B</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Sin datos suficientes.</p>}
        </div>
      </div>

      {/* Top términos */}
      {top_terminos?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Tag size={14} className="text-green-700" /> Términos más recurrentes en obligaciones
          </h3>
          <div className="flex flex-wrap gap-2">
            {top_terminos.map(t => {
              const max = top_terminos[0].ndoc;
              const size = 10 + Math.round((t.ndoc / max) * 8);
              return (
                <span
                  key={t.word}
                  className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-800 font-semibold"
                  style={{ fontSize: `${size}px` }}
                  title={`${t.ndoc} documentos · ${t.nentry} ocurrencias`}
                >
                  {t.word}
                  <button
                    onClick={() => onIgnorar(t.word)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-green-400 hover:text-red-500 leading-none"
                    title="Ignorar este término"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card de Cluster ───────────────────────────────────────────────────────────

function ClusterCard({ cluster, onVerExpedientes }) {
  const s = riesgoStyle(cluster.nivel_riesgo);
  const tipos = Object.entries(cluster.tipo_distribucion || {}).sort((a, b) => b[1] - a[1]);
  const riesgos = Object.entries(cluster.riesgo_distribucion || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${s.border}`}>
      {/* Franja superior de riesgo */}
      <div className={`h-1 ${cluster.nivel_riesgo === 'alto' ? 'bg-red-400' : cluster.nivel_riesgo === 'medio' ? 'bg-amber-400' : 'bg-green-400'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <RiesgoBadge nivel={cluster.nivel_riesgo} />
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-0.5">
            {cluster.miembros_count} casos
          </span>
        </div>

        {/* Título (expediente representativo) */}
        <p className="text-sm font-bold text-gray-800 leading-snug mb-2 line-clamp-2">
          {cluster.titulo ?? 'Tema sin título'}
        </p>

        {/* Resumen del representativo */}
        {cluster.resumen && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
            {cluster.resumen}
          </p>
        )}

        {/* Distribución por tipo */}
        {tipos.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipos</p>
            <div className="flex flex-wrap gap-1.5">
              {tipos.map(([tipo, cnt]) => (
                <span key={tipo} className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                  {tipo} ({cnt})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Distribución de riesgos */}
        {riesgos.length > 0 && (
          <div className="flex gap-2 mb-4">
            {riesgos.map(([r, cnt]) => {
              const rs = riesgoStyle(r);
              return (
                <span key={r} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rs.bg} ${rs.text} ${rs.border}`}>
                  {r} ×{cnt}
                </span>
              );
            })}
          </div>
        )}

        {/* Acción */}
        <button
          onClick={() => onVerExpedientes(cluster)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-green-700 border border-green-200 rounded-lg py-2 hover:bg-green-50 transition-colors"
        >
          <ExternalLink size={12} /> Ver los {cluster.miembros_count} expedientes
        </button>
      </div>
    </div>
  );
}

// ── Drawer de expedientes del cluster ────────────────────────────────────────

function ClusterDrawer({ cluster, onClose }) {
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cluster) return;
    const ids = cluster.expediente_ids || [];
    if (!ids.length) { setLoading(false); return; }

    Promise.all(ids.map(id => apiService.get(`/ambiental/expedientes/${id}`).then(r => r.data).catch(() => null)))
      .then(results => setExpedientes(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [cluster]);

  if (!cluster) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expedientes del tema</p>
            <p className="text-sm font-bold text-gray-800 line-clamp-1">{cluster.titulo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-xl font-light">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : expedientes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin expedientes disponibles.</p>
          ) : expedientes.map(exp => (
            <button
              key={exp.id}
              onClick={() => navigate(`/ambiental/expediente/${exp.id}`)}
              className="w-full text-left bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl p-4 transition-colors"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{exp.titulo}</p>
                <RiesgoBadge nivel={exp.nivel_riesgo} />
              </div>
              <p className="text-[11px] text-gray-400">{exp.tipo_instrumento} · {exp.entidad_nombre}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BibliotecaAmbiental() {
  const [estadisticas, setEstadisticas] = useState(null);
  const [clustersData, setClustersData]   = useState(null);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [recalculando, setRecalculando]   = useState(false);
  const [clusterSeleccionado, setClusterSeleccionado] = useState(null);
  const [terminosIgnorados, setTerminosIgnorados] = useState([]);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const res = await apiService.get('/ambiental/biblioteca/estadisticas');
      setEstadisticas(res.data);
    } catch {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const cargarClusters = useCallback(async () => {
    try {
      const res = await apiService.get('/ambiental/biblioteca/clusters');
      setClustersData(res.data);
    } catch {
      toast.error('Error al cargar clusters');
    } finally {
      setLoadingClusters(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
    cargarClusters();
    apiService.get('/ambiental/biblioteca/terminos-ignorados')
      .then(r => setTerminosIgnorados(r.data.map(t => t.word)))
      .catch(() => {});
  }, [cargarEstadisticas, cargarClusters]);

  const ignorarTermino = async (word) => {
    try {
      await apiService.post('/ambiental/biblioteca/terminos-ignorados', { word });
      setTerminosIgnorados(prev => [...prev, word]);
      setEstadisticas(prev => prev ? {
        ...prev,
        top_terminos: prev.top_terminos.filter(t => t.word !== word),
      } : prev);
      toast.success(`"${word}" ignorado. Ya no aparecerá en la nube.`, {
        duration: 4000,
        icon: '🚫',
      });
    } catch {
      toast.error('Error al ignorar el término');
    }
  };

  const recalcular = async () => {
    setRecalculando(true);
    try {
      const res = await apiService.post('/ambiental/biblioteca/recalcular');
      toast.success(`${res.data.clusters} temas generados a partir de ${res.data.expedientes} expedientes`);
      setLoadingClusters(true);
      await cargarClusters();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al recalcular');
    } finally {
      setRecalculando(false);
    }
  };

  const needsRecalculate = clustersData?.needs_recalculate;
  const clusters = clustersData?.clusters ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen size={20} className="text-green-700" /> Biblioteca de Conocimiento
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Patrones y temas emergentes derivados automáticamente del corpus de expedientes
          </p>
        </div>

        {needsRecalculate && (
          <button
            onClick={recalcular}
            disabled={recalculando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw size={14} className={recalculando ? 'animate-spin' : ''} />
            {recalculando ? 'Analizando...' : 'Actualizar conocimiento'}
          </button>
        )}
      </div>

      {/* Banner informativo si nunca se han calculado clusters */}
      {!loadingClusters && clusters.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">El análisis semántico aún no está disponible</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Se necesitan al menos 3 expedientes con embeddings generados. Una vez disponibles, usa el botón <strong>"Actualizar conocimiento"</strong> para calcular los temas emergentes.
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas del corpus */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Panorama del corpus</h2>
        <SeccionEstadisticas data={estadisticas} loading={loadingStats} onIgnorar={ignorarTermino} />
      </section>

      {/* Temas emergentes (clusters) */}
      {(loadingClusters || clusters.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Temas emergentes</h2>
            {clustersData?.meta?.last_computed_at && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Clock size={11} />
                Actualizado {new Date(clustersData.meta.last_computed_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {loadingClusters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {clusters.map(c => (
                <ClusterCard
                  key={c.id}
                  cluster={c}
                  onVerExpedientes={setClusterSeleccionado}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Drawer de expedientes del cluster */}
      <ClusterDrawer
        cluster={clusterSeleccionado}
        onClose={() => setClusterSeleccionado(null)}
      />
    </div>
  );
}
