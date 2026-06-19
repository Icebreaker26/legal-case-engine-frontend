import { useState, useEffect, useMemo } from 'react';
import { Bell, Clock, AlertTriangle, CheckCheck, Trash2, ExternalLink, BellOff, Check, X } from 'lucide-react';
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
  };
  return rutas[modulo] || null;
};

const TIPO_CONFIG = {
  vencimiento: { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-300', label: 'Vencimiento' },
  alerta:      { icon: AlertTriangle,  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-300',   label: 'Alerta'      },
  default:     { icon: Bell,           color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',  label: 'Sistema'     },
};

const getTipo = (tipo) => TIPO_CONFIG[tipo] || TIPO_CONFIG.default;

const TABS = ['Todas', 'No leídas', 'Vencimientos', 'Sistema'];

export default function Notificaciones() {
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('Todas');
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

  const filtered = useMemo(() => {
    if (tab === 'No leídas')    return notifs.filter(n => !n.leida);
    if (tab === 'Vencimientos') return notifs.filter(n => n.tipo === 'vencimiento');
    if (tab === 'Sistema')      return notifs.filter(n => !n.tipo || n.tipo === 'sistema');
    return notifs;
  }, [notifs, tab]);

  const noLeidas = notifs.filter(n => !n.leida).length;

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
              <button
                onClick={marcarTodasLeidas}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors"
              >
                <CheckCheck size={13} /> Marcar todas leídas
              </button>
            )}
            {notifs.some(n => n.leida) && (
              <button
                onClick={limpiarLeidas}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 border border-red-100 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={13} /> Limpiar leídas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {TABS.map(t => {
          const count = t === 'No leídas' ? noLeidas
            : t === 'Vencimientos' ? notifs.filter(n => n.tipo === 'vencimiento').length
            : t === 'Sistema' ? notifs.filter(n => !n.tipo || n.tipo === 'sistema').length
            : notifs.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-[#002E6D] text-[#002E6D]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t ? 'bg-[#002E6D] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
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
          <p className="text-sm text-gray-400">
            {tab === 'No leídas' ? 'No tienes notificaciones sin leer.' : 'No hay notificaciones en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cfg  = getTipo(n.tipo);
            const Icon = cfg.icon;
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
                {/* Dot no leída */}
                <div className="mt-1 shrink-0">
                  {!n.leida && <span className="block w-2 h-2 rounded-full bg-[#002E6D]" />}
                  {n.leida  && <span className="block w-2 h-2 rounded-full bg-transparent" />}
                </div>

                {/* Icono tipo */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={16} className={cfg.color} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.leida ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                    {n.mensaje}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-gray-400">{fechaStr}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {n.referencia_uuid && getLink(n.modulo, n.referencia_uuid) && (
                    <Link
                      to={getLink(n.modulo, n.referencia_uuid)}
                      onClick={() => !n.leida && marcarLeida(n.id)}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-[#002E6D] hover:text-[#001d4a] transition-colors"
                    >
                      <ExternalLink size={11} /> Ver en {n.modulo || 'sistema'}
                    </Link>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.leida && (
                    <button
                      onClick={() => marcarLeida(n.id)}
                      title="Marcar como leída"
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => eliminar(n.id)}
                    disabled={deletingId === n.id}
                    title="Eliminar"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deletingId === n.id
                      ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <X size={14} />
                    }
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
