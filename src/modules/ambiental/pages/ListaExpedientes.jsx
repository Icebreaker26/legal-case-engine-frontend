import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
  Plus, Search, Clock, CheckCircle, AlertTriangle,
  Archive, ChevronRight, Calendar, X, Leaf, Zap,
  ChevronDown, Check, AlertCircle, Timer, Building2, User, FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const ESTADOS = ['Todos', 'Pendiente', 'Analizado', 'Revisado', 'Archivado', 'Cerrado'];
const TIPOS = ['Todos', 'expediente', 'auto', 'resolución', 'concepto', 'otros'];
const ORDENES = [
  { value: 'reciente',    label: 'Más reciente' },
  { value: 'urgencia',   label: 'Urgencia' },
  { value: 'vencimiento', label: 'Vencimiento próximo' },
];

const RIESGO_PESO = { 'Crítico': 0, 'Alto': 1, 'Medio': 2, 'Bajo': 3 };

function urgencyScore(exp) {
  if (['Cerrado', 'Archivado'].includes(exp.estado)) return 9999999;
  const hoy = new Date();
  const diasScore = exp.fecha_vencimiento
    ? Math.ceil((new Date(exp.fecha_vencimiento) - hoy) / 86400000)
    : 99999;
  const riesgoScore = RIESGO_PESO[exp.nivel_riesgo] ?? 4;
  return diasScore * 10 + riesgoScore;
}

// Borde izquierdo de la card según nivel de riesgo
const riesgoBorder = {
  'Crítico': 'border-l-red-400',
  'Alto':    'border-l-orange-400',
  'Medio':   'border-l-yellow-400',
  'Bajo':    'border-l-green-500',
};

const estadoConfig = {
  'Pendiente': {
    bg: 'bg-amber-50 border border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
    pulse: true,
    icon: <Clock size={10} />,
  },
  'Analizado': {
    bg: 'bg-blue-50 border border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
    pulse: false,
    icon: <Zap size={10} />,
  },
  'Revisado': {
    bg: 'bg-green-50 border border-green-200',
    text: 'text-green-700',
    dot: 'bg-green-500',
    pulse: false,
    icon: <CheckCircle size={10} />,
  },
  'Archivado': {
    bg: 'bg-gray-100 border border-gray-200',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    pulse: false,
    icon: <Archive size={10} />,
  },
  'Cerrado': {
    bg: 'bg-gray-100 border border-gray-200',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    pulse: false,
    icon: <CheckCircle size={10} />,
  },
};

const riesgoConfig = {
  'Crítico': { bg: 'bg-red-50 border border-red-200',    text: 'text-red-600' },
  'Alto':    { bg: 'bg-orange-50 border border-orange-200', text: 'text-orange-600' },
  'Medio':   { bg: 'bg-yellow-50 border border-yellow-200', text: 'text-yellow-700' },
  'Bajo':    { bg: 'bg-green-50 border border-green-200',  text: 'text-green-700' },
};

