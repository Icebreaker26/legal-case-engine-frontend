import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, RefreshCw, BarChart2, Building2, Tag, Layers,
  ExternalLink, Info, FileText, TrendingUp, Clock, Network,
  Scale, ChevronDown, ChevronRight, Filter
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

// ── Scatter Plot PCA ─────────────────────────────────────────────────────────

const CLUSTER_PALETTE = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6',
];

function ScatterPlot({ puntos, clusters, onClickPunto }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, punto }

  if (!puntos?.length) return null;

  const W = 700, H = 420;
  const PAD = 40;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  // Mapa cluster_index → label del representativo
  const clusterLabel = {};
  clusters?.forEach(c => { clusterLabel[c.cluster_index] = c.titulo; });

  // Calcular centroides 2D de cada cluster (promedio de puntos miembros)
  const centroidMap = {};
  puntos.forEach(p => {
    if (!centroidMap[p.cluster_index]) centroidMap[p.cluster_index] = { sx: 0, sy: 0, n: 0 };
    centroidMap[p.cluster_index].sx += p.x;
    centroidMap[p.cluster_index].sy += p.y;
    centroidMap[p.cluster_index].n  += 1;
  });

  const toSvg = (nx, ny) => ({
    cx: PAD + nx * innerW,
    cy: PAD + (1 - ny) * innerH, // invertir Y para que "arriba" sea mayor
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-1 flex items-center gap-2">
        <Network size={14} className="text-green-700" /> Mapa semántico del corpus
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Cada punto es un expediente. La distancia refleja similitud semántica — los más cercanos comparten contenido parecido. Proyección PCA 2D.
      </p>

      {/* Leyenda de clusters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {clusters?.map(c => (
          <span key={c.cluster_index} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: CLUSTER_PALETTE[c.cluster_index % CLUSTER_PALETTE.length] }}
            />
            <span className="truncate max-w-[160px]" title={c.titulo}>{c.titulo ?? `Tema ${c.cluster_index + 1}`}</span>
            <span className="text-gray-400 font-normal">({c.miembros_count})</span>
          </span>
        ))}
      </div>

      {/* SVG scroll horizontal en mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 320, maxWidth: W }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid suave */}
          {[0.25, 0.5, 0.75].map(t => (
            <g key={t}>
              <line
                x1={PAD} y1={PAD + t * innerH}
                x2={PAD + innerW} y2={PAD + t * innerH}
                stroke="#f1f5f9" strokeWidth="1"
              />
              <line
                x1={PAD + t * innerW} y1={PAD}
                x2={PAD + t * innerW} y2={PAD + innerH}
                stroke="#f1f5f9" strokeWidth="1"
              />
            </g>
          ))}

          {/* Bordes del área */}
          <rect
            x={PAD} y={PAD} width={innerW} height={innerH}
            fill="none" stroke="#e2e8f0" strokeWidth="1" rx="4"
          />

          {/* Elipses de zona por cluster (convex hull aproximado con círculo) */}
          {Object.entries(centroidMap).map(([idx, { sx, sy, n }]) => {
            const ci = parseInt(idx);
            const color = CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length];
            const { cx, cy } = toSvg(sx / n, sy / n);

            // Radio: promedio de distancias de miembros al centroide visual
            const miembros = puntos.filter(p => p.cluster_index === ci);
            const avgR = miembros.reduce((sum, p) => {
              const { cx: px, cy: py } = toSvg(p.x, p.y);
              return sum + Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
            }, 0) / (miembros.length || 1);

            const r = Math.max(avgR * 1.3, 20);
            return (
              <ellipse
                key={idx}
                cx={cx} cy={cy}
                rx={r} ry={r * 0.85}
                fill={color} fillOpacity="0.06"
                stroke={color} strokeOpacity="0.25" strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Puntos */}
          {puntos.map(p => {
            const color = CLUSTER_PALETTE[p.cluster_index % CLUSTER_PALETTE.length];
            const { cx, cy } = toSvg(p.x, p.y);
            return (
              <circle
                key={p.expediente_id}
                cx={cx} cy={cy} r={6}
                fill={color} fillOpacity={0.85}
                stroke="white" strokeWidth={1.5}
                className="cursor-pointer transition-all hover:r-8"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                onMouseEnter={(e) => setTooltip({ svgX: cx, svgY: cy, punto: p })}
                onClick={() => onClickPunto(p)}
              />
            );
          })}

          {/* Etiquetas de centroides */}
          {Object.entries(centroidMap).map(([idx, { sx, sy, n }]) => {
            const ci = parseInt(idx);
            const color = CLUSTER_PALETTE[ci % CLUSTER_PALETTE.length];
            const { cx, cy } = toSvg(sx / n, sy / n);
            const label = clusterLabel[ci] ?? `Tema ${ci + 1}`;
            const short = label.length > 22 ? label.slice(0, 20) + '…' : label;
            return (
              <text
                key={idx}
                x={cx} y={cy - 14}
                textAnchor="middle"
                fontSize="10" fontWeight="700"
                fill={color} opacity="0.8"
              >
                {short}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="mt-3 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 max-w-xs shadow-lg pointer-events-none"
          style={{ animationDuration: '100ms' }}
        >
          <p className="font-bold leading-snug mb-1">{tooltip.punto.titulo ?? 'Sin título'}</p>
          <p className="text-gray-300">{tooltip.punto.tipo_instrumento} · <RiesgoBadge nivel={tooltip.punto.nivel_riesgo} /></p>
          <p className="text-gray-400 mt-1 text-[10px]">Click para ver el expediente →</p>
        </div>
      )}
    </div>
  );
}

// ── Sección Normas Recurrentes ────────────────────────────────────────────────

function FilaArticulo({ art }) {
  const total = art.frecuencia;
  const maxRiesgo = Math.max(art.riesgo_alto, art.riesgo_medio, art.riesgo_bajo, 1);
  return (
    <div className="flex items-start gap-3 py-2.5 border-t border-gray-50 first:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-700">{art.articulo}</span>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            ×{total}
          </span>
          {art.tipos_instrumento.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full font-medium">
              {t}
            </span>
          ))}
        </div>
        {art.descripcion && (
          <p className="text-[11px] text-gray-500 leading-relaxed mt-1 line-clamp-2">{art.descripcion}</p>
        )}
        {/* Barra de riesgo A/M/B */}
        <div className="flex gap-1.5 mt-1.5 items-center">
          {art.riesgo_alto  > 0 && (
            <div className="flex items-center gap-0.5">
              <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.round((art.riesgo_alto / maxRiesgo) * 56) + 8}px` }} />
              <span className="text-[10px] text-red-500 font-semibold">{art.riesgo_alto}A</span>
            </div>
          )}
          {art.riesgo_medio > 0 && (
            <div className="flex items-center gap-0.5">
              <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${Math.round((art.riesgo_medio / maxRiesgo) * 56) + 8}px` }} />
              <span className="text-[10px] text-amber-500 font-semibold">{art.riesgo_medio}M</span>
            </div>
          )}
          {art.riesgo_bajo  > 0 && (
            <div className="flex items-center gap-0.5">
              <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${Math.round((art.riesgo_bajo / maxRiesgo) * 56) + 8}px` }} />
              <span className="text-[10px] text-green-600 font-semibold">{art.riesgo_bajo}B</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InstrumentoAccordion({ grupo }) {
  const [abierto, setAbierto] = useState(false);
  const pct_alto  = grupo.articulos.reduce((s, a) => s + a.riesgo_alto,  0);
  const pct_medio = grupo.articulos.reduce((s, a) => s + a.riesgo_medio, 0);
  const pct_bajo  = grupo.articulos.reduce((s, a) => s + a.riesgo_bajo,  0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <Scale size={15} className="text-green-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{grupo.instrumento}</p>
          <div className="flex gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">{grupo.articulos.length} artículos · {grupo.total} citas</span>
            {pct_alto  > 0 && <span className="text-[10px] text-red-500 font-semibold">{pct_alto}A</span>}
            {pct_medio > 0 && <span className="text-[10px] text-amber-500 font-semibold">{pct_medio}M</span>}
            {pct_bajo  > 0 && <span className="text-[10px] text-green-600 font-semibold">{pct_bajo}B</span>}
          </div>
        </div>
        <span className="text-[11px] font-black text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5 shrink-0">
          {grupo.total}
        </span>
        {abierto
          ? <ChevronDown size={15} className="text-gray-400 shrink-0" />
          : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
      </button>

      {abierto && grupo.articulos.length > 0 && (
        <div className="px-5 pb-4 border-t border-gray-50">
          {grupo.articulos.map(art => (
            <FilaArticulo key={art.articulo} art={art} />
          ))}
        </div>
      )}
    </div>
  );
}

function SeccionNormas({ normas, loading, tiposDisponibles, filtroTipo, onFiltroTipo }) {
  if (loading) return (
    <div className="space-y-3">
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}
    </div>
  );

  if (!normas) return null;

  return (
    <div className="space-y-4">
      {/* Filtro por tipo de instrumento */}
      {tiposDisponibles.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} className="text-gray-400" />
          <button
            onClick={() => onFiltroTipo('')}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${
              !filtroTipo
                ? 'bg-green-700 text-white border-green-700'
                : 'text-gray-600 border-gray-200 hover:border-green-300'
            }`}
          >
            Todos
          </button>
          {tiposDisponibles.map(t => (
            <button
              key={t}
              onClick={() => onFiltroTipo(t)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                filtroTipo === t
                  ? 'bg-green-700 text-white border-green-700'
                  : 'text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {normas.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">Sin normas registradas en el corpus.</p>
      ) : (
        <div className="space-y-2">
          {normas.map(grupo => (
            <InstrumentoAccordion key={grupo.instrumento} grupo={grupo} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BibliotecaAmbiental() {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState(null);
  const [clustersData, setClustersData]   = useState(null);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [recalculando, setRecalculando]   = useState(false);
  const [clusterSeleccionado, setClusterSeleccionado] = useState(null);
  const [terminosIgnorados, setTerminosIgnorados] = useState([]);
  const [proyeccion, setProyeccion] = useState([]);
  const [normas, setNormas] = useState(null);
  const [loadingNormas, setLoadingNormas] = useState(true);
  const [filtroTipoNormas, setFiltroTipoNormas] = useState('');

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

  const cargarNormas = useCallback(async (tipo = '') => {
    setLoadingNormas(true);
    try {
      const params = tipo ? { tipo_instrumento: tipo } : {};
      const res = await apiService.get('/ambiental/biblioteca/normas', { params });
      setNormas(res.data);
    } catch {
      toast.error('Error al cargar normas');
    } finally {
      setLoadingNormas(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
    cargarClusters();
    cargarNormas();
    apiService.get('/ambiental/biblioteca/terminos-ignorados')
      .then(r => setTerminosIgnorados(r.data.map(t => t.word)))
      .catch(() => {});
    apiService.get('/ambiental/biblioteca/proyeccion')
      .then(r => setProyeccion(r.data))
      .catch(() => {});
  }, [cargarEstadisticas, cargarClusters, cargarNormas]);

  const handleFiltroTipoNormas = (tipo) => {
    setFiltroTipoNormas(tipo);
    cargarNormas(tipo);
  };

  // Tipos de instrumento disponibles extraídos del corpus estadístico
  const tiposDisponibles = (estadisticas?.por_tipo ?? []).map(t => t.tipo_instrumento).filter(Boolean);

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
      apiService.get('/ambiental/biblioteca/proyeccion').then(r => setProyeccion(r.data)).catch(() => {});
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

      {/* Mapa semántico PCA */}
      {proyeccion.length > 0 && (
        <section>
          <ScatterPlot
            puntos={proyeccion}
            clusters={clustersData?.clusters}
            onClickPunto={p => navigate(`/ambiental/expediente/${p.expediente_id}`)}
          />
        </section>
      )}

      {/* Normas más citadas */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Scale size={14} className="text-green-700" />
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Normas más citadas</h2>
        </div>
        <SeccionNormas
          normas={normas}
          loading={loadingNormas}
          tiposDisponibles={tiposDisponibles}
          filtroTipo={filtroTipoNormas}
          onFiltroTipo={handleFiltroTipoNormas}
        />
      </section>

      {/* Drawer de expedientes del cluster */}
      <ClusterDrawer
        cluster={clusterSeleccionado}
        onClose={() => setClusterSeleccionado(null)}
      />
    </div>
  );
}
