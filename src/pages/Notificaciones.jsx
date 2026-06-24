import { useState, useEffect, useMemo } from 'react';
import { Bell, Clock, AlertTriangle, CheckCheck, Trash2, ExternalLink, BellOff, Check, X, FileText, Mail, Shield, Wallet, Leaf, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  tutelas:        { label: 'Derechos de Petición', color: 'text-blue-700',   bg: 'bg-blue-50',    icon: FileText   },
  contratos:      { label: 'Contratos',            color: 'text-pink-700',   bg: 'bg-pink-50',    icon: FileText   },
  comunicaciones: { label: 'Comunicaciones',       color: 'text-indigo-700', bg: 'bg-indigo-50',  icon: Mail       },
  conformidades:  { label: 'Conformidades',        color: 'text-yellow-700', bg: 'bg-yellow-50',  icon: Shield     },
  pagos:          { label: 'Pagos (PDP)',           color: 'text-sky-700',    bg: 'bg-sky-50',     icon: Wallet     },
  ambiental:      { label: 'Derecho Ambiental',    color: 'text-green-700',  bg: 'bg-green-50',   icon: Leaf       },
  rendimiento:    { label: 'Rendimiento',          color: 'text-emerald-700',bg: 'bg-emerald-50', icon: BarChart3  },
};

const getModulo = (modulo) => MODULO_CONFIG[modulo] || { label: modulo || 'Sistema', color: 'text-gray-600', bg: 'bg-gray-100', icon: Bell };

const TIPO_CONFIG = {
  vencimiento: { icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50', label: 'Vencimiento' },
  alerta:      { icon: AlertTriangle, color: 'text-red-600',  bg: 'bg-red-50',   label: 'Alerta'      },
  default:     { icon: Bell,          color: 'text-blue-600', bg: 'bg-blue-50',  label: 'Sistema'     },
};
const getTipo = (tipo) => TIPO_CONFIG[tipo] || TIPO_CONFIG.default;

const MODULOS_FILTRO = ['Todos', ...Object.keys(MODULO_CONFIG)];

export default function Notificaciones() {
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
    { id: 'Todos',        label: 'Todas',        count: notifs.length },
    { id: 'No leídas',    label: 'Sin leer',     count: noLeidas },
    { id: 'Vencimientos', label: 'Vencimientos', count: notifs.filter(n => n.tipo === 'vencimiento').length },
    { id: 'Alertas',      label: 'Alertas',      count: notifs.filter(n => n.tipo === 'alerta').length },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-[#002E6D] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Notificaciones</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
              {notifs.length > 0 && ` · ${notifs.length} en total`}
            </p>
          </div>
        </div>
        {notifs.length > 0 && (
          <div className="flex gap-2">
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
                <CheckCheck size={13} /> Marcar todas leídas
              </button>
            )}
            {notifs.some(n => n.leida) && (
              <button onClick={limpiarLeidas} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 size={13} /> Limpiar leídas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs tipo */}
      <div className="flex gap-1 mb-4 border-b border-gray-100">
        {TABS_TIPO.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTabTipo(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tabTipo === id ? 'border-[#002E6D] text-[#002E6D]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tabTipo === id ? 'bg-[#002E6D] text-white' : 'bg-gray-100 text-gray-500'}`}>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isActive
                  ? 'bg-[#002E6D] text-white border-[#002E6D]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cfg && <cfg.icon size={11} />}
              {m === 'Todos' ? 'Todos los módulos' : cfg.label}
              <span className={`px-1 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <BellOff size={20} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No hay notificaciones en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const tipoCfg  = getTipo(n.tipo);
            const moduloCfg = getModulo(n.modulo || 'tutelas');
            const TipoIcon = tipoCfg.icon;
            const fecha = new Date(n.created_at);
            const hoy   = new Date();
            const esHoy = fecha.toDateString() === hoy.toDateString();
            const fechaStr = esHoy
              ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              : fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  n.leida ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {/* Dot */}
                <div className="mt-1.5 shrink-0">
                  <span className={`block w-2 h-2 rounded-full ${n.leida ? 'bg-transparent' : 'bg-[#002E6D]'}`} />
                </div>

                {/* Icono tipo */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tipoCfg.bg}`}>
                  <TipoIcon size={16} className={tipoCfg.color} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.leida ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                    {n.mensaje}
                  </p>
                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    <span className="text-[11px] text-gray-400">{fechaStr}</span>
                    {/* Badge módulo */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${moduloCfg.bg} ${moduloCfg.color}`}>
                      <moduloCfg.icon size={9} />
                      {moduloCfg.label}
                    </span>
                    {/* Badge tipo */}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tipoCfg.bg} ${tipoCfg.color}`}>
                      {tipoCfg.label}
                    </span>
                  </div>
                  {n.referencia_uuid && getLink(n.modulo, n.referencia_uuid) && (
                    <Link
                      to={getLink(n.modulo, n.referencia_uuid)}
                      onClick={() => !n.leida && marcarLeida(n.id)}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#002E6D] hover:text-[#001d4a] transition-colors"
                    >
                      <ExternalLink size={11} /> Ver en {moduloCfg.label}
                    </Link>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.leida && (
                    <button onClick={() => marcarLeida(n.id)} title="Marcar como leída" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => eliminar(n.id)} disabled={deletingId === n.id} title="Eliminar" className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    {deletingId === n.id
                      ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <X size={14} />}
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
