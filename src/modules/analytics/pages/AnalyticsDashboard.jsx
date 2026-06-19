import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';
import {
  LayoutDashboard, LogOut, AlertTriangle, Users, TrendingUp,
  Database, Clock, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, Cell, Legend
} from 'recharts';

// ── Colores ────────────────────────────────────────────────────────────────────
const COLOR_RIESGO = { Alto: '#ef4444', Medio: '#f59e0b', Bajo: '#10b981' };
const COLOR_FALLO  = { Favorable: '#10b981', Desfavorable: '#ef4444', sin_fallo: '#64748b' };

// ── Helpers ────────────────────────────────────────────────────────────────────
function Badge({ nivel }) {
  const cls = {
    Alto:  'bg-red-950/60 text-red-400 border-red-800',
    Medio: 'bg-amber-950/60 text-amber-400 border-amber-800',
    Bajo:  'bg-emerald-950/60 text-emerald-400 border-emerald-800',
  }[nivel] || 'bg-slate-800 text-slate-400 border-slate-700';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${cls}`}>
      {nivel}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="border border-slate-800 bg-slate-900/40 px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-4 border-b border-slate-800 pb-2">
      {children}
    </h3>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 px-3 py-2 font-mono text-xs">
      <p className="text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. Score de Riesgo ────────────────────────────────────────────────────────
function TabScoreRiesgo() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orden, setOrden] = useState({ campo: 'score', dir: 'desc' });

  useEffect(() => {
    apiService.get('/analytics/score-riesgo')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar scores'))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...data].sort((a, b) => {
    const va = a[orden.campo] ?? 0, vb = b[orden.campo] ?? 0;
    return orden.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const toggle = (campo) => setOrden(prev =>
    prev.campo === campo ? { campo, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'desc' }
  );

  const SortIcon = ({ campo }) => {
    if (orden.campo !== campo) return <Minus size={10} className="text-slate-700" />;
    return orden.dir === 'asc' ? <ChevronUp size={10} className="text-blue-400" /> : <ChevronDown size={10} className="text-blue-400" />;
  };

  const dist = { Alto: 0, Medio: 0, Bajo: 0 };
  data.forEach(t => { if (dist[t.nivel] !== undefined) dist[t.nivel]++; });

  if (loading) return <p className="text-slate-600 text-xs py-8 text-center">Cargando...</p>;

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total activas" value={data.length} />
        <StatCard label="Riesgo alto" value={dist.Alto} color="text-red-400" />
        <StatCard label="Riesgo medio" value={dist.Medio} color="text-amber-400" />
        <StatCard label="Riesgo bajo" value={dist.Bajo} color="text-emerald-400" />
      </div>

      {/* Distribución */}
      <div>
        <SectionTitle>Distribución por nivel de riesgo</SectionTitle>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'Tutelas', Alto: dist.Alto, Medio: dist.Medio, Bajo: dist.Bajo }]}>
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Alto" fill="#ef4444" name="Alto" />
              <Bar dataKey="Medio" fill="#f59e0b" name="Medio" />
              <Bar dataKey="Bajo" fill="#10b981" name="Bajo" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla */}
      <div>
        <SectionTitle>Ranking de tutelas por score</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                {[
                  { label: 'Radicado', campo: 'radicado' },
                  { label: 'Accionante', campo: 'accionante' },
                  { label: 'Responsable', campo: 'responsable' },
                  { label: 'Días rest.', campo: 'dias_restantes' },
                  { label: 'Reqs pend.', campo: 'reqs_pendientes' },
                  { label: 'Score', campo: 'score' },
                  { label: 'Nivel', campo: 'nivel' },
                ].map(({ label, campo }) => (
                  <th key={campo} className="text-left px-3 py-2 cursor-pointer hover:text-white select-none" onClick={() => toggle(campo)}>
                    <span className="flex items-center gap-1">{label} <SortIcon campo={campo} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => (
                <tr key={t.id} className={`border-b border-slate-800/40 hover:bg-slate-800/30 ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                  <td className="px-3 py-2 text-blue-400 font-bold">{t.radicado}</td>
                  <td className="px-3 py-2 text-slate-300">{t.accionante}</td>
                  <td className="px-3 py-2 text-slate-400">{t.responsable}</td>
                  <td className={`px-3 py-2 font-bold ${t.dias_restantes <= 3 ? 'text-red-400' : t.dias_restantes <= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {t.dias_restantes}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{t.reqs_pendientes}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden w-16">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${t.score}%`, backgroundColor: COLOR_RIESGO[t.nivel] }}
                        />
                      </div>
                      <span className="text-white font-bold">{t.score}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2"><Badge nivel={t.nivel} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 2. Carga por abogado ──────────────────────────────────────────────────────
