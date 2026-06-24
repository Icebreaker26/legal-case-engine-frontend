import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2, FileText, Mail, Shield, Wallet, Leaf, Scale,
  ChevronDown, ChevronUp, Search, Download, Clock, List, AlignLeft, PieChart as PieIcon,
  ExternalLink, X as XIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { generarReportePDF } from '../utils/generarReportePDF';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  AreaChart, Area,
} from 'recharts';

// ── Configuración de módulos ──────────────────────────────────────────────────
const MODULO_CONFIG = {
  pagos:          { label: 'Pagos (PDP)',       icon: Wallet,   color: 'text-sky-400',     border: 'border-sky-800',    bg: 'bg-sky-950/30'    },
  comunicaciones: { label: 'Comunicaciones',    icon: Mail,     color: 'text-indigo-400',  border: 'border-indigo-800', bg: 'bg-indigo-950/30' },
  conformidades:  { label: 'Conformidades',     icon: Shield,   color: 'text-yellow-400',  border: 'border-yellow-800', bg: 'bg-yellow-950/30' },
  tutelas:        { label: 'Derechos Petición', icon: Scale,    color: 'text-blue-400',    border: 'border-blue-800',   bg: 'bg-blue-950/30'   },
  ambiental:      { label: 'Derecho Ambiental', icon: Leaf,     color: 'text-green-400',   border: 'border-green-800',  bg: 'bg-green-950/30'  },
  contratos:      { label: 'Contratos',         icon: FileText, color: 'text-pink-400',    border: 'border-pink-800',   bg: 'bg-pink-950/30'   },
};

const MODULOS_ALL = Object.keys(MODULO_CONFIG);

const MODULO_COLORS = {
  pagos:          '#38bdf8',
  comunicaciones: '#818cf8',
  conformidades:  '#facc15',
  tutelas:        '#60a5fa',
  ambiental:      '#4ade80',
  contratos:      '#f472b6',
};

const ESTADO_COLORS = ['#818cf8','#4ade80','#38bdf8','#facc15','#f472b6','#fb923c','#94a3b8'];