function FilterSelect({ label, options, value, onChange, allLabel = 'Todos' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(o => !query || o.toLowerCase().includes(query.toLowerCase()));
  const selected = value !== allLabel ? value : null;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          selected
            ? 'bg-green-700 text-white'
            : 'text-gray-500 hover:text-green-700 hover:bg-green-50 border border-transparent'
        }`}
      >
        <span className="max-w-[110px] truncate">{selected || allLabel}</span>
        {selected
          ? <X size={10} onClick={e => { e.stopPropagation(); onChange(allLabel); setQuery(''); }} className="shrink-0 opacity-80 hover:opacity-100" />
          : <ChevronDown size={10} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
                placeholder="Buscar..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X size={10} /></button>}
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li
              onClick={() => { onChange(allLabel); setOpen(false); setQuery(''); }}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${value === allLabel ? 'bg-green-50 text-green-700 font-bold' : 'hover:bg-gray-50 text-gray-500'}`}
            >
              {allLabel}
              {value === allLabel && <Check size={11} />}
            </li>
            {filtered.filter(o => o !== allLabel).map(o => (
              <li
                key={o}
                onClick={() => { onChange(o); setOpen(false); setQuery(''); }}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${value === o ? 'bg-green-50 text-green-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <span className="truncate">{o}</span>
                {value === o && <Check size={11} className="shrink-0 ml-2" />}
              </li>
            ))}
            {filtered.filter(o => o !== allLabel).length === 0 && (
              <li className="px-3 py-3 text-xs text-gray-400 text-center italic">Sin resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const cfg = estadoConfig[estado] || estadoConfig['Pendiente'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {estado || 'Pendiente'}
    </span>
  );
}

function RiesgoBadge({ nivel }) {
  if (!nivel) return null;
  const cfg = riesgoConfig[nivel] || {};
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {nivel}
    </span>
  );
}

function DeadlineBadge({ fecha_vencimiento, estado }) {
  if (!fecha_vencimiento || ['Cerrado', 'Archivado'].includes(estado)) return null;
  const dias = Math.ceil((new Date(fecha_vencimiento) - new Date()) / 86400000);
  const vencido = dias < 0;
  const urgente = dias >= 0 && dias <= 7;

  if (vencido) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
      <AlertCircle size={11} className="shrink-0" />
      Vencido {Math.abs(dias)}d
    </span>
  );
  if (urgente) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
      <Timer size={11} className="shrink-0" />
      {dias === 0 ? 'Vence hoy' : `${dias}d`}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
      <Calendar size={11} className="shrink-0" />
      {dias}d
    </span>
  );
}

