import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Leaf, AlertTriangle, CheckCircle, Clock, Archive,
  CreditCard, TrendingUp, ChevronRight, Calendar,
} from 'lucide-react';
import HelpButton from '../../../components/HelpButton';
import toast from 'react-hot-toast';

const RIESGO_COLOR = { Crítico: '#ef4444', Alto: '#f97316', Medio: '#f59e0b', Bajo: '#22c55e' };
const ESTADO_COLOR = { Pendiente: '#f59e0b', Analizado: '#3b82f6', Revisado: '#8b5cf6', Archivado: '#9ca3af' };

const diasLabel = (d) => {
  const n = parseInt(d);
  if (n <= 0) return { label: 'Vence hoy', cls: 'bg-red-100 text-red-700' };
  if (n === 1) return { label: 'Mañana', cls: 'bg-red-100 text-red-700' };
  if (n <= 3) return { label: `${n} días`, cls: 'bg-orange-100 text-orange-700' };
  return { label: `${n} días`, cls: 'bg-amber-100 text-amber-700' };
};

function KPI({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-gray-800">{value ?? '—'}</p>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
};

export default function DashboardAmbiental() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiService.get('/ambiental/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { totales, porRiesgo, porEstado, porTipo, vencimientosProximos, pagosResumen, porEntidad } = data;

  const riesgoChart = porRiesgo.map(r => ({ name: r.nivel_riesgo, value: Number(r.cantidad), fill: RIESGO_COLOR[r.nivel_riesgo] || '#6b7280' }));
  const estadoChart = porEstado.map(e => ({ name: e.estado, value: Number(e.cantidad), fill: ESTADO_COLOR[e.estado] || '#6b7280' }));
  const tipoChart   = porTipo.map(t => ({ name: t.tipo_instrumento, cantidad: Number(t.cantidad) }));
  const entidadChart = porEntidad.map(e => ({ name: e.nombre, cantidad: Number(e.cantidad) }));

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-green-700 rounded-xl flex items-center justify-center shadow-sm">
          <Leaf size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Ambiental</h1>
          <p className="text-sm text-gray-400 mt-0.5">Resumen de expedientes, riesgos y pagos</p>
        </div>
        <HelpButton
          title="Cómo usar el módulo Ambiental"
          color="text-green-700"
          tips={[
            'Registra cada instrumento ambiental (licencia, permiso, concesión) como un expediente independiente.',
            'Ingresa las fechas de vigencia para que el sistema genere alertas automáticas de vencimiento.',
            'Asocia los pagos de tasas ambientales directamente al expediente correspondiente.',
            'Usa el Calendario para visualizar todos los vencimientos del mes y planear con anticipación.',
          ]}
          sections={[
            {
              title: '¿Qué hace este módulo?',
              content: (
                <p>
                  Este módulo administra el portafolio de instrumentos de derecho ambiental de la empresa: licencias
                  ambientales, permisos de vertimiento, concesiones de agua, planes de manejo y otros instrumentos
                  otorgados por las autoridades ambientales. Permite controlar fechas de vigencia, niveles de riesgo,
                  pagos de tasas y recibir alertas preventivas antes de cada vencimiento.
                </p>
              )
            },
            {
              title: 'Paso 1 — Crear un expediente',
              content: (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Haz clic en <b>Nuevo Expediente</b> en la esquina superior derecha.</li>
                  <li>Selecciona el <b>tipo de instrumento</b> (licencia ambiental, permiso de vertimiento, concesión de agua, etc.).</li>
                  <li>Ingresa el número del instrumento tal como aparece en la resolución de la autoridad ambiental.</li>
                  <li>Selecciona la <b>entidad ambiental</b> que lo otorgó (ANLA, CAR, Corporación regional, etc.).</li>
                  <li>Ingresa la <b>fecha de expedición y fecha de vencimiento</b> — el sistema calculará automáticamente los días restantes.</li>
                  <li>Asigna el <b>nivel de riesgo</b> (Crítico, Alto, Medio, Bajo) según la importancia del instrumento para la operación.</li>
                </ol>
              )
            },
            {
              title: 'Paso 2 — Seguimiento y cambios de estado',
              content: (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Abre el expediente desde la lista y revisa su información actual.</li>
                  <li>Cambia el estado según la etapa en que se encuentre: <b>Pendiente → Analizado → Revisado → Archivado</b>.</li>
                  <li>Agrega notas o documentos soporte (resoluciones, conceptos técnicos, comunicaciones) en el detalle.</li>
                  <li>Registra cualquier condicionamiento o requisito de seguimiento que imponga la autoridad ambiental.</li>
                </ol>
              )
            },
            {
              title: 'Paso 3 — Alertas de vencimiento',
              content: (
                <p>
                  El sistema envía notificaciones automáticas al responsable del expediente <b>30, 15 y 5 días antes</b> de
                  cada fecha de vencimiento. Los expedientes próximos a vencer aparecen destacados en la sección
                  <b> Próximos Vencimientos</b> del dashboard. Es importante gestionar la renovación con suficiente anticipación,
                  ya que los trámites ante autoridades ambientales pueden tomar semanas o meses.
                </p>
              )
            },
            {
              title: 'Paso 4 — Registrar pagos de tasas ambientales',
              content: (
                <ol className="list-decimal list-inside space-y-2">
                  <li>Abre el expediente al que pertenece la tasa.</li>
                  <li>Ve a la sección <b>Pagos</b> dentro del detalle del expediente.</li>
                  <li>Registra el monto, la fecha de pago y el concepto (tasa retributiva, tasa de uso de agua, etc.).</li>
                  <li>Adjunta el comprobante de pago para mantener el soporte documental.</li>
                  <li>El dashboard consolida todos los pagos del portafolio en la sección de resumen financiero.</li>
                </ol>
              )
            },
            {
              title: 'Vista de Calendario',
              content: (
                <p>
                  El <b>Calendario Ambiental</b> (menú lateral) muestra en formato mensual todos los vencimientos,
                  fechas de seguimiento y hitos programados del portafolio. Es la herramienta ideal para la
                  planificación: permite ver de un vistazo qué trámites tienen fecha límite en las próximas semanas
                  y priorizar el trabajo del equipo en consecuencia.
                </p>
              )
            }
          ]}
        />
      </div>

      {/* KPIs fila 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI
          label="Total expedientes"
          value={totales.total}
          color="bg-green-100"
          icon={<Leaf size={18} className="text-green-700" />}
        />
        <KPI
          label="Pendientes"
          value={totales.pendientes}
          sub="sin analizar"
          color="bg-amber-100"
          icon={<Clock size={18} className="text-amber-600" />}
        />
        <KPI
          label="Analizados"
          value={totales.analizados}
          color="bg-blue-100"
          icon={<CheckCircle size={18} className="text-blue-600" />}
        />
        <KPI
          label="Vencidos"
          value={totales.vencidos}
          sub={Number(totales.vencidos) > 0 ? 'requieren atención' : 'al día'}
          color={Number(totales.vencidos) > 0 ? 'bg-red-100' : 'bg-green-100'}
          icon={<AlertTriangle size={18} className={Number(totales.vencidos) > 0 ? 'text-red-600' : 'text-green-600'} />}
        />
      </div>

      {/* Fila 2: Gráficos de distribución */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Pie: Nivel de riesgo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por nivel de riesgo</p>
          {riesgoChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={riesgoChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {riesgoChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 italic">Sin análisis registrados</div>
          )}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {riesgoChart.map(r => (
              <span key={r.name} className="flex items-center gap-1 text-[11px] text-gray-600">
                <span className="w-2 h-2 rounded-full" style={{ background: r.fill }} />
                {r.name}: <b>{r.value}</b>
              </span>
            ))}
          </div>
        </div>

        {/* Pie: Estado */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por estado</p>
          {estadoChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={estadoChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${value}`}>
                  {estadoChart.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 italic">Sin datos</div>
          )}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {estadoChart.map(e => (
              <span key={e.name} className="flex items-center gap-1 text-[11px] text-gray-600">
                <span className="w-2 h-2 rounded-full" style={{ background: e.fill }} />
                {e.name}: <b>{e.value}</b>
              </span>
            ))}
          </div>
        </div>

        {/* KPI pagos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pagos ambientales</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Pendientes</span>
              </div>
              <span className="text-xl font-black text-amber-700">{pagosResumen?.pagos_pendientes ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-600" />
                <span className="text-xs font-semibold text-red-700">Vencidos</span>
              </div>
              <span className="text-xl font-black text-red-700">{pagosResumen?.pagos_vencidos ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Realizados</span>
              </div>
              <span className="text-xl font-black text-green-700">{pagosResumen?.pagos_realizados ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila 3: Barras tipo instrumento + entidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Por tipo de instrumento</p>
          {tipoChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tipoChart} layout="vertical" margin={{ left: 8, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 italic">Sin datos</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Top entidades</p>
          {entidadChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={entidadChart} layout="vertical" margin={{ left: 8, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="#15803d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 italic">Sin entidades asignadas</div>
          )}
        </div>
      </div>

      {/* Próximos vencimientos */}
      {vencimientosProximos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} /> Vencimientos próximos (15 días)
            </p>
            <button
              onClick={() => navigate('/ambiental/calendario')}
              className="text-xs text-green-700 font-semibold hover:underline flex items-center gap-1"
            >
              Ver calendario <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {vencimientosProximos.map(exp => {
              const { label, cls } = diasLabel(exp.dias_restantes);
              return (
                <button
                  key={exp.id}
                  onClick={() => navigate(`/ambiental/expediente/${exp.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {exp.nivel_riesgo && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: RIESGO_COLOR[exp.nivel_riesgo] || '#6b7280' }} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-green-700">
                        {exp.numero_expediente || exp.titulo}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{exp.entidad_nombre || exp.tipo_instrumento}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ml-3 ${cls}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