const getLink = (modulo, id) => {
  if (!id) return null;
  const rutas = {
    tutelas:        `/tutela/${id}`,
    comunicaciones: `/comunicaciones/${id}`,
    pagos:          `/pagos/${id}`,
    conformidades:  `/conformidades/${id}`,
    ambiental:      `/ambiental/expediente/${id}`,
    contratos:      `/contratos/auditoria/${id}`,
  };
  return rutas[modulo] || null;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-mono shadow-xl">
      {label && <p className="font-semibold text-slate-300 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

const fmt = (val) => (val == null || val === '') ? '—' : String(val);

const fmtMonto = (v) => {
  if (v == null) return '—';
  return Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

const fmtFecha = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── SearchableSelect (dark) ───────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-mono flex items-center justify-between hover:border-indigo-600 transition-colors"
      >
        <span className={selected ? 'text-slate-200' : 'text-slate-600'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={12} className="text-slate-600 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 shadow-2xl max-h-52 overflow-y-auto">
          <div className="p-2 border-b border-slate-800">
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full text-xs font-mono px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="Buscar..."
            />
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); setQ(''); }}
            className="w-full text-left px-3 py-2 text-xs font-mono text-slate-600 hover:bg-slate-800"
          >
            — Todos —
          </button>
          {filtered.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
              className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-slate-800 ${String(value) === String(o.value) ? 'text-indigo-400 bg-indigo-950/40' : 'text-slate-300'}`}
            >
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs font-mono text-slate-600 italic">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tabla de módulo ───────────────────────────────────────────────────────────
function TablaModulo({ modulo, filas, onIr }) {
  const [collapsed, setCollapsed] = useState(false);
  const cfg = MODULO_CONFIG[modulo] || {};
  const Icon = cfg.icon || BarChart2;
  if (!filas || filas.length === 0) return null;

  return (
    <div className={`border ${cfg.border || 'border-slate-700'} overflow-hidden`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-3 ${cfg.bg || 'bg-slate-900/40'} hover:brightness-110 transition-all`}
      >
        <div className="flex items-center gap-2">
          <Icon size={14} className={cfg.color} />
          <span className={`font-bold text-[11px] uppercase tracking-[0.2em] ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-600 font-mono">{filas.length} registro{filas.length !== 1 ? 's' : ''}</span>
        </div>
        {collapsed ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronUp size={14} className="text-slate-600" />}
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-900/60">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Título / Concepto</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Estado</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Fecha</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Entidad / Área</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Responsable</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">Monto</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filas.map((f, i) => {
                const link = getLink(modulo, f.id);
                return (
                  <tr key={f.id || i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-slate-200 max-w-xs truncate" title={fmt(f.titulo)}>{fmt(f.titulo)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 border border-slate-700 text-slate-400 text-[10px] uppercase tracking-wide">{fmt(f.estado)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmtFecha(f.fecha)}</td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-[140px]" title={fmt(f.entidad)}>{fmt(f.entidad)}</td>
                    <td className="px-4 py-2.5 text-slate-500 truncate max-w-[140px]" title={fmt(f.responsable)}>{fmt(f.responsable)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400 whitespace-nowrap">{fmtMonto(f.monto)}</td>
                    <td className="px-3 py-2 text-right">
                      {link ? (
                        <button
                          onClick={() => onIr(link)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors whitespace-nowrap"
                          style={{ borderColor: MODULO_COLORS[modulo] + '60', color: MODULO_COLORS[modulo] }}
                        >
                          <ExternalLink size={10} /> Abrir
                        </button>
                      ) : (
                        <span className="text-slate-700 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────
function TimelineRow({ item, onIr }) {
  const cfg = MODULO_CONFIG[item.modulo] || {};
  const Icon = cfg.icon || BarChart2;
  const link = getLink(item.modulo, item.id);

  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-800/60 last:border-0">
      <div className={`w-7 h-7 flex items-center justify-center border ${cfg.border || 'border-slate-700'} ${cfg.bg || 'bg-slate-900/40'} shrink-0 mt-0.5`}>
        <Icon size={13} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-slate-200 text-xs truncate">{fmt(item.titulo)}</span>
          <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${cfg.border} ${cfg.bg} ${cfg.color}`}>{cfg.label || item.modulo}</span>
          <span className="text-[9px] font-mono border border-slate-800 text-slate-600 px-1.5 py-0.5">{fmt(item.estado)}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono text-slate-600">
          <span><Clock size={9} className="inline mr-0.5" />{fmtFecha(item.fecha)}</span>
          {item.entidad && <span>{item.entidad}</span>}
          {item.responsable && <span>· {item.responsable}</span>}
          {item.monto && <span>· {fmtMonto(item.monto)}</span>}
        </div>
      </div>
      {link && (
        <button
          onClick={() => onIr(link)}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors"
          style={{ borderColor: MODULO_COLORS[item.modulo] + '60', color: MODULO_COLORS[item.modulo] }}
        >
          <ExternalLink size={10} /> Abrir
        </button>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReportesDashboard() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({
    modulos: [...MODULOS_ALL],
    entidad_id: null, proyecto_id: null, contrato_id: null,
    grupo_id: null, acreedor_id: null, responsable_uuid: null,
    fecha_desde: '', fecha_hasta: '', estado: '',
  });

  const [catalogos, setCatalogos] = useState({
    entidades: [], proyectos: [], contratos: [], grupos: [], acreedores: [], usuarios: [],
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState('modulo');

  const graficasPorModulo = useMemo(() => {
    if (!resultado) return [];
    return MODULOS_ALL.filter(m => (resultado.totales[m] || 0) > 0).map(m => ({
      name: MODULO_CONFIG[m].label, value: resultado.totales[m], color: MODULO_COLORS[m],
    }));
  }, [resultado]);

  const graficasEstados = useMemo(() => {
    if (!resultado) return [];
    const counts = {};
    for (const item of resultado.timeline) {
      const e = item.estado || 'Sin estado';
      counts[e] = (counts[e] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value }));
  }, [resultado]);

  const resultadoFiltrado = useMemo(() => {
    if (!resultado) return null;
    if (!busqueda.trim()) return resultado;
    const q = busqueda.toLowerCase();
    const filtrarFilas = (filas) => filas.filter(f =>
      [f.titulo, f.estado, f.entidad, f.proyecto, f.responsable].some(v => v && String(v).toLowerCase().includes(q))
    );
    const por_modulo = {}; const totales = {};
    for (const m of MODULOS_ALL) {
      por_modulo[m] = filtrarFilas(resultado.por_modulo[m] || []);
      totales[m] = por_modulo[m].length;
    }
    return { por_modulo, timeline: filtrarFilas(resultado.timeline), totales };
  }, [resultado, busqueda]);

  const graficasTendencia = useMemo(() => {
    if (!resultado) return [];
    const byMonth = {};
    for (const item of resultado.timeline) {
      if (!item.fecha) continue;
      const mes = item.fecha.slice(0, 7);
      if (!byMonth[mes]) byMonth[mes] = {};
      byMonth[mes][item.modulo] = (byMonth[mes][item.modulo] || 0) + 1;
    }
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([mes, mods]) => ({ mes, ...mods }));
  }, [resultado]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [ent, proy, cont, grp, acr, usr] = await Promise.all([
          apiService.get('/core/entidades'), apiService.get('/core/proyectos'),
          apiService.get('/core/contratos'), apiService.get('/core/grupos'),
          apiService.get('/core/acreedores'), apiService.get('/admin/usuarios'),
        ]);
        setCatalogos({
          entidades:  (ent.data  || []).map(x => ({ value: x.id, label: x.nombre })),
          proyectos:  (proy.data || []).map(x => ({ value: x.id, label: x.nombre })),
          contratos:  (cont.data || []).map(x => ({ value: x.id, label: x.numero || x.nombre })),
          grupos:     (grp.data  || []).map(x => ({ value: x.id, label: x.nombre })),
          acreedores: (acr.data  || []).map(x => ({ value: x.id, label: x.nombre })),
          usuarios:   (usr.data  || []).map(x => ({ value: x.id, label: x.nombre })),
        });
      } catch { /* silencioso */ }
    };
    cargar();
  }, []);

  const toggleModulo = (m) => {
    setFiltros(prev => {
      const mods = prev.modulos.includes(m) ? prev.modulos.filter(x => x !== m) : [...prev.modulos, m];
      return { ...prev, modulos: mods.length ? mods : prev.modulos };
    });
  };

  const consultar = useCallback(async () => {
    if (!filtros.modulos.length) { toast.error('Selecciona al menos un módulo'); return; }
    setLoading(true);
    try {
      const body = {
        modulos: filtros.modulos,
        ...(filtros.entidad_id       && { entidad_id:       Number(filtros.entidad_id) }),
        ...(filtros.proyecto_id      && { proyecto_id:      Number(filtros.proyecto_id) }),
        ...(filtros.contrato_id      && { contrato_id:      Number(filtros.contrato_id) }),
        ...(filtros.grupo_id         && { grupo_id:         Number(filtros.grupo_id) }),
        ...(filtros.acreedor_id      && { acreedor_id:      Number(filtros.acreedor_id) }),
        ...(filtros.responsable_uuid && { responsable_uuid: filtros.responsable_uuid }),
        ...(filtros.fecha_desde      && { fecha_desde:      filtros.fecha_desde }),
        ...(filtros.fecha_hasta      && { fecha_hasta:      filtros.fecha_hasta }),
        ...(filtros.estado           && { estado:           filtros.estado }),
      };
      const { data } = await apiService.post('/reportes/consultar', body);
      setResultado(data);
    } catch { toast.error('Error al consultar'); }
    finally { setLoading(false); }
  }, [filtros]);

  const exportarCSV = () => {
    if (!resultado?.timeline.length) { toast.error('No hay datos para exportar'); return; }
    const cab = ['Módulo','Título','Estado','Fecha','Entidad','Proyecto','Responsable','Monto'];
    const rows = resultado.timeline.map(f => [
      MODULO_CONFIG[f.modulo]?.label || f.modulo, fmt(f.titulo), fmt(f.estado), fmtFecha(f.fecha),
      fmt(f.entidad), fmt(f.proyecto), fmt(f.responsable), f.monto != null ? Number(f.monto) : '',
    ]);
    const csv = [cab, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'reporte.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    if (!resultado?.timeline.length) { toast.error('No hay datos para exportar'); return; }
    generarReportePDF(resultado, filtros, catalogos);
  };

  const totalRegistros = resultado ? resultado.timeline.length : 0;

  // Sección label helper
  const SectionLabel = ({ children }) => (
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{children}</span>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-lg font-bold tracking-[0.3em] text-white uppercase flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-400" /> CONSULTA CROSS-MÓDULO
        </h1>
        <p className="text-[10px] font-mono text-slate-600 mt-1 tracking-widest uppercase">
          {'>'} Cruza información de todos los módulos en una sola vista
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Panel de filtros ──────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="border border-slate-800 bg-slate-900/40 p-4 space-y-5 sticky top-6">

            {/* Módulos */}
            <div>
              <SectionLabel>Módulos</SectionLabel>
              <div className="grid grid-cols-1 gap-1 mt-2">
                {MODULOS_ALL.map(m => {
                  const cfg = MODULO_CONFIG[m];
                  const Icon = cfg.icon;
                  const active = filtros.modulos.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleModulo(m)}
                      className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide border transition-all ${
                        active
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : 'border-slate-800 text-slate-700 hover:border-slate-700 hover:text-slate-500'
                      }`}
                    >
                      <Icon size={11} /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catálogos */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <SectionLabel>Catálogos</SectionLabel>
              {[
                ['Entidad',    'entidades',  'entidad_id'],
                ['Proyecto',   'proyectos',  'proyecto_id'],
                ['Contrato',   'contratos',  'contrato_id'],
                ['Grupo / Área','grupos',    'grupo_id'],
                ['Acreedor',   'acreedores', 'acreedor_id'],
                ['Responsable','usuarios',   'responsable_uuid'],
              ].map(([label, cat, key]) => (
                <div key={key}>
                  <p className="text-[10px] font-mono text-slate-700 mb-1">{label}</p>
                  <SearchableSelect
                    options={catalogos[cat]}
                    value={filtros[key]}
                    onChange={v => setFiltros(p => ({ ...p, [key]: v }))}
                    placeholder={`Todos`}
                  />
                </div>
              ))}
            </div>

            {/* Fechas */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <SectionLabel>Rango de fechas</SectionLabel>
              {[['Desde','fecha_desde'],['Hasta','fecha_hasta']].map(([label, key]) => (
                <div key={key}>
                  <p className="text-[10px] font-mono text-slate-700 mb-1">{label}</p>
                  <input
                    type="date"
                    value={filtros[key]}
                    onChange={e => setFiltros(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-600 [color-scheme:dark]"
                  />
                </div>
              ))}
            </div>

            {/* Estado libre */}
            <div className="border-t border-slate-800 pt-4">
              <p className="text-[10px] font-mono text-slate-700 mb-1">Estado (texto libre)</p>
              <input
                type="text"
                value={filtros.estado}
                onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
                placeholder="ej. pendiente, liberado…"
                className="w-full border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              onClick={consultar}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-700 bg-indigo-950/50 hover:bg-indigo-900/50 disabled:opacity-40 text-indigo-400 font-bold text-[11px] uppercase tracking-[0.2em] transition-colors"
            >
              {loading
                ? <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                : <><Search size={13} /> [ CONSULTAR ]</>
              }
            </button>
          </div>
        </div>

        {/* ── Panel de resultados ────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {resultado && (
            <>
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar en resultados por título, estado, entidad, responsable…"
                  className="w-full pl-9 pr-9 py-2.5 border border-slate-800 bg-slate-900/40 text-xs font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-indigo-600"
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                    <XIcon size={13} />
                  </button>
                )}
              </div>

              {/* Barra de control */}
              <div className="border border-slate-800 bg-slate-900/40 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">
                    <span className="font-bold text-indigo-400">{resultadoFiltrado?.timeline.length ?? 0}</span> registros
                    {busqueda && <span className="text-slate-700 ml-1">(de {totalRegistros})</span>}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(resultadoFiltrado?.totales || {}).filter(([, n]) => n > 0).map(([m, n]) => {
                      const cfg = MODULO_CONFIG[m] || {};
                      return (
                        <span key={m} className={`text-[9px] font-bold font-mono px-2 py-0.5 border ${cfg.border || 'border-slate-700'} ${cfg.color || 'text-slate-500'} ${cfg.bg || ''}`}>
                          {cfg.label || m}: {n}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle vista */}
                  <div className="flex border border-slate-700 overflow-hidden">
                    {[
                      { id: 'modulo',   icon: List,     label: 'Módulo' },
                      { id: 'timeline', icon: AlignLeft, label: 'Timeline' },
                      { id: 'graficas', icon: PieIcon,  label: 'Gráficas' },
                    ].map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => setVista(id)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          vista === id ? 'bg-indigo-900/60 text-indigo-400 border-r border-slate-700' : 'bg-transparent text-slate-600 hover:text-slate-400 border-r border-slate-700 last:border-0'
                        }`}
                      >
                        <Icon size={11} /> {label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={exportarCSV}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-800 text-emerald-500 hover:bg-emerald-950/30 transition-colors"
                  >
                    <Download size={11} /> CSV
                  </button>
                  <button
                    onClick={exportarPDF}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-red-900 text-red-500 hover:bg-red-950/30 transition-colors"
                  >
                    <Download size={11} /> PDF
                  </button>
                </div>
              </div>

              {/* Vista: Por módulo */}
              {vista === 'modulo' && (
                <div className="space-y-2">
                  {MODULOS_ALL.map(m =>
                    resultadoFiltrado?.por_modulo[m]?.length > 0 && (
                      <TablaModulo key={m} modulo={m} filas={resultadoFiltrado.por_modulo[m]} onIr={navigate} />
                    )
                  )}
                  {(resultadoFiltrado?.timeline.length ?? 0) === 0 && (
                    <div className="border border-slate-800 p-12 text-center font-mono text-slate-700 text-xs">
                      {busqueda ? `// Sin resultados para "${busqueda}"` : '// Sin resultados para los filtros seleccionados'}
                    </div>
                  )}
                </div>
              )}

              {/* Vista: Timeline */}
              {vista === 'timeline' && (
                <div className="border border-slate-800 bg-slate-900/20 p-4">
                  {(resultadoFiltrado?.timeline.length ?? 0) === 0 ? (
                    <div className="py-12 text-center font-mono text-slate-700 text-xs">
                      {busqueda ? `// Sin resultados para "${busqueda}"` : '// Sin resultados'}
                    </div>
                  ) : (
                    resultadoFiltrado.timeline.map((item, i) => (
                      <TimelineRow key={`${item.modulo}-${item.id || i}`} item={item} onIr={navigate} />
                    ))
                  )}
                </div>
              )}

              {/* Vista: Gráficas */}
              {vista === 'graficas' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="border border-slate-800 bg-slate-900/20 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4">Registros por módulo</p>
                      {graficasPorModulo.length === 0 ? (
                        <p className="text-xs font-mono text-slate-700 py-8 text-center">// Sin datos</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={graficasPorModulo} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }} width={110} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Registros" radius={[0, 2, 2, 0]}>
                              {graficasPorModulo.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="border border-slate-800 bg-slate-900/20 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4">Distribución por estado</p>
                      {graficasEstados.length === 0 ? (
                        <p className="text-xs font-mono text-slate-700 py-8 text-center">// Sin datos</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={graficasEstados} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                              {graficasEstados.map((_, i) => <Cell key={i} fill={ESTADO_COLORS[i % ESTADO_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={7} formatter={(v) => <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{v}</span>} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-slate-900/20 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4">Tendencia temporal (registros por mes)</p>
                    {graficasTendencia.length === 0 ? (
                      <p className="text-xs font-mono text-slate-700 py-8 text-center">// Sin datos con fecha registrada</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={graficasTendencia} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                          <defs>
                            {MODULOS_ALL.map(m => (
                              <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={MODULO_COLORS[m]} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={MODULO_COLORS[m]} stopOpacity={0} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend iconType="circle" iconSize={7} formatter={(v) => {
                            const cfg = MODULO_CONFIG[v];
                            return <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{cfg ? cfg.label : v}</span>;
                          }} />
                          {graficasPorModulo.map(({ name, color }) => {
                            const key = MODULOS_ALL.find(m => MODULO_CONFIG[m].label === name);
                            if (!key) return null;
                            return (
                              <Area key={key} type="monotone" dataKey={key} name={key}
                                stroke={color} fill={`url(#grad-${key})`} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!resultado && !loading && (
            <div className="border border-dashed border-slate-800 p-16 text-center">
              <BarChart2 size={36} className="mx-auto mb-4 text-slate-800" />
              <p className="font-mono text-slate-700 text-xs">
                {'// '} Configura los filtros y ejecuta{' '}
                <span className="text-indigo-600 font-bold">[ CONSULTAR ]</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
