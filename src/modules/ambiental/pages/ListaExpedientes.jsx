import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import {
  Plus, Search, FileText, Clock, CheckCircle, AlertTriangle,
  Archive, ChevronRight, Calendar, X, Leaf, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const ESTADOS = ['Todos', 'Pendiente', 'Analizado', 'Revisado', 'Archivado'];
const TIPOS = ['Todos', 'expediente', 'auto', 'resolución', 'concepto'];

const estadoConfig = {
  'Pendiente':  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400', icon: <Clock size={11} /> },
  'Analizado':  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400',   icon: <Zap size={11} /> },
  'Revisado':   { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400',  icon: <CheckCircle size={11} /> },
  'Archivado':  { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400',   icon: <Archive size={11} /> },
};

const riesgoConfig = {
  'Crítico': { bg: 'bg-red-100',    text: 'text-red-700' },
  'Alto':    { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Medio':   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'Bajo':    { bg: 'bg-green-100',  text: 'text-green-700' },
};

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

  const filtrados = useMemo(() => {
    return expedientes.filter(e => {
      const matchBusqueda = !busqueda ||
        e.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.numero_expediente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.entidad_nombre?.toLowerCase().includes(busqueda.toLowerCase());
      const matchEstado = filtroEstado === 'Todos' || (e.estado || 'Pendiente') === filtroEstado;
      const matchTipo = filtroTipo === 'Todos' || e.tipo_instrumento === filtroTipo;
      return matchBusqueda && matchEstado && matchTipo;
    });
  }, [expedientes, busqueda, filtroEstado, filtroTipo]);

  const hayFiltros = busqueda || filtroEstado !== 'Todos' || filtroTipo !== 'Todos';

  const limpiar = () => { setBusqueda(''); setFiltroEstado('Todos'); setFiltroTipo('Todos'); };

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
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, número de expediente o entidad..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-green-600 transition-shadow"
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

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado:</span>
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroEstado === e
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {e}
            </button>
          ))}
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-3">Tipo:</span>
          {TIPOS.map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                filtroTipo === t
                  ? 'bg-green-700 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {t}
            </button>
          ))}
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
            {hayFiltros && <button onClick={limpiar} className="ml-2 text-green-700 hover:underline">limpiar filtros</button>}
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
                    <p className="text-xs text-gray-400 mb-3">Entidad: <span className="font-semibold text-gray-600">{exp.entidad_nombre}</span></p>
                  )}

                  {exp.plazo_respuesta && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg mb-3 line-clamp-1">
                      ⏱ {exp.plazo_respuesta}
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
