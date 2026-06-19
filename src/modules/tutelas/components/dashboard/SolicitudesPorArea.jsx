import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../../services/apiService';
import toast from 'react-hot-toast';
import { Mail, ChevronDown, Send, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';

export default function SolicitudesPorArea() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [grupos, setGrupos]             = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [expandido, setExpandido]       = useState(null);
  const [respuestas, setRespuestas]     = useState({});
  const [enviando, setEnviando]         = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('Pendiente');

  useEffect(() => {
    apiService.get('/core/grupos')
      .then(({ data }) => setGrupos(data.filter(g => g.is_active)))
      .catch(() => toast.error('Error al cargar grupos'));
  }, []);

  useEffect(() => {
    if (!selectedArea) return;
    setLoading(true);
    apiService.get(`/tutelas/requerimientos/area/${selectedArea}`)
      .then(({ data }) => setSolicitudes(data))
      .catch(() => toast.error('Error al cargar solicitudes del área'))
      .finally(() => setLoading(false));
  }, [selectedArea]);

  const pendientes = solicitudes.filter(s => s.estado !== 'Respondido').length;
  const solicitudesFiltradas = filtroEstado === 'Todos'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtroEstado);

  const handleResponder = async (reqId) => {
    const texto = respuestas[reqId]?.trim();
    if (!texto) return toast.error('Escribe una respuesta antes de enviar');
    setEnviando(reqId);
    try {
      await apiService.patch(`/tutelas/requerimientos/${reqId}/responder-area`, { respuesta_texto: texto });
      setSolicitudes(prev => prev.map(s =>
        s.id === reqId ? { ...s, estado: 'Respondido', respuesta_texto: texto } : s
      ));
      setRespuestas(prev => ({ ...prev, [reqId]: '' }));
      setExpandido(null);
      toast.success('Respuesta enviada y notificación enviada al abogado');
    } catch {
      toast.error('Error al enviar la respuesta');
    } finally {
      setEnviando(null);
    }
  };

  const prioridadConfig = {
    Alta:  { cls: 'bg-red-100 text-red-700',    label: '⚡ Alta' },
    Media: { cls: 'bg-orange-100 text-orange-700', label: 'Media' },
    Baja:  { cls: 'bg-gray-100 text-gray-500',  label: 'Baja' },
  };

  const estadoConfig = {
    'Pendiente':  'bg-orange-100 text-orange-700',
    'En Gestión': 'bg-blue-100 text-blue-700',
    'Respondido': 'bg-green-100 text-green-700',
    'Vencido':    'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Mail size={18} className="text-[#002E6D]" />
          Solicitudes del Área
          {selectedArea && pendientes > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] font-black rounded-full px-2 py-0.5">
              {pendientes} pendiente{pendientes > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {/* Filtro por estado */}
          {selectedArea && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[11px] font-bold">
              {['Pendiente', 'En Gestión', 'Respondido', 'Todos'].map(estado => (
                <button
                  key={estado}
                  onClick={() => { setFiltroEstado(estado); setExpandido(null); }}
                  className={`px-3 py-1.5 transition-colors ${
                    filtroEstado === estado
                      ? 'bg-[#002E6D] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          )}
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-[#002E6D]"
            value={selectedArea}
            onChange={(e) => { setSelectedArea(e.target.value); setExpandido(null); }}
          >
            <option value="">Seleccione un área...</option>
            {grupos.map(g => <option key={g.id} value={g.nombre}>{g.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <div className="w-4 h-4 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
          Cargando solicitudes...
        </div>
      ) : !selectedArea ? (
        <p className="text-sm text-gray-400 text-center py-6">Selecciona un área para ver sus solicitudes pendientes.</p>
      ) : solicitudesFiltradas.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No hay solicitudes con estado <span className="font-bold">{filtroEstado}</span> para esta área.
        </p>
      ) : (
        <div className="space-y-3">
          {solicitudesFiltradas.map(req => {
            const estaVencido = req.fecha_limite && new Date(req.fecha_limite) < new Date() && req.estado !== 'Respondido';
            const diasRestantes = req.fecha_limite
              ? Math.ceil((new Date(req.fecha_limite) - new Date()) / (1000 * 60 * 60 * 24))
              : null;
            const prio = prioridadConfig[req.prioridad] || prioridadConfig.Media;
            const isOpen = expandido === req.id;

            return (
              <div
                key={req.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  estaVencido ? 'border-red-200 bg-red-50/20' :
                  req.estado === 'Respondido' ? 'border-green-100 bg-green-50/10' :
                  'border-gray-100 bg-white'
                }`}
              >
                {/* Fila resumen — clic para expandir */}
                <button
                  className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandido(isOpen ? null : req.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-black text-[#002E6D]">Tutela {req.tutela_radicado}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${prio.cls}`}>{prio.label}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${estadoConfig[req.estado] || ''}`}>{req.estado}</span>
                      {estaVencido && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-600">
                          <AlertTriangle size={10} /> VENCIDO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{req.descripcion}</p>
                    {req.fecha_limite && req.estado !== 'Respondido' && (
                      <p className={`flex items-center gap-1 text-[10px] mt-1 font-bold ${estaVencido ? 'text-red-500' : diasRestantes <= 1 ? 'text-orange-500' : 'text-gray-400'}`}>
                        <Calendar size={10} />
                        {estaVencido ? `Venció el ${new Date(req.fecha_limite).toLocaleDateString('es-CO')}` :
                         diasRestantes === 0 ? 'Vence hoy' :
                         diasRestantes === 1 ? 'Vence mañana' :
                         `Límite: ${new Date(req.fecha_limite).toLocaleDateString('es-CO')} (${diasRestantes}d)`}
                      </p>
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Panel expandido */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/40">
                    {/* Link al expediente */}
                    <button
                      onClick={() => navigate(`/tutela/${req.tutela_id}`)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#002E6D]/5 hover:bg-[#002E6D]/10 border border-[#002E6D]/20 rounded-xl transition-colors text-left"
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#002E6D] tracking-widest">Ver expediente completo</p>
                        <p className="text-xs text-gray-500 mt-0.5">Tutela {req.tutela_radicado} · Vence {req.fecha_vencimiento ? new Date(req.fecha_vencimiento).toLocaleDateString('es-CO') : 'sin fecha'}</p>
                      </div>
                      <ExternalLink size={16} className="text-[#002E6D] shrink-0" />
                    </button>

                    {/* Descripción completa */}
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Solicitud completa</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{req.descripcion}</p>
                    </div>

                    {/* Respuesta previa si existe */}
                    {req.respuesta_texto && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                        <p className="text-[10px] font-black uppercase text-green-700 tracking-widest mb-1">Respuesta enviada</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{req.respuesta_texto}</p>
                      </div>
                    )}

                    {/* Campo de respuesta — solo si no está respondido */}
                    {req.estado !== 'Respondido' && (
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Tu respuesta</p>
                        <textarea
                          rows={4}
                          placeholder="Escribe la información solicitada o adjunta los datos relevantes..."
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow resize-none"
                          value={respuestas[req.id] || ''}
                          onChange={e => setRespuestas(prev => ({ ...prev, [req.id]: e.target.value }))}
                        />
                        <button
                          onClick={() => handleResponder(req.id)}
                          disabled={enviando === req.id}
                          className="mt-2 w-full py-2.5 bg-[#002E6D] text-white rounded-xl font-bold text-sm hover:bg-[#001d4a] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {enviando === req.id
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <><Send size={14} /> Enviar respuesta y notificar al abogado</>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
