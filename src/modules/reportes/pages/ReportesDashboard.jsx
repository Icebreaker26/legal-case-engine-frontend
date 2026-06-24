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
  pagos:          { label: 'Pagos (PDP)',       icon: Wallet,   color: 'text-sky-600',     bg: 'bg-sky-50',    border: 'border-sky-200',    check: 'accent-sky-600'    },
  comunicaciones: { label: 'Comunicaciones',    icon: Mail,     color: 'text-indigo-600',  bg: 'bg-indigo-50', border: 'border-indigo-200', check: 'accent-indigo-600' },
  conformidades:  { label: 'Conformidades',     icon: Shield,   color: 'text-yellow-600',  bg: 'bg-yellow-50', border: 'border-yellow-200', check: 'accent-yellow-600' },
  tutelas:        { label: 'Derechos Petición', icon: Scale,    color: 'text-blue-600',    bg: 'bg-blue-50',   border: 'border-blue-200',   check: 'accent-blue-600'   },
  ambiental:      { label: 'Derecho Ambiental', icon: Leaf,     color: 'text-green-600',   bg: 'bg-green-50',  border: 'border-green-200',  check: 'accent-green-600'  },
  contratos:      { label: 'Contratos',         icon: FileText, color: 'text-pink-600',    bg: 'bg-pink-50',   border: 'border-pink-200',   check: 'accent-pink-600'   },
};

const MODULOS_ALL = Object.keys(MODULO_CONFIG);

// Colores hex para recharts (debe coincidir con los colores Tailwind del config)
const MODULO_COLORS = {
  pagos:          '#0ea5e9',
  comunicaciones: '#6366f1',
  conformidades:  '#eab308',
  tutelas:        '#3b82f6',
  ambiental:      '#22c55e',
  contratos:      '#ec4899',
};

const ESTADO_COLORS = ['#6366f1','#22c55e','#0ea5e9','#eab308','#ec4899','#f97316','#64748b'];

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
    <div className="bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (val) => {
  if (val == null || val === '') return '—';
  return String(val);
};

const fmtMonto = (v) => {
  if (v == null) return '—';
  return Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
};

