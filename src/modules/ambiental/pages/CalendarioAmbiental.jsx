import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import { ChevronLeft, ChevronRight, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const RIESGO_STYLE = {
  Crítico: 'bg-red-50 border-red-500 text-red-800 hover:bg-red-100',
  Alto:    'bg-orange-50 border-orange-400 text-orange-800 hover:bg-orange-100',
  Medio:   'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100',
  Bajo:    'bg-green-50 border-green-400 text-green-700 hover:bg-green-100',
};

const RIESGO_DOT = {
  Crítico: 'bg-red-500',
  Alto:    'bg-orange-400',
  Medio:   'bg-amber-400',
  Bajo:    'bg-green-400',
};

export default function CalendarioAmbiental() {
  const [expedientes, setExpedientes] = useState([]);
  const [pagos, setPagos]             = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected]       = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiService.get('/ambiental/calendario')
      .then(r => {
        setExpedientes(r.data.expedientes || []);
        setPagos(r.data.pagos || []);
      })
      .catch(() => toast.error('Error cargando el calendario'));
  }, []);

  const year         = currentDate.getFullYear();
  const month        = currentDate.getMonth();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDay     = new Date(year, month, 1).getDay();
  const today        = new Date();

  const changeMonth = (offset) => {
    setSelected(null);
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const toDateStr = (d) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const isToday = (d) =>
    d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const getFechaCalendario = (e) =>
    (e.fecha_vencimiento || e.fecha_documento)?.split('T')[0];

  const getExpedientesDia = (d) =>
    d ? expedientes.filter(e => getFechaCalendario(e) === toDateStr(d)) : [];

  const getPagosDia = (d) =>
    d ? pagos.filter(p => p.fecha_vencimiento?.split('T')[0] === toDateStr(d)) : [];

  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];

  const selExpedientes = selected ? getExpedientesDia(selected) : [];
  const selPagos       = selected ? getPagosDia(selected) : [];

  return (
    <div className="max-w-6xl mx-auto pb-16">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-green-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight capitalize">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Vencimientos de respuesta y pagos ambientales pendientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hoy
          </button>
          <button onClick={() => changeMonth(-1)} className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-7 mb-1">
            {DIAS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const exps   = getExpedientesDia(day);
              const pags   = getPagosDia(day);
              const total  = exps.length + pags.length;
              const esHoy  = isToday(day);
              const activo = selected === day;
              const critico = exps.some(e => e.nivel_riesgo === 'Crítico' || e.nivel_riesgo === 'Alto');

              return (
                <div
                  key={i}
                  onClick={() => day && setSelected(activo ? null : day)}
                  className={`min-h-[90px] rounded-xl p-2 transition-all ${
                    !day
                      ? 'cursor-default'
                      : activo
                      ? 'bg-green-700 shadow-md cursor-pointer'
                      : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer'
                  }`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          activo ? 'text-white' :
                          esHoy  ? 'bg-green-700 text-white' :
                                   'text-gray-500'
                        }`}>
                          {day}
                        </span>
                        {critico && !activo && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        {exps.slice(0, 2).map(e => (
                          <div
                            key={e.id}
                            className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border-l-2 truncate font-medium ${
                              activo
                                ? 'bg-white/20 border-white/60 text-white'
                                : RIESGO_STYLE[e.nivel_riesgo] || RIESGO_STYLE.Bajo
                            }`}
                          >
                            {e.numero_expediente || e.titulo?.slice(0, 18)}
                          </div>
                        ))}
                        {pags.slice(0, activo || exps.length < 2 ? 2 : 0).map(p => (
                          <div
                            key={p.id}
                            className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border-l-2 truncate font-medium ${
                              activo
                                ? 'bg-white/20 border-white/40 text-white/80'
                                : 'bg-red-50 border-red-400 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            💰 {p.valor}
                          </div>
                        ))}
                        {total > 2 && (
                          <p className={`text-[9px] font-semibold pl-1 ${activo ? 'text-white/70' : 'text-gray-400'}`}>
                            +{total - 2} más
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="w-72 shrink-0 space-y-3">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-4">
            {selected ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(year, month, selected).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selExpedientes.length > 0 && `${selExpedientes.length} vencimiento${selExpedientes.length > 1 ? 's' : ''}`}
                    {selExpedientes.length > 0 && selPagos.length > 0 && ' · '}
                    {selPagos.length > 0 && `${selPagos.length} pago${selPagos.length > 1 ? 's' : ''} pendiente${selPagos.length > 1 ? 's' : ''}`}
                    {selExpedientes.length === 0 && selPagos.length === 0 && 'Sin eventos'}
                  </p>
                </div>
                <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
                  {selExpedientes.length === 0 && selPagos.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6 italic">No hay vencimientos este día.</p>
                  )}

                  {selExpedientes.map(e => {
                    const esFechaDoc = !e.fecha_vencimiento && e.fecha_documento;
                    return (
                      <button
                        key={e.id}
                        onClick={() => navigate(`/ambiental/expediente/${e.id}`)}
                        className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-green-700 transition-colors">
                              {e.numero_expediente || e.titulo}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{e.entidad_nombre || e.tipo_instrumento}</p>
                            {esFechaDoc && (
                              <p className="text-[10px] text-amber-500 mt-0.5">Fecha documento · sin vencimiento calculado</p>
                            )}
                          </div>
                          {e.nivel_riesgo && (
                            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md border-l-2 ${RIESGO_STYLE[e.nivel_riesgo] || RIESGO_STYLE.Bajo}`}>
                              {e.nivel_riesgo}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {selPagos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/ambiental/expediente/${p.expediente_id}`)}
                      className="w-full text-left p-3 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <Shield size={12} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-red-700">{p.valor}</p>
                          {p.descripcion && <p className="text-[11px] text-red-400 truncate">{p.descripcion}</p>}
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{p.expediente_titulo}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-5 py-10 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Selecciona un día</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Haz clic en cualquier celda para ver los vencimientos.</p>
                </div>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3">Nivel de riesgo</p>
            <div className="space-y-1.5">
              {[['Crítico', 'bg-red-500'], ['Alto', 'bg-orange-400'], ['Medio', 'bg-amber-400'], ['Bajo', 'bg-green-400']].map(([label, dot]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1">
                <span className="text-xs">💰</span>
                <span className="text-xs text-gray-500">Pago pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
