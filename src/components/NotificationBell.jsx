import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, CheckCheck, X } from 'lucide-react';
import apiService from '../services/apiService';
import { useNavigate, Link } from 'react-router-dom';

const TIPO_DOT = {
  vencimiento: 'bg-amber-400',
  alerta:      'bg-red-500',
  default:     'bg-blue-500',
};

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
  return rutas[modulo] || `/tutela/${referencia_uuid}`;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto]               = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const { data } = await apiService.get('/notificaciones');
      setNotificaciones(data);
    } catch { /* silencioso */ }
  };

  const marcarLeida = async (id) => {
    try {
      await apiService.patch(`/notificaciones/${id}/leida`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch { /* silencioso */ }
  };

  const marcarTodasLeidas = async () => {
    try {
      await apiService.patch('/notificaciones/todas/leidas');
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch { /* silencioso */ }
  };

  const eliminar = async (id, e) => {
    e.stopPropagation();
    try {
      await apiService.delete(`/notificaciones/${id}`);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch { /* silencioso */ }
  };

  const noLeidas    = notificaciones.filter(n => !n.leida);
  const recientes   = notificaciones.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 text-gray-500 hover:text-[#002E6D] transition-colors rounded-lg hover:bg-gray-100"
      >
        <Bell size={20} />
        {noLeidas.length > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none">
            {noLeidas.length > 9 ? '9+' : noLeidas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-11 w-84 bg-white border border-gray-200 shadow-2xl rounded-2xl z-[200] overflow-hidden" style={{ width: 340 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-bold text-gray-800">Notificaciones</p>
              {noLeidas.length > 0 && (
                <p className="text-[11px] text-gray-400">{noLeidas.length} sin leer</p>
              )}
            </div>
            {noLeidas.length > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#002E6D] hover:text-[#001d4a] transition-colors"
              >
                <CheckCheck size={12} /> Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {recientes.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400 italic">No tienes notificaciones.</p>
              </div>
            ) : recientes.map(n => {
              const dot = TIPO_DOT[n.tipo] || TIPO_DOT.default;
              const fecha = new Date(n.created_at);
              const hoy   = new Date();
              const esHoy = fecha.toDateString() === hoy.toDateString();
              const fechaStr = esHoy
                ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                : fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });

              return (
                <div
                  key={n.id}
                  className={`group flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${n.leida ? 'opacity-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Dot */}
                  <div className="mt-1.5 shrink-0">
                    <span className={`block w-2 h-2 rounded-full ${n.leida ? 'bg-gray-200' : dot}`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.leida ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                      {n.mensaje}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{fechaStr}</span>
                      {n.referencia_uuid && getLink(n.modulo, n.referencia_uuid) && (
                        <button
                          onClick={async () => {
                            if (!n.leida) await marcarLeida(n.id);
                            setAbierto(false);
                            navigate(getLink(n.modulo, n.referencia_uuid));
                          }}
                          className="text-[10px] font-bold text-[#002E6D] hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink size={9} /> Ver
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.leida && (
                      <button onClick={() => marcarLeida(n.id)} className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors" title="Marcar leída">
                        <Check size={12} />
                      </button>
                    )}
                    <button onClick={(e) => eliminar(n.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors" title="Eliminar">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <Link
              to="/notificaciones"
              onClick={() => setAbierto(false)}
              className="block text-center text-xs font-semibold text-[#002E6D] hover:text-[#001d4a] transition-colors"
            >
              Ver todas las notificaciones →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