const fmtFecha = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── SearchableSelect ──────────────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left border border-gray-300 rounded px-3 py-2 text-sm bg-white flex items-center justify-between hover:border-indigo-400 transition-colors"
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-indigo-400"
              placeholder="Buscar..."
            />
          </div>
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); setQ(''); }}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
          >
            — Todos —
          </button>
          {filtered.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${String(value) === String(o.value) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
            >
              {o.label}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400 italic">Sin resultados</p>
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
    <div className={`rounded-lg border ${cfg.border || 'border-gray-200'} overflow-hidden`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-4 py-3 ${cfg.bg || 'bg-gray-50'} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={cfg.color} />
          <span className={`font-bold text-sm uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
          <span className="text-xs text-gray-500 font-normal">{filas.length} registro{filas.length !== 1 ? 's' : ''}</span>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </button>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título / Concepto</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entidad / Área</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Responsable</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.map((f, i) => {
                const link = getLink(modulo, f.id);
                return (
                  <tr key={f.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-800 font-medium max-w-xs truncate" title={fmt(f.titulo)}>{fmt(f.titulo)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{fmt(f.estado)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{fmtFecha(f.fecha)}</td>
                    <td className="px-4 py-2.5 text-gray-600 truncate max-w-[140px]" title={fmt(f.entidad)}>{fmt(f.entidad)}</td>
                    <td className="px-4 py-2.5 text-gray-600 truncate max-w-[140px]" title={fmt(f.responsable)}>{fmt(f.responsable)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700 whitespace-nowrap">{fmtMonto(f.monto)}</td>
                    <td className="px-3 py-2 text-right">
                      {link ? (
                        <button
                          onClick={() => onIr(link)}
                          title="Ir al registro"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-white transition-opacity hover:opacity-80 whitespace-nowrap`}
                          style={{ backgroundColor: MODULO_COLORS[modulo] || '#6366f1' }}
                        >
                          <ExternalLink size={12} /> Abrir
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
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
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${cfg.bg || 'bg-gray-50'} border ${cfg.border || 'border-gray-200'} shrink-0 mt-0.5`}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800 text-sm truncate">{fmt(item.titulo)}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{fmt(item.estado)}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span><Clock size={10} className="inline mr-0.5" />{fmtFecha(item.fecha)}</span>
          {item.entidad && <span>{item.entidad}</span>}
          {item.responsable && <span>· {item.responsable}</span>}
          {item.monto && <span>· {fmtMonto(item.monto)}</span>}
        </div>
      </div>
      {link && (
        <button
          onClick={() => onIr(link)}
          title="Ir al registro"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-white hover:opacity-80 transition-opacity"
          style={{ backgroundColor: MODULO_COLORS[item.modulo] || '#6366f1' }}
        >
          <ExternalLink size={12} /> Abrir
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
    entidad_id: null,
    proyecto_id: null,
    contrato_id: null,
    grupo_id: null,
    acreedor_id: null,
    responsable_uuid: null,
    fecha_desde: '',
    fecha_hasta: '',
    estado: '',
  });

  const [catalogos, setCatalogos] = useState({
    entidades: [], proyectos: [], contratos: [], grupos: [], acreedores: [], usuarios: [],
  });
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState('modulo'); // 'modulo' | 'timeline' | 'graficas'

  // ── Datos derivados para gráficas ──────────────────────────────────────────
  const graficasPorModulo = useMemo(() => {
    if (!resultado) return [];
    return MODULOS_ALL
      .filter(m => (resultado.totales[m] || 0) > 0)
      .map(m => ({
        name: MODULO_CONFIG[m].label,
        value: resultado.totales[m],
        color: MODULO_COLORS[m],
      }));
  }, [resultado]);

  const graficasEstados = useMemo(() => {
    if (!resultado) return [];
    const counts = {};
    for (const item of resultado.timeline) {
      const e = item.estado || 'Sin estado';
      counts[e] = (counts[e] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value]) => ({ name, value }));
  }, [resultado]);

  const resultadoFiltrado = useMemo(() => {
    if (!resultado) return null;
    if (!busqueda.trim()) return resultado;
    const q = busqueda.toLowerCase();
    const filtrarFilas = (filas) => filas.filter(f =>
      [f.titulo, f.estado, f.entidad, f.proyecto, f.responsable]
        .some(v => v && String(v).toLowerCase().includes(q))
    );
    const por_modulo = {};
    const totales = {};
    for (const m of MODULOS_ALL) {
      por_modulo[m] = filtrarFilas(resultado.por_modulo[m] || []);
      totales[m] = por_modulo[m].length;
    }
    const timeline = filtrarFilas(resultado.timeline);
    return { por_modulo, timeline, totales };
  }, [resultado, busqueda]);

  const graficasTendencia = useMemo(() => {
    if (!resultado) return [];
    const byMonth = {};
    for (const item of resultado.timeline) {
      if (!item.fecha) continue;
      const mes = item.fecha.slice(0, 7); // YYYY-MM
      if (!byMonth[mes]) byMonth[mes] = {};
      byMonth[mes][item.modulo] = (byMonth[mes][item.modulo] || 0) + 1;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, mods]) => ({ mes, ...mods }));
  }, [resultado]);

  // Cargar catálogos al montar
  useEffect(() => {
    const cargar = async () => {
      try {
        const [ent, proy, cont, grp, acr, usr] = await Promise.all([
          apiService.get('/core/entidades'),
          apiService.get('/core/proyectos'),
          apiService.get('/core/contratos'),
          apiService.get('/core/grupos'),
          apiService.get('/core/acreedores'),
          apiService.get('/admin/usuarios'),
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
      const mods = prev.modulos.includes(m)
        ? prev.modulos.filter(x => x !== m)
        : [...prev.modulos, m];
      return { ...prev, modulos: mods.length ? mods : prev.modulos };
    });
  };

  const consultar = useCallback(async () => {
    if (!filtros.modulos.length) { toast.error('Selecciona al menos un módulo'); return; }
    setLoading(true);
    try {
      const body = {
        modulos: filtros.modulos,
        ...(filtros.entidad_id      && { entidad_id:      Number(filtros.entidad_id) }),
        ...(filtros.proyecto_id     && { proyecto_id:     Number(filtros.proyecto_id) }),
        ...(filtros.contrato_id     && { contrato_id:     Number(filtros.contrato_id) }),
        ...(filtros.grupo_id        && { grupo_id:        Number(filtros.grupo_id) }),
        ...(filtros.acreedor_id     && { acreedor_id:     Number(filtros.acreedor_id) }),
        ...(filtros.responsable_uuid && { responsable_uuid: filtros.responsable_uuid }),
        ...(filtros.fecha_desde     && { fecha_desde:     filtros.fecha_desde }),
        ...(filtros.fecha_hasta     && { fecha_hasta:     filtros.fecha_hasta }),
        ...(filtros.estado          && { estado:          filtros.estado }),
      };
      const { data } = await apiService.post('/reportes/consultar', body);
      setResultado(data);
    } catch { toast.error('Error al consultar'); }
    finally { setLoading(false); }
  }, [filtros]);

  // Exportar CSV
  const exportarCSV = () => {
    if (!resultado) return;
    const filas = resultado.timeline;
    if (!filas.length) { toast.error('No hay datos para exportar'); return; }
    const cabecera = ['Módulo', 'Título', 'Estado', 'Fecha', 'Entidad', 'Proyecto', 'Responsable', 'Monto'];
    const rows = filas.map(f => [
      MODULO_CONFIG[f.modulo]?.label || f.modulo,
      fmt(f.titulo), fmt(f.estado), fmtFecha(f.fecha),
      fmt(f.entidad), fmt(f.proyecto), fmt(f.responsable),
      f.monto != null ? Number(f.monto) : '',
    ]);
    const csv = [cabecera, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'reporte.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar PDF completo
  const exportarPDF = () => {
    if (!resultado) return;
    if (!resultado.timeline.length) { toast.error('No hay datos para exportar'); return; }
    generarReportePDF(resultado, filtros, catalogos);
  };

  const totalRegistros = resultado ? resultado.timeline.length : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-2">
          <BarChart2 /> Reportes
        </h1>
        <p className="text-sm text-gray-500 mt-1">Consulta y exporta información cruzada de todos los módulos del sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Panel de filtros ────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 sticky top-6">

            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Módulos</h2>
            <div className="grid grid-cols-2 gap-2">
              {MODULOS_ALL.map(m => {
                const cfg = MODULO_CONFIG[m];
                const Icon = cfg.icon;
                const active = filtros.modulos.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggleModulo(m)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide border rounded transition-all ${
                      active
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={11} /> {cfg.label}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Catálogos</h2>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Entidad</label>
                <SearchableSelect
                  options={catalogos.entidades}
                  value={filtros.entidad_id}
                  onChange={v => setFiltros(p => ({ ...p, entidad_id: v }))}
                  placeholder="Todas las entidades"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Proyecto</label>
                <SearchableSelect
                  options={catalogos.proyectos}
                  value={filtros.proyecto_id}
                  onChange={v => setFiltros(p => ({ ...p, proyecto_id: v }))}
                  placeholder="Todos los proyectos"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Contrato</label>
                <SearchableSelect
                  options={catalogos.contratos}
                  value={filtros.contrato_id}
                  onChange={v => setFiltros(p => ({ ...p, contrato_id: v }))}
                  placeholder="Todos los contratos"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Grupo / Área</label>
                <SearchableSelect
                  options={catalogos.grupos}
                  value={filtros.grupo_id}
                  onChange={v => setFiltros(p => ({ ...p, grupo_id: v }))}
                  placeholder="Todos los grupos"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Acreedor</label>
                <SearchableSelect
                  options={catalogos.acreedores}
                  value={filtros.acreedor_id}
                  onChange={v => setFiltros(p => ({ ...p, acreedor_id: v }))}
                  placeholder="Todos los acreedores"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Responsable</label>
                <SearchableSelect
                  options={catalogos.usuarios}
                  value={filtros.responsable_uuid}
                  onChange={v => setFiltros(p => ({ ...p, responsable_uuid: v }))}
                  placeholder="Todos"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Rango de fechas</h2>
              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Desde</label>
                <input
                  type="date"
                  value={filtros.fecha_desde}
                  onChange={e => setFiltros(p => ({ ...p, fecha_desde: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Hasta</label>
                <input
                  type="date"
                  value={filtros.fecha_hasta}
                  onChange={e => setFiltros(p => ({ ...p, fecha_hasta: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Estado (texto libre)</label>
              <input
                type="text"
                value={filtros.estado}
                onChange={e => setFiltros(p => ({ ...p, estado: e.target.value }))}
                placeholder="ej. pendiente, liberado…"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 mt-1"
              />
            </div>

            <button
              onClick={consultar}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm uppercase tracking-widest rounded transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Search size={15} /> Consultar</>
              )}
            </button>
          </div>
        </div>

        {/* ── Panel de resultados ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {resultado && (
            <>
              {/* Barra de búsqueda */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar en los resultados por título, estado, entidad, responsable…"
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>

              {/* Barra superior: toggle + export + totales */}
              <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">
                    <span className="font-bold text-indigo-700">{resultadoFiltrado?.timeline.length ?? 0}</span> registros
                    {busqueda && <span className="text-gray-400 text-xs ml-1">(filtrados de {totalRegistros})</span>}
                  </span>
                  <div className="flex flex-wrap gap-1 ml-2">
                    {Object.entries(resultadoFiltrado?.totales || {}).filter(([, n]) => n > 0).map(([m, n]) => {
                      const cfg = MODULO_CONFIG[m] || {};
                      return (
                        <span key={m} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg || 'bg-gray-100'} ${cfg.color || 'text-gray-600'}`}>
                          {cfg.label || m}: {n}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle vista */}
                  <div className="flex rounded border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setVista('modulo')}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors ${vista === 'modulo' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <List size={12} /> Por módulo
                    </button>
                    <button
                      onClick={() => setVista('timeline')}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors ${vista === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <AlignLeft size={12} /> Timeline
                    </button>
                    <button
                      onClick={() => setVista('graficas')}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors ${vista === 'graficas' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <PieIcon size={12} /> Gráficas
                    </button>
                  </div>

                  {/* Exportar */}
                  <button
                    onClick={exportarCSV}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-300 rounded hover:bg-emerald-50 transition-colors"
                  >
                    <Download size={12} /> CSV
                  </button>
                  <button
                    onClick={exportarPDF}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors"
                  >
                    <Download size={12} /> PDF
                  </button>
                </div>
              </div>

              {/* Vista: Por módulo */}
              {vista === 'modulo' && (
                <div className="space-y-3">
                  {MODULOS_ALL.map(m => (
                    resultadoFiltrado?.por_modulo[m]?.length > 0 && (
                      <TablaModulo key={m} modulo={m} filas={resultadoFiltrado.por_modulo[m]} onIr={navigate} />
                    )
                  ))}
                  {(resultadoFiltrado?.timeline.length ?? 0) === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
                      {busqueda ? `Sin resultados para "${busqueda}".` : 'Sin resultados para los filtros seleccionados.'}
                    </div>
                  )}
                </div>
              )}

              {/* Vista: Timeline */}
              {vista === 'timeline' && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {(resultadoFiltrado?.timeline.length ?? 0) === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      {busqueda ? `Sin resultados para "${busqueda}".` : 'Sin resultados.'}
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

                  {/* Fila 1: Barras por módulo + Donut por estado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Registros por módulo */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Registros por módulo</h3>
                      {graficasPorModulo.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Sin datos</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={graficasPorModulo} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Registros" radius={[0, 4, 4, 0]}>
                              {graficasPorModulo.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Distribución por estado */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Distribución por estado</h3>
                      {graficasEstados.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Sin datos</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={graficasEstados}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={3}
                            >
                              {graficasEstados.map((_, i) => (
                                <Cell key={i} fill={ESTADO_COLORS[i % ESTADO_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              formatter={(v) => <span style={{ fontSize: 11, color: '#4b5563' }}>{v}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Fila 2: Tendencia temporal */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Tendencia temporal (registros por mes)</h3>
                    {graficasTendencia.length === 0 ? (
                      <p className="text-sm text-gray-400 py-8 text-center">Sin datos con fecha registrada</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={graficasTendencia} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                          <defs>
                            {MODULOS_ALL.map(m => (
                              <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={MODULO_COLORS[m]} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={MODULO_COLORS[m]} stopOpacity={0} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(v) => {
                              const cfg = MODULO_CONFIG[v];
                              return <span style={{ fontSize: 11, color: '#4b5563' }}>{cfg ? cfg.label : v}</span>;
                            }}
                          />
                          {graficasPorModulo.map(({ name, color }) => {
                            const key = MODULOS_ALL.find(m => MODULO_CONFIG[m].label === name);
                            if (!key) return null;
                            return (
                              <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={key}
                                stroke={color}
                                fill={`url(#grad-${key})`}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
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
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-16 text-center">
              <BarChart2 size={40} className="mx-auto mb-4 text-indigo-200" />
              <p className="text-gray-400 text-sm">Configura los filtros y haz clic en <span className="font-semibold text-indigo-600">Consultar</span> para ver los resultados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