function TabCargaAbogados() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.get('/analytics/carga-abogados')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar carga'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-600 text-xs py-8 text-center">Cargando...</p>;

  const totalActivos = data.reduce((s, a) => s + a.casos_activos, 0);
  const promTasa = data.length ? (data.reduce((s, a) => s + a.tasa_cierre, 0) / data.length).toFixed(1) : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Abogados activos" value={data.length} />
        <StatCard label="Casos activos totales" value={totalActivos} color="text-blue-400" />
        <StatCard label="Tasa cierre promedio" value={`${promTasa}%`} color="text-emerald-400" />
      </div>

      <div>
        <SectionTitle>Casos activos por profesional</SectionTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis type="category" dataKey="nombre" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="urgentes" stackId="a" fill="#ef4444" name="Urgentes" />
              <Bar dataKey="medios" stackId="a" fill="#f59e0b" name="Medios" />
              <Bar dataKey="bajos" stackId="a" fill="#10b981" name="Bajos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Detalle por profesional</SectionTitle>
        <div className="space-y-2">
          {data.map((a) => (
            <div key={a.nombre} className="border border-slate-800 bg-slate-900/30 px-5 py-3 flex items-center gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-bold truncate">{a.nombre}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{a.casos_total} casos totales</p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{a.casos_activos}</p>
                  <p className="text-[10px] text-slate-600 uppercase">activos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">{a.urgentes}</p>
                  <p className="text-[10px] text-slate-600 uppercase">urgentes</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{a.tasa_cierre}%</p>
                  <p className="text-[10px] text-slate-600 uppercase">cierre</p>
                </div>
                {/* Mini barra de carga */}
                <div className="w-24">
                  <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                    <span>Carga</span>
                    <span>{a.casos_activos}/{Math.max(...data.map(d => d.casos_activos))}</span>
                  </div>
                  <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(a.casos_activos / Math.max(...data.map(d => d.casos_activos))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 3. Patrones de fallo ──────────────────────────────────────────────────────
function TabPatronesFallo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('derecho');

  useEffect(() => {
    apiService.get('/analytics/patrones-fallo')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar patrones'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-600 text-xs py-8 text-center">Cargando...</p>;
  if (!data) return null;

  const rows = vista === 'derecho' ? data.porDerecho : data.porJuzgado;
  const labelKey = vista === 'derecho' ? 'derecho' : 'juzgado';

  const totalFavorable = rows.reduce((s, r) => s + r.favorables, 0);
  const totalDesfavorable = rows.reduce((s, r) => s + r.desfavorables, 0);
  const totalSinFallo = rows.reduce((s, r) => s + (r.sin_fallo ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Favorables" value={totalFavorable} color="text-emerald-400" />
        <StatCard label="Desfavorables" value={totalDesfavorable} color="text-red-400" />
        <StatCard label="Sin fallo" value={totalSinFallo} color="text-slate-400" />
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        {['derecho', 'juzgado'].map(v => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              vista === v ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            Por {v}
          </button>
        ))}
      </div>

      <div>
        <SectionTitle>Resultados por {labelKey}</SectionTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.slice(0, 12)} margin={{ bottom: 40 }}>
              <XAxis dataKey={labelKey} tick={{ fill: '#475569', fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="favorables" fill="#10b981" name="Favorables" />
              <Bar dataKey="desfavorables" fill="#ef4444" name="Desfavorables" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Tasa de éxito</SectionTitle>
        <div className="space-y-2">
          {rows.filter(r => r.tasa_exito !== null).sort((a, b) => b.tasa_exito - a.tasa_exito).map((r) => (
            <div key={r[labelKey]} className="flex items-center gap-4 border border-slate-800 bg-slate-900/30 px-4 py-2.5">
              <p className="flex-1 text-xs text-slate-300 truncate">{r[labelKey]}</p>
              <span className="text-[10px] text-slate-600 shrink-0">{r.total} casos</span>
              <div className="w-32">
                <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.tasa_exito}%` }} />
                </div>
              </div>
              <span className={`text-sm font-bold w-12 text-right ${r.tasa_exito >= 60 ? 'text-emerald-400' : r.tasa_exito >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {r.tasa_exito}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 4. Eficiencia RAG ─────────────────────────────────────────────────────────
function TabEficienciaRAG() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.get('/analytics/eficiencia-rag')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar RAG'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-600 text-xs py-8 text-center">Cargando...</p>;
  if (!data) return null;

  const { resumen, porCategoria, top_documentos, bottom_documentos } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Documentos totales" value={resumen.total} />
        <StatCard label="Score promedio" value={resumen.score_promedio} color="text-blue-400" />
        <StatCard label="Muy útiles (≥3)" value={resumen.muy_utiles} color="text-emerald-400" />
        <StatCard label="Candidatos eliminar" value={resumen.candidatos_eliminar} color="text-red-400" />
      </div>

      <div>
        <SectionTitle>Score promedio por categoría</SectionTitle>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCategoria}>
              <XAxis dataKey="categoria" tick={{ fill: '#475569', fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score_promedio" name="Score promedio" radius={[2, 2, 0, 0]}>
                {porCategoria.map((c, i) => (
                  <Cell key={i} fill={c.score_promedio >= 2 ? '#10b981' : c.score_promedio >= 0 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Top 10 documentos más útiles</SectionTitle>
          <div className="space-y-1.5">
            {top_documentos.map((d, i) => (
              <div key={i} className="flex items-center gap-3 border border-slate-800 bg-slate-900/30 px-3 py-2">
                <span className="text-[10px] text-slate-700 w-4">{i + 1}</span>
                <p className="flex-1 text-[11px] text-slate-300 truncate">{d.titulo_referencia}</p>
                <span className="text-emerald-400 font-bold text-xs">+{d.relevancia_score}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>10 documentos con menor relevancia</SectionTitle>
          <div className="space-y-1.5">
            {bottom_documentos.map((d, i) => (
              <div key={i} className="flex items-center gap-3 border border-slate-800 bg-slate-900/30 px-3 py-2">
                <span className="text-[10px] text-slate-700 w-4">{i + 1}</span>
                <p className="flex-1 text-[11px] text-slate-300 truncate">{d.titulo_referencia}</p>
                <span className="text-red-400 font-bold text-xs">{d.relevancia_score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 5. Tiempo de respuesta por área ───────────────────────────────────────────
function TabTiempoRespuesta() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.get('/analytics/tiempo-respuesta-area')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar tiempos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-600 text-xs py-8 text-center">Cargando...</p>;

  const conDatos = data.filter(g => g.promedio_dias !== null);
  const promGlobal = conDatos.length
    ? (conDatos.reduce((s, g) => s + g.promedio_dias, 0) / conDatos.length).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Grupos evaluados" value={data.length} />
        <StatCard label="Promedio global" value={promGlobal ? `${promGlobal}d` : '—'} color="text-blue-400" />
        <StatCard label="Con reqs respondidos" value={conDatos.length} color="text-emerald-400" />
      </div>

      <div>
        <SectionTitle>Días promedio de respuesta por grupo</SectionTitle>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={conDatos}>
              <XAxis dataKey="grupo" tick={{ fill: '#475569', fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} unit="d" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="promedio_dias" name="Días promedio" radius={[2, 2, 0, 0]}>
                {conDatos.map((g, i) => (
                  <Cell key={i} fill={g.promedio_dias <= 3 ? '#10b981' : g.promedio_dias <= 7 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Detalle por grupo</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="text-left px-3 py-2">Grupo</th>
                <th className="text-right px-3 py-2">Total reqs</th>
                <th className="text-right px-3 py-2">Respondidos</th>
                <th className="text-right px-3 py-2">Prom. global</th>
                <th className="text-right px-3 py-2">Alta</th>
                <th className="text-right px-3 py-2">Media</th>
                <th className="text-right px-3 py-2">Baja</th>
              </tr>
            </thead>
            <tbody>
              {data.map((g, i) => (
                <tr key={g.grupo} className={`border-b border-slate-800/40 hover:bg-slate-800/30 ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                  <td className="px-3 py-2 text-slate-200 font-bold">{g.grupo}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{g.total}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{g.respondidos}</td>
                  <td className={`px-3 py-2 text-right font-bold ${!g.promedio_dias ? 'text-slate-700' : g.promedio_dias <= 3 ? 'text-emerald-400' : g.promedio_dias <= 7 ? 'text-amber-400' : 'text-red-400'}`}>
                    {g.promedio_dias != null ? `${g.promedio_dias}d` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">{g.promedio_dias_alta != null ? `${g.promedio_dias_alta}d` : '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{g.promedio_dias_media != null ? `${g.promedio_dias_media}d` : '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{g.promedio_dias_baja != null ? `${g.promedio_dias_baja}d` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { key: 'riesgo',    label: 'Score Riesgo',       icon: <AlertTriangle size={13} />,  component: <TabScoreRiesgo /> },
  { key: 'carga',     label: 'Carga Abogados',      icon: <Users size={13} />,          component: <TabCargaAbogados /> },
  { key: 'fallo',     label: 'Patrones Fallo',      icon: <TrendingUp size={13} />,     component: <TabPatronesFallo /> },
  { key: 'rag',       label: 'Eficiencia RAG',      icon: <Database size={13} />,       component: <TabEficienciaRAG /> },
  { key: 'respuesta', label: 'Tiempo Respuesta',    icon: <Clock size={13} />,          component: <TabTiempoRespuesta /> },
];

export default function AnalyticsDashboard() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('riesgo');

  const activeTab = TABS.find(t => t.key === tab);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-mono">
      <ConstellationBackground baseOpacity={0.15} />

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-sm">
        {/* Fila superior */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800/40">
          <div className="flex items-center gap-3">
            <Link to="/selector" className="text-slate-500 hover:text-white transition-colors" title="Volver al selector">
              <LayoutDashboard size={18} />
            </Link>
            <span className="text-slate-700 text-sm">›</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">Analytics</span>
          </div>
          <button onClick={logout} className="text-[10px] text-red-600 hover:text-red-400 flex items-center gap-1.5 uppercase tracking-widest transition-colors">
            <LogOut size={12} /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-8 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] border-b-2 transition-colors shrink-0 ${
                tab === t.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Contenido ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-10">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-white flex items-center gap-3">
            {activeTab?.icon && <span className="text-blue-400">{activeTab.icon}</span>}
            {activeTab?.label}
          </h1>
          <p className="text-slate-600 text-xs mt-2 tracking-wide">
            Datos en tiempo real · módulo tutelas
          </p>
        </div>

        {activeTab?.component}
      </div>

      <footer className="relative z-10 mt-16 text-slate-800 text-[10px] uppercase tracking-[0.2em] text-center pb-8">
        ICEBREAKER © 2026 // ANALYTICS MODULE
      </footer>
    </div>
  );
}
