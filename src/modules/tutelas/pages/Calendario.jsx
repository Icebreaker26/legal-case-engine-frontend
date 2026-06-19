import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const PRIORIDAD_STYLE = {
  Alta:  'bg-red-50 border-red-400 text-red-700 hover:bg-red-100',
  Media: 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100',
  Baja:  'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
};

export default function Calendario() {
  const [tutelas, setTutelas]       = useState([]);
  const [holidays, setHolidays]     = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiService.get('/tutelas').then(r => setTutelas(r.data)).catch(() => toast.error('Error cargando tutelas'));
    apiService.get('/tutelas/festivos').then(r => setHolidays(r.data.map(h => h.date.split(' ')[0]))).catch(() => {});
  }, []);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const today       = new Date();

  const changeMonth = (offset) => {
    setSelected(null);
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const toDateStr = (d) => new Date(year, month, d).toISOString().split('T')[0];

  const isFestivo  = (d) => d && holidays.includes(toDateStr(d));
  const isToday    = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const getEvents  = (d) => tutelas.filter(t => new Date(t.fecha_vencimiento).toISOString().split('T')[0] === toDateStr(d));

  const selectedEvents = selected ? getEvents(selected) : [];

  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-[#002E6D] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight capitalize">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Vencimientos y fechas clave de tutelas activas</p>
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

        {/* Grid del calendario */}
        <div className="flex-1 min-w-0">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const events   = day ? getEvents(day) : [];
              const festivo  = isFestivo(day);
              const esHoy    = isToday(day);
              const activo   = selected === day;
              const urgentes = events.filter(t => t.prioridad === 'Alta').length;

              return (
                <div
                  key={i}
                  onClick={() => day && setSelected(activo ? null : day)}
                  className={`min-h-[90px] rounded-xl p-2 transition-all cursor-pointer select-none ${
                    !day
                      ? 'cursor-default'
                      : activo
                      ? 'bg-[#002E6D] shadow-md'
                      : festivo
                      ? 'bg-red-50 hover:bg-red-100 border border-red-100'
                      : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                  }`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          activo  ? 'text-white' :
                          esHoy   ? 'bg-[#002E6D] text-white' :
                          festivo ? 'text-red-500' :
                                    'text-gray-500'
                        }`}>
                          {day}
                        </span>
                        {urgentes > 0 && !activo && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        {events.slice(0, 2).map(t => (
                          <div
                            key={t.id}
                            className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border-l-2 truncate font-medium ${
                              activo
                                ? 'bg-white/20 border-white/60 text-white'
                                : PRIORIDAD_STYLE[t.prioridad] || PRIORIDAD_STYLE.Baja
                            }`}
                          >
                            {t.radicado}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <p className={`text-[9px] font-semibold pl-1 ${activo ? 'text-white/70' : 'text-gray-400'}`}>
                            +{events.length - 2} más
                          </p>
                        )}
                      </div>

                      {festivo && !activo && (
                        <p className="text-[8px] text-red-400 font-semibold uppercase mt-1 tracking-wide">Festivo</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="w-72 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-4">
            {selected ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(year, month, selected).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedEvents.length === 0 ? 'Sin vencimientos' : `${selectedEvents.length} vencimiento${selectedEvents.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
                  {selectedEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6 italic">No hay tutelas que venzan este día.</p>
                  ) : selectedEvents.map(t => (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/tutela/${t.id}`)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-[#002E6D]/20 hover:bg-blue-50/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#002E6D] transition-colors">
                            {t.radicado}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{t.accionante}</p>
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md border-l-2 ${PRIORIDAD_STYLE[t.prioridad] || PRIORIDAD_STYLE.Baja}`}>
                          {t.prioridad}
                        </span>
                      </div>
                      {t.responsables_nombres?.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1.5 truncate">{t.responsables_nombres.join(', ')}</p>
                      )}
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
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Haz clic en cualquier celda para ver los vencimientos del día.</p>
                </div>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 mb-3">Prioridad</p>
            <div className="space-y-1.5">
              {[['Alta', 'bg-red-400'], ['Media', 'bg-amber-400'], ['Baja', 'bg-blue-400']].map(([label, dot]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1">
                <span className="w-2 h-2 rounded-full bg-red-300" />
                <span className="text-xs text-gray-500">Festivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
