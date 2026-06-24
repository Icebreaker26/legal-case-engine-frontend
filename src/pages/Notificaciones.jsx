import { useState, useEffect, useMemo } from 'react';
import { Bell, Clock, AlertTriangle, CheckCheck, Trash2, ExternalLink, BellOff, Check, X, FileText, Mail, Shield, Wallet, Leaf, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

const getLink = (modulo, referencia_uuid) => {
  if (!referencia_uuid) return null;
  const rutas = {
    tutelas:        `/tutela/${referencia_uuid}`,
    contratos:      `/contratos/${referencia_uuid}`,
    comunicaciones: `/comunicaciones/${referencia_uuid}`,
    conformidades:  `/conformidades/${referencia_uuid}`,
    pagos:          `/pagos/${referencia_uuid}`,
    rendimiento:    `/rendimiento/${referencia_uuid}`,
    ambiental:      `/ambiental/${referencia_uuid}`,
  };
  return rutas[modulo] || null;
};

const MODULO_CONFIG = {
  tutelas:        { label: 'Derechos de Petición', color: 'text-blue-400',    bg: 'bg-blue-950/60',    border: 'border-blue-800',    icon: FileText  },
  contratos:      { label: 'Contratos',            color: 'text-pink-400',    bg: 'bg-pink-950/60',    border: 'border-pink-800',    icon: FileText  },
  comunicaciones: { label: 'Comunicaciones',       color: 'text-indigo-400',  bg: 'bg-indigo-950/60',  border: 'border-indigo-800',  icon: Mail      },
  conformidades:  { label: 'Conformidades',        color: 'text-yellow-400',  bg: 'bg-yellow-950/60',  border: 'border-yellow-800',  icon: Shield    },
  pagos:          { label: 'Pagos (PDP)',           color: 'text-sky-400',     bg: 'bg-sky-950/60',     border: 'border-sky-800',     icon: Wallet    },
  ambiental:      { label: 'Derecho Ambiental',    color: 'text-green-400',   bg: 'bg-green-950/60',   border: 'border-green-800',   icon: Leaf      },
  rendimiento:    { label: 'Rendimiento',          color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800', icon: BarChart3 },
};

const getModulo = (m) => MODULO_CONFIG[m] || { label: m || 'Sistema', color: 'text-white', bg: 'bg-slate-800/60', border: 'border-slate-700', icon: Bell };

const TIPO_CONFIG = {
  vencimiento: { icon: Clock,         color: 'text-amber-400', bg: 'bg-amber-950/60',  border: 'border-amber-800',  label: 'Vencimiento' },
  alerta:      { icon: AlertTriangle, color: 'text-red-400',   bg: 'bg-red-950/60',    border: 'border-red-800',    label: 'Alerta'      },
  default:     { icon: Bell,          color: 'text-white', bg: 'bg-slate-800/60',  border: 'border-slate-700',  label: 'Sistema'     },
};
const getTipo = (tipo) => TIPO_CONFIG[tipo] || TIPO_CONFIG.default;

const MODULOS_FILTRO = ['Todos', ...Object.keys(MODULO_CONFIG)];

export default function Notificaciones() {
  const navigate = useNavigate();
  const [notifs, setNotifs]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tabTipo, setTabTipo]       = useState('Todos');
  const [tabModulo, setTabModulo]   = useState('Todos');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    try {
      const { data } = await apiService.get('/notificaciones');
      setNotifs(data);
    } catch { toast.error('Error al cargar notificaciones'); }
    finally  { setLoading(false); }
  };

  const marcarLeida = async (id) => {
    try {
      await apiService.patch(`/notificaciones/${id}/leida`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch { toast.error('Error al actualizar'); }
  };

  const marcarTodasLeidas = async () => {
    try {
      await apiService.patch('/notificaciones/todas/leidas');
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
      toast.success('Todas marcadas como leídas');
    } catch { toast.error('Error al actualizar'); }
  };

  const eliminar = async (id) => {
    setDeletingId(id);
    try {
      await apiService.delete(`/notificaciones/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch { toast.error('Error al eliminar'); }
    finally  { setDeletingId(null); }
  };

  const limpiarLeidas = async () => {
    try {
      await apiService.delete('/notificaciones/leidas/limpiar');
      setNotifs(prev => prev.filter(n => !n.leida));
      toast.success('Notificaciones leídas eliminadas');
    } catch { toast.error('Error al limpiar'); }
  };

  const noLeidas = notifs.filter(n => !n.leida).length;

  const filtered = useMemo(() => {
    let result = notifs;
    if (tabTipo === 'No leídas')    result = result.filter(n => !n.leida);
    if (tabTipo === 'Vencimientos') result = result.filter(n => n.tipo === 'vencimiento');
    if (tabTipo === 'Alertas')      result = result.filter(n => n.tipo === 'alerta');
    if (tabModulo !== 'Todos')      result = result.filter(n => (n.modulo || 'tutelas') === tabModulo);
    return result;
  }, [notifs, tabTipo, tabModulo]);

  const TABS_TIPO = [
    { id: 'Todos',        label: 'TODAS',        count: notifs.length },
    { id: 'No leídas',    label: 'SIN LEER',     count: noLeidas },
    { id: 'Vencimientos', label: 'VENCIMIENTOS', count: notifs.filter(n => n.tipo === 'vencimiento').length },
    { id: 'Alertas',      label: 'ALERTAS',      count: notifs.filter(n => n.tipo === 'alerta').length },
  ];

  return (
    <div className="pb-16">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium tracking-[0.2em] text-white uppercase">
            {'>'} NOTIFICACIONES
          </h1>
          <p className="text-[11px] text-emerald-900 tracking-[0.15em] mt-1 font-mono">
            {noLeidas > 0 ? `${noLeidas} SIN LEER` : 'TODO AL DÍA'}
            {notifs.length > 0 && ` · ${notifs.length} EN TOTAL`}
          </p>
        </div>

        {notifs.length > 0 && (
          <div className="flex gap-2">
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white border border-slate-700 hover:border-slate-500 hover:text-white transition-all"
              >
                <CheckCheck size={12} /> Marcar leídas
              </button>
            )}
            {notifs.some(n => n.leida) && (
              <button
                onClick={limpiarLeidas}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-900 hover:border-red-500 hover:text-red-300 transition-all"
              >
                <Trash2 size={12} /> Limpiar leídas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs tipo */}
      <div className="flex gap-0 mb-6 border-b border-slate-800">
        {TABS_TIPO.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTabTipo(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-[0.15em] border-b-2 -mb-px transition-colors ${
              tabTipo === id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-white hover:text-white'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 font-bold ${
                tabTipo === id ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-white'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtro por módulo */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MODULOS_FILTRO.map(m => {
          const cfg = m === 'Todos' ? null : getModulo(m);
          const isActive = tabModulo === m;
          const count = m === 'Todos' ? notifs.length : notifs.filter(n => (n.modulo || 'tutelas') === m).length;
          if (count === 0 && m !== 'Todos') return null;
          return (
            <button
              key={m}
              onClick={() => setTabModulo(m)}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                isActive
                  ? 'bg-slate-700 text-white border-slate-500'
                  : 'bg-transparent text-white border-slate-700 hover:border-slate-500 hover:text-white'
              }`}
            >
              {cfg && <cfg.icon size={10} className={isActive ? 'text-white' : cfg.color} />}
              {m === 'Todos' ? 'TODOS' : cfg.label}
              <span className={`text-[9px] ${isActive ? 'text-white' : 'text-slate-600'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <BellOff size={28} className="text-slate-700" />
          <p className="text-xs text-white uppercase tracking-widest">Sin notificaciones en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const tipoCfg   = getTipo(n.tipo);
            const moduloCfg = getModulo(n.modulo || 'tutelas');
            const TipoIcon  = tipoCfg.icon;
            const fecha     = new Date(n.created_at);
            const hoy       = new Date();
            const esHoy     = fecha.toDateString() === hoy.toDateString();
            const fechaStr  = esHoy
              ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              : fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            const destino = n.referencia_uuid ? getLink(n.modulo, n.referencia_uuid) : null;
            const handleCardClick = () => {
              if (!n.leida) marcarLeida(n.id);
              navigate(destino);
            };

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 border transition-all ${
                  n.leida
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-slate-800/70 border-slate-600 hover:border-slate-400'
                } ${destino ? 'cursor-pointer' : ''}`}
                onClick={destino ? handleCardClick : undefined}
              >
                {/* Dot no leído */}
                <div className="mt-2 shrink-0">
                  <span className={`block w-1.5 h-1.5 rounded-full ${n.leida ? 'bg-transparent' : 'bg-emerald-400'}`} />
                </div>

                {/* Icono tipo */}
                <div className={`w-8 h-8 flex items-center justify-center shrink-0 border ${tipoCfg.bg} ${tipoCfg.border}`}>
                  <TipoIcon size={14} className={tipoCfg.color} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug font-mono ${n.leida ? 'text-slate-400' : 'text-white'}`}>
                    {n.mensaje}
                  </p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="text-[10px] text-white font-mono">{fechaStr}</span>

                    {/* Badge módulo */}
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${moduloCfg.bg} ${moduloCfg.border} ${moduloCfg.color}`}>
                      <moduloCfg.icon size={8} />
                      {moduloCfg.label}
                    </span>

                    {/* Badge tipo */}
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${tipoCfg.bg} ${tipoCfg.border} ${tipoCfg.color}`}>
                      {tipoCfg.label}
                    </span>
                  </div>

                  {destino && (
                    <Link
                      to={destino}
                      onClick={e => { e.stopPropagation(); if (!n.leida) marcarLeida(n.id); }}
                      className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-300 transition-colors"
                    >
                      <ExternalLink size={10} /> [ VER EN {moduloCfg.label} ]
                    </Link>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); if (!n.leida) marcarLeida(n.id); }}
                    disabled={n.leida}
                    title={n.leida ? 'Ya leída' : 'Marcar como leída'}
                    className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                      n.leida
                        ? 'text-slate-600 border-slate-800 cursor-default'
                        : 'text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    <Check size={11} /> Leída
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); eliminar(n.id); }}
                    disabled={deletingId === n.id}
                    title="Eliminar"
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-900 hover:bg-red-950 transition-colors"
                  >
                    {deletingId === n.id
                      ? <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin" />
                      : <><X size={11} /> Borrar</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