function StatsBar({ stats, loading }) {
  if (loading) return null;
  const items = [
    { label: 'Total', value: stats.total, sub: 'registrados', icon: <Leaf size={22} />, color: 'text-green-700', dot: 'bg-green-500' },
    { label: 'Pendientes', value: stats.pendientes, sub: 'sin análisis', icon: <Clock size={22} />, color: 'text-amber-600', dot: 'bg-amber-400' },
    { label: 'Analizados', value: stats.analizados, sub: 'con LLM', icon: <Zap size={22} />, color: 'text-blue-600', dot: 'bg-blue-500' },
    { label: 'Alto riesgo', value: stats.criticos, sub: 'urgentes', icon: <AlertTriangle size={22} />, color: 'text-red-600', dot: 'bg-red-400' },
  ];
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl flex divide-x divide-gray-100 overflow-hidden">
      {items.map((item, i) => (
        <div key={i} className="flex-1 flex items-center gap-3 px-5 py-4">
          <div className={`p-2 rounded-lg bg-gray-50 ${item.color} shrink-0`}>{item.icon}</div>
          <div className="min-w-0">
            <p className={`text-2xl font-black tracking-tight leading-none ${item.color}`}>{item.value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ListaExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroEntidad, setFiltroEntidad] = useState('Todas');
  const [filtroResponsable, setFiltroResponsable] = useState('Todos');
  const [filtroProyecto, setFiltroProyecto] = useState('Todos');
  const [ordenar, setOrdenar] = useState('reciente');
  const [porPagina, setPorPagina] = useState(25);
  const [pagina, setPagina] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await apiService.get('/ambiental/expedientes');
        setExpedientes(data);
      } catch {
        toast.error('Error al cargar expedientes');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const stats = useMemo(() => {
    const total = expedientes.length;
    const pendientes = expedientes.filter(e => (e.estado || 'Pendiente') === 'Pendiente').length;
    const analizados = expedientes.filter(e => e.estado === 'Analizado').length;
    const criticos = expedientes.filter(e => e.nivel_riesgo === 'Crítico' || e.nivel_riesgo === 'Alto').length;
    return { total, pendientes, analizados, criticos };
  }, [expedientes]);

  const entidades = useMemo(() => {
    const set = new Set(expedientes.map(e => e.entidad_nombre).filter(Boolean));
    return ['Todas', ...Array.from(set).sort()];
  }, [expedientes]);

  const responsables = useMemo(() => {
    const set = new Set(expedientes.map(e => e.responsable_nombre).filter(Boolean));
    return ['Todos', ...Array.from(set).sort()];
  }, [expedientes]);

  const proyectos = useMemo(() => {
    const set = new Set(expedientes.map(e => e.proyecto_nombre).filter(Boolean));
    return ['Todos', ...Array.from(set).sort()];
  }, [expedientes]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    const lista = expedientes.filter(e => {
      const matchBusqueda = !busqueda ||
        e.titulo?.toLowerCase().includes(q) ||
        e.numero_expediente?.toLowerCase().includes(q) ||
        e.entidad_nombre?.toLowerCase().includes(q) ||
        e.responsable_nombre?.toLowerCase().includes(q) ||
        e.proyecto_nombre?.toLowerCase().includes(q) ||
        e.resumen_analisis?.toLowerCase().includes(q);
      const matchEstado = filtroEstado === 'Todos' || (e.estado || 'Pendiente') === filtroEstado;
      const matchTipo = filtroTipo === 'Todos' || e.tipo_instrumento === filtroTipo;
      const matchEntidad = filtroEntidad === 'Todas' || e.entidad_nombre === filtroEntidad;
      const matchResponsable = filtroResponsable === 'Todos' || e.responsable_nombre === filtroResponsable;
      const matchProyecto = filtroProyecto === 'Todos' || e.proyecto_nombre === filtroProyecto;
      return matchBusqueda && matchEstado && matchTipo && matchEntidad && matchResponsable && matchProyecto;
    });

    if (ordenar === 'urgencia') {
      lista.sort((a, b) => urgencyScore(a) - urgencyScore(b));
    } else if (ordenar === 'vencimiento') {
      lista.sort((a, b) => {
        if (!a.fecha_vencimiento && !b.fecha_vencimiento) return 0;
        if (!a.fecha_vencimiento) return 1;
        if (!b.fecha_vencimiento) return -1;
        return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
      });
    } else {
      lista.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return lista;
  }, [expedientes, busqueda, filtroEstado, filtroTipo, filtroEntidad, filtroResponsable, filtroProyecto, ordenar]);

  const hayFiltros = busqueda || filtroEstado !== 'Todos' || filtroTipo !== 'Todos' || filtroEntidad !== 'Todas' || filtroResponsable !== 'Todos' || filtroProyecto !== 'Todos';

  const limpiar = () => {
    setBusqueda(''); setFiltroEstado('Todos'); setFiltroTipo('Todos');
    setFiltroEntidad('Todas'); setFiltroResponsable('Todos'); setFiltroProyecto('Todos');
    setOrdenar('reciente'); setPagina(1);
  };

  const totalPaginas = porPagina === 0 ? 1 : Math.ceil(filtrados.length / porPagina);
  const paginaActual = Math.min(pagina, totalPaginas || 1);
  const paginados = porPagina === 0 ? filtrados : filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado, filtroTipo, filtroEntidad, filtroResponsable, filtroProyecto, ordenar, porPagina]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-green-700/60 uppercase tracking-widest mb-1">Derecho Ambiental</p>
          <h1 className="text-2xl font-black text-gray-800 leading-tight">Expedientes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Ley 99/93 · Decreto 1076/2015</p>
        </div>
        <button
          onClick={() => navigate('/ambiental/nuevo')}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={15} /> Nuevo expediente
        </button>
      </div>

      {/* KPIs */}
      <StatsBar stats={stats} loading={loading} />

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, número, entidad, responsable o resumen..."
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center px-4 py-2.5 gap-3">
          <FilterSelect label="Estado" options={ESTADOS} value={filtroEstado} onChange={setFiltroEstado} />
          <FilterSelect label="Tipo" options={TIPOS} value={filtroTipo} onChange={setFiltroTipo} />
          {entidades.length > 1 && (
            <FilterSelect label="Entidad" options={entidades} value={filtroEntidad} onChange={setFiltroEntidad} allLabel="Todas" />
          )}
          {responsables.length > 1 && (
            <FilterSelect label="Responsable" options={responsables} value={filtroResponsable} onChange={setFiltroResponsable} />
          )}
          {proyectos.length > 1 && (
            <FilterSelect label="Proyecto" options={proyectos} value={filtroProyecto} onChange={setFiltroProyecto} />
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Orden</span>
            <select
              value={ordenar}
              onChange={e => setOrdenar(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
            >
              {ORDENES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {hayFiltros && (
            <button onClick={limpiar} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
              <X size={10} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Cargando expedientes...</span>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Leaf size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400 text-sm">
            {hayFiltros ? 'Sin resultados para estos filtros' : 'No hay expedientes registrados'}
          </p>
          {hayFiltros ? (
            <button onClick={limpiar} className="mt-3 text-xs text-green-700 hover:underline">Limpiar filtros</button>
          ) : (
            <button onClick={() => navigate('/ambiental/nuevo')} className="mt-3 text-xs text-green-700 hover:underline">
              Registrar el primer expediente
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Mostrando {paginados.length} de {filtrados.length}{filtrados.length !== expedientes.length ? ` · ${expedientes.length} total` : ''}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Por página</span>
              {[10, 25, 50, 0].map(n => (
                <button
                  key={n}
                  onClick={() => setPorPagina(n)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${porPagina === n ? 'bg-green-700 text-white' : 'text-gray-400 hover:bg-green-50 hover:text-green-700'}`}
                >
                  {n === 0 ? 'Todos' : n}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginados.map(exp => {
              const borderAccent = exp.nivel_riesgo ? riesgoBorder[exp.nivel_riesgo] : 'border-l-gray-200';
              return (
                <div
                  key={exp.id}
                  onClick={() => navigate(`/ambiental/expediente/${exp.id}`)}
                  className={`bg-white rounded-2xl border border-gray-100 border-l-2 ${borderAccent} shadow-sm cursor-pointer hover:border-green-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 group overflow-hidden`}
                >
                  {/* Cabecera con fondo */}
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest capitalize">
                        {exp.tipo_instrumento}
                      </span>
                      {exp.nivel_riesgo && <RiesgoBadge nivel={exp.nivel_riesgo} />}
                      <DeadlineBadge fecha_vencimiento={exp.fecha_vencimiento} estado={exp.estado} />
                    </div>
                    <EstadoBadge estado={exp.estado} />
                  </div>

                  {/* Cuerpo */}
                  <div className="px-4 pt-3 pb-4">
                    {/* Número de expediente */}
                    {exp.numero_expediente && (
                      <p className="text-[10px] font-semibold text-green-700/60 uppercase tracking-widest mb-1.5">
                        {exp.numero_expediente}
                      </p>
                    )}

                    {/* Título */}
                    <h3 className="font-bold text-gray-800 leading-snug mb-3 group-hover:text-green-700 transition-colors line-clamp-2 text-[15px]">
                      {exp.titulo}
                    </h3>

                    {/* Metadatos con iconos */}
                    <div className="space-y-1.5 mb-3">
                      {exp.entidad_nombre && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Building2 size={11} className="text-gray-300 shrink-0" />
                          <span className="truncate">{exp.entidad_nombre}</span>
                        </div>
                      )}
                      {exp.responsable_nombre && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User size={11} className="text-gray-300 shrink-0" />
                          <span className="truncate">{exp.responsable_nombre}</span>
                        </div>
                      )}
                      {exp.proyecto_nombre && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FolderOpen size={11} className="text-gray-300 shrink-0" />
                          <span className="truncate">{exp.proyecto_nombre}</span>
                        </div>
                      )}
                      {exp.plazo_respuesta && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Timer size={11} className="text-gray-300 shrink-0" />
                          <span className="truncate">{exp.plazo_respuesta}</span>
                        </div>
                      )}
                    </div>

                    {/* Resumen del análisis */}
                    {exp.resumen_analisis && (() => {
                      const texto = exp.resumen_analisis;
                      const match = texto.slice(120).search(/\.\s+[A-ZÁÉÍÓÚ]/);
                      const preview = match !== -1
                        ? texto.slice(120 + match + 2).trim()
                        : texto;
                      return (
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3 bg-gray-50 rounded-lg px-3 py-2">
                          {preview}
                        </p>
                      );
                    })()}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                      <span className="flex items-center gap-1 text-[10px] text-gray-300">
                        <Calendar size={10} />
                        {new Date(exp.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="px-2 text-gray-300 text-xs">…</span>
                  : <button
                      key={n}
                      onClick={() => setPagina(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${paginaActual === n ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-green-50 hover:text-green-700'}`}
                    >{n}</button>
                )}
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
