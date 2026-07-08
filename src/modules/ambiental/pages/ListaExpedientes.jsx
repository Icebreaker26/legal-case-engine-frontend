import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
  Plus, Search, FileText, Clock, CheckCircle, AlertTriangle,
  Archive, ChevronRight, Calendar, X, Leaf, Zap, ChevronDown, Check, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const ESTADOS = ['Todos', 'Pendiente', 'Analizado', 'Revisado', 'Archivado', 'Cerrado'];
const TIPOS = ['Todos', 'expediente', 'auto', 'resolución', 'concepto'];
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

const estadoConfig = {
  'Pendiente':  { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400',  icon: <Clock size={11} /> },
  'Analizado':  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400',   icon: <Zap size={11} /> },
  'Revisado':   { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400',  icon: <CheckCircle size={11} /> },
  'Archivado':  { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400',   icon: <Archive size={11} /> },
  'Cerrado':    { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400',  icon: <CheckCircle size={11} /> },
};

const riesgoConfig = {
  'Crítico': { bg: 'bg-red-100',    text: 'text-red-700' },
  'Alto':    { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Medio':   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Bajo':    { bg: 'bg-green-100',  text: 'text-green-700' },
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
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
          selected
            ? 'bg-green-700 text-white'
            : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
        }`}
      >
        <span className="max-w-[110px] truncate">{selected || allLabel}</span>
        {selected
          ? <X size={11} onClick={e => { e.stopPropagation(); onChange(allLabel); setQuery(''); }} className="shrink-0 opacity-80 hover:opacity-100" />
          : <ChevronDown size={11} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
                placeholder="Buscar..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"><X size={12} /></button>}
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            <li
              onClick={() => { onChange(allLabel); setOpen(false); setQuery(''); }}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${value === allLabel ? 'bg-green-50 text-green-700 font-bold' : 'hover:bg-gray-50 text-gray-500'}`}
            >
              {allLabel}
              {value === allLabel && <Check size={12} />}
            </li>
            {filtered.filter(o => o !== allLabel).map(o => (
              <li
                key={o}
                onClick={() => { onChange(o); setOpen(false); setQuery(''); }}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${value === o ? 'bg-green-50 text-green-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <span className="truncate">{o}</span>
                {value === o && <Check size={12} className="shrink-0 ml-2" />}
              </li>
            ))}
            {filtered.filter(o => o !== allLabel).length === 0 && (
              <li className="px-3 py-3 text-xs text-gray-400 text-center italic">Sin resultados</li>
            )}
          </ul>
          {options.length > 8 && (
            <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400">
              {filtered.length - 1} de {options.length - 1} opciones
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const cfg = estadoConfig[estado] || estadoConfig['Pendiente'];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {estado || 'Pendiente'}
    </span>
  );
}

function RiesgoBadge({ nivel }) {
  if (!nivel) return null;
  const cfg = riesgoConfig[nivel] || {};
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {nivel}
    </span>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
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
        e.proyecto_nombre?.toLowerCase().includes(q);
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
    setOrdenar('reciente');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Derecho Ambiental</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de expedientes, autos y resoluciones — Ley 99/93 · Decreto 1076/2015</p>
        </div>
        <button
          onClick={() => navigate('/ambiental/nuevo')}
          className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors shadow-sm"
        >
          <Plus size={18} /> Nuevo Expediente
        </button>
      </div>

      {/* KPIs */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} sub="expedientes registrados" color="bg-green-50 text-green-700" icon={<Leaf size={20} />} />
          <StatCard label="Pendientes" value={stats.pendientes} sub="sin análisis LLM" color="bg-orange-50 text-orange-500" icon={<Clock size={20} />} />
          <StatCard label="Analizados" value={stats.analizados} sub="con respuesta del LLM" color="bg-blue-50 text-blue-600" icon={<Zap size={20} />} />
          <StatCard label="Riesgo Alto/Crítico" value={stats.criticos} sub="requieren atención urgente" color="bg-red-50 text-red-600" icon={<AlertTriangle size={20} />} />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        {/* Barra de búsqueda */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, número, entidad, responsable o proyecto..."
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Fila de filtros */}
        <div className="flex flex-wrap items-center px-2 py-1 gap-x-1 gap-y-1">

          {/* Estado */}
          <div className="flex items-center gap-1.5 px-2 py-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Estado</span>
            {ESTADOS.map(e => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filtroEstado === e
                    ? 'bg-green-700 text-white'
                    : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Tipo */}
          <div className="flex items-center gap-1.5 px-2 py-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Tipo</span>
            {TIPOS.map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filtroTipo === t
                    ? 'bg-green-700 text-white'
                    : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Entidad / Responsable / Proyecto */}
          {entidades.length > 1 && (
            <div className="px-2 py-2">
              <FilterSelect label="Entidad" options={entidades} value={filtroEntidad} onChange={setFiltroEntidad} allLabel="Todas" />
            </div>
          )}
          {responsables.length > 1 && (
            <div className="px-2 py-2">
              <FilterSelect label="Responsable" options={responsables} value={filtroResponsable} onChange={setFiltroResponsable} />
            </div>
          )}
          {proyectos.length > 1 && (
            <div className="px-2 py-2">
              <FilterSelect label="Proyecto" options={proyectos} value={filtroProyecto} onChange={setFiltroProyecto} />
            </div>
          )}

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Orden */}
          <div className="flex items-center gap-1.5 px-2 py-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 flex items-center gap-1">
              <ArrowUpDown size={11} /> Orden
            </span>
            {ORDENES.map(o => (
              <button
                key={o.value}
                onClick={() => setOrdenar(o.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  ordenar === o.value
                    ? 'bg-green-700 text-white'
                    : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Limpiar */}
          {hayFiltros && (
            <>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <button onClick={limpiar} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <X size={11} /> Limpiar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3">
          <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Cargando expedientes...</span>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Leaf size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="font-bold text-gray-400">
            {hayFiltros ? 'No hay resultados para estos filtros' : 'No hay expedientes registrados'}
          </p>
          {hayFiltros ? (
            <button onClick={limpiar} className="mt-3 text-sm text-green-700 hover:underline">Limpiar filtros</button>
          ) : (
            <button onClick={() => navigate('/ambiental/nuevo')} className="mt-3 text-sm text-green-700 hover:underline">
              Registrar el primer expediente
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 -mt-4">
            Mostrando {filtrados.length} de {expedientes.length}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map(exp => {
              const cfg = estadoConfig[exp.estado] || estadoConfig['Pendiente'];
              return (
                <div
                  key={exp.id}
                  onClick={() => navigate(`/ambiental/expediente/${exp.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-green-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-lg capitalize">
                        {exp.tipo_instrumento}
                      </span>
                      {exp.nivel_riesgo && <RiesgoBadge nivel={exp.nivel_riesgo} />}
                    </div>
                    <EstadoBadge estado={exp.estado} />
                  </div>

                  <h3 className="font-bold text-gray-800 leading-snug mb-1 group-hover:text-green-700 transition-colors line-clamp-2">
                    {exp.titulo}
                  </h3>

                  {exp.numero_expediente && (
                    <p className="text-xs text-gray-400 mb-1">Exp. <span className="font-semibold text-gray-600">{exp.numero_expediente}</span></p>
                  )}
                  {exp.entidad_nombre && (
                    <p className="text-xs text-gray-400 mb-1">Entidad: <span className="font-semibold text-gray-600">{exp.entidad_nombre}</span></p>
                  )}
                  {exp.responsable_nombre && (
                    <p className="text-xs text-gray-400 mb-1">Responsable: <span className="font-semibold text-gray-600">{exp.responsable_nombre}</span></p>
                  )}
                  {exp.proyecto_nombre && (
                    <p className="text-xs text-gray-400 mb-3">Proyecto: <span className="font-semibold text-gray-600">{exp.proyecto_nombre}</span></p>
                  )}
                  {!exp.responsable_nombre && !exp.proyecto_nombre && <div className="mb-3" />}

                  {exp.fecha_vencimiento && !['Cerrado', 'Archivado'].includes(exp.estado) && (() => {
                    const dias = Math.ceil((new Date(exp.fecha_vencimiento) - new Date()) / 86400000);
                    const vencido = dias < 0;
                    const urgente = dias >= 0 && dias <= 7;
                    return (
                      <p className={`text-xs px-2 py-1 rounded-lg mb-2 font-semibold ${
                        vencido  ? 'bg-red-100 text-red-700' :
                        urgente  ? 'bg-orange-100 text-orange-700' :
                                   'bg-gray-50 text-gray-500'
                      }`}>
                        {vencido
                          ? `⚠️ Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
                          : dias === 0
                            ? '🔴 Vence hoy'
                            : `⏳ Vence en ${dias} día${dias !== 1 ? 's' : ''}`
                        }
                      </p>
                    );
                  })()}
                  {exp.plazo_respuesta && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mb-3 line-clamp-1">
                      ⏱ {exp.plazo_respuesta}
                    </p>
                  )}

                  {exp.resumen_analisis && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3 border-l-2 border-green-200 pl-2">
                      {exp.resumen_analisis}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar size={11} />
                      {new Date(exp.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-green-600 transition-colors" />
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
