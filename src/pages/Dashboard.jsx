import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Clock, FileCheck, AlertTriangle, User, Calendar, ExternalLink, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tutelaService } from '../services/tutelaService';
import apiService from '../services/apiService';
import { ESTADOS, PRIORIDADES } from '../constants';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark-pro';
  
  const [tutelas, setTutelas] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [roi, setRoi] = useState({ totalTutelas: 0, horasAhorradas: 0, dineroAhorrado: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [prioridadFilter, setPrioridadFilter] = useState('Todas');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [areas, setAreas] = useState([]); // State for areas

  // Fetch areas from backend
  const fetchAreas = async () => {
    try {
      const { data } = await apiService.get('/admin/areas');
      setAreas(data.filter(a => a.activo).map(a => a.nombre));
    } catch (err) { toast.error('Error al cargar áreas'); }
  };

  const fetchEstadisticas = async () => {
    try {
      const { data } = await apiService.get('/tutelas/estadisticas');
      setEstadisticas(data.map(item => ({
        ...item,
        mes: new Date(item.mes).toLocaleDateString('es-ES', { month: 'short' })
      })));
    } catch (err) { toast.error('Error cargando estadísticas'); }
  };

  const fetchTutelas = async () => {
    try {
      const data = await tutelaService.listar();
      setTutelas(data);
    } catch (error) {
      toast.error('Error al cargar la bandeja de entrada');
    } finally {
      setLoading(false);
    }
  };

  const fetchROI = async () => {
    try {
      const { data } = await apiService.get('/admin/roi');
      setRoi(data);
    } catch (err) { toast.error('Error al cargar ROI'); }
  };

  useEffect(() => {
    fetchTutelas();
    fetchEstadisticas();
    fetchROI();
    fetchAreas(); // Add fetchAreas call
  }, []);

  const filteredTutelas = useMemo(() => {
    return tutelas.filter(t => {
      const matchesSearch = t.radicado.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.accionante.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = estadoFilter === 'Todos' || t.estado === estadoFilter;
      const matchesPrioridad = prioridadFilter === 'Todas' || t.prioridad === prioridadFilter;
      const matchesArea = areaFilter === 'Todas' || t.area_responsable === areaFilter;
      return matchesSearch && matchesEstado && matchesPrioridad && matchesArea;
    });
  }, [tutelas, searchTerm, estadoFilter, prioridadFilter, areaFilter]);

  const dataDerechos = useMemo(() => {
    const counts = tutelas.reduce((acc, t) => {
      const derecho = t.derecho_vulnerado || 'No clasificado';
      acc[derecho] = (acc[derecho] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tutelas]);

  const COLORS = ['#002E6D', '#E20074', '#FF7900', '#00A300'];

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case PRIORIDADES.ALTA: return isDark ? 'bg-enel-magenta text-white border-enel-magenta' : 'bg-red-600 text-white border-red-600';
      case PRIORIDADES.MEDIA: return isDark ? 'bg-enel-orange text-white border-enel-orange' : 'bg-amber-500 text-white border-amber-500';
      default: return isDark ? 'bg-enel-blue text-white border-enel-blue' : 'bg-blue-600 text-white border-blue-600';
    }
  };

  const getEstadoColor = (estado) => {
    if (estado === ESTADOS.PENDIENTE) return isDark ? 'text-blue-300 bg-blue-900/30' : 'text-enel-blue bg-blue-50';
    if (estado === ESTADOS.EN_PROCESO) return isDark ? 'text-green-300 bg-green-900/30' : 'text-enel-green bg-green-50';
    if (estado === ESTADOS.RESPONDIDA) return isDark ? 'text-slate-300 bg-slate-800' : 'text-gray-600 bg-gray-100';
    return isDark ? 'text-slate-400 bg-slate-900' : 'text-gray-600 bg-gray-50';
  };

  const tareas = useMemo(() => {
    const hoy = new Date();
    const lista = [];

    tutelas.filter(t => t.estado !== ESTADOS.RESPONDIDA).forEach(t => {
        const fecha = new Date(t.fecha_vencimiento);
        const diffDays = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) {
            lista.push({
                tipo: 'vencimiento',
                titulo: `Vencimiento: ${t.radicado}`,
                subtitulo: t.accionante,
                fecha: fecha,
                urgencia: diffDays <= 0 ? 'critica' : 'alta',
                id: t.id
            });
        }
    });

    return lista.sort((a, b) => a.fecha - b.fecha);
  }, [tutelas]);

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#002E6D]'}`}>{import.meta.env.VITE_APP_NAME}</h1>
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Gestión de tutelas activas y asignación de responsables.</p>
        </div>
        <button onClick={() => { fetchTutelas(); fetchEstadisticas(); }} className={`px-4 py-2 border rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-medium ${isDark ? 'bg-[#0F172A] border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <TrendingUp size={16} /> Actualizar Datos
        </button>
      </div>

      {/* Agenda Jurídica */}
      <div className="mb-8">
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <Calendar size={18} className="text-blue-600"/> Agenda Jurídica (Próximas Tareas)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tareas.length === 0 ? (
                <p className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No hay tareas urgentes programadas.</p>
            ) : tareas.map((tarea, i) => (
                <Link to={`/tutela/${tarea.id}`} key={i} className={`p-4 rounded-xl border-l-4 shadow-sm transition-all ${isDark ? 'bg-[#0F172A] border-slate-700' : 'bg-white border-gray-200'} ${tarea.urgencia === 'critica' ? 'border-red-500' : 'border-amber-500'}`}>
                    <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{tarea.titulo}</h4>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${tarea.urgencia === 'critica' ? 'bg-red-900/30 text-red-500' : 'bg-amber-900/30 text-amber-500'}`}>
                            {tarea.urgencia}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mb-2">{tarea.subtitulo}</p>
                    <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Vence: {tarea.fecha.toLocaleDateString()}</p>
                </Link>
            ))}
        </div>
      </div>

      {/* ROI Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-6 rounded-xl text-white shadow-lg">
            <p className="text-blue-100 text-xs uppercase font-bold mb-1">Total Procesadas</p>
            <p className="text-3xl font-black">{parseInt(roi.totalTutelas).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-700 to-green-500 p-6 rounded-xl text-white shadow-lg">
            <p className="text-green-100 text-xs uppercase font-bold mb-1">Horas Ahorradas</p>
            <p className="text-3xl font-black">{Math.round(roi.horasAhorradas).toLocaleString()} h</p>
        </div>
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 p-6 rounded-xl text-white shadow-lg">
            <p className="text-purple-100 text-xs uppercase font-bold mb-1">Impacto Económico</p>
            <p className="text-3xl font-black">${Math.round(roi.dineroAhorrado).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPICard titulo="Pendientes" valor={filteredTutelas.filter(t => t.estado === ESTADOS.PENDIENTE).length} icono={<Clock size={20} className="text-amber-500" />} color="bg-amber-50" />
          <KPICard titulo="En Proceso" valor={filteredTutelas.filter(t => t.estado === ESTADOS.EN_PROCESO).length} icono={<TrendingUp size={20} className="text-blue-500" />} color="bg-blue-50" />
          <KPICard titulo="Respondidas" valor={filteredTutelas.filter(t => t.estado === ESTADOS.RESPONDIDA).length} icono={<FileCheck size={20} className="text-green-500" />} color="bg-green-50" />
          <KPICard titulo="Urgentes" valor={filteredTutelas.filter(t => t.prioridad === PRIORIDADES.ALTA && t.estado !== ESTADOS.RESPONDIDA).length} icono={<AlertTriangle size={20} className="text-red-500" />} color="bg-red-50" alerta={true} />
        </div>
        <div className={`p-6 rounded-xl border shadow-sm ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold mb-4 text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Distribución por Derecho Vulnerado</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dataDerechos} dataKey="value" nameKey="name" outerRadius={70} label>
                  {dataDerechos.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className={`p-4 rounded-xl border shadow-sm mb-6 flex flex-wrap gap-4 items-center ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={18} />
          <input type="text" placeholder="Buscar por radicado o accionante..." className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm ${isDark ? 'bg-[#020617] border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-300'}`} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-[#020617] border-slate-700 text-white' : 'bg-white border-gray-300'}`} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="Todos">Todos los Estados</option>
          {Object.values(ESTADOS).map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-[#020617] border-slate-700 text-white' : 'bg-white border-gray-300'}`} onChange={(e) => setPrioridadFilter(e.target.value)}>
          <option value="Todas">Todas las Prioridades</option>
          {Object.values(PRIORIDADES).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={`px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-[#020617] border-slate-700 text-white' : 'bg-white border-gray-300'}`} onChange={(e) => setAreaFilter(e.target.value)}>
          <option value="Todas">Todas las Áreas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className={`rounded-xl border shadow-sm overflow-hidden mb-8 ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200'}`}>
        <table className="w-full text-left">
            <thead className={`text-xs uppercase font-semibold ${isDark ? 'bg-[#020617] text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
              <tr>
                <th className="px-6 py-4">Radicado / Accionante</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4">Prioridad</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan="6" className={`px-6 py-12 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Cargando bandeja de entrada...</td></tr>
              ) : filteredTutelas.length === 0 ? (
                <tr><td colSpan="6" className={`px-6 py-12 text-center ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No se encontraron tutelas que coincidan.</td></tr>
              ) : filteredTutelas.map((tutela) => (
                <tr key={tutela.id} className={`transition-colors group ${isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{tutela.radicado}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs truncate max-w-[150px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{tutela.accionante}</span>
                      {tutela.derecho_vulnerado && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{tutela.derecho_vulnerado}</span>}
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{tutela.responsables_nombres?.join(', ') || 'Sin asignar'}</td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{new Date(tutela.fecha_vencimiento).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPrioridadColor(tutela.prioridad)}`}>{tutela.prioridad}</span></td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getEstadoColor(tutela.estado)}`}>{tutela.estado}</span></td>
                  <td className="px-6 py-4 text-center"><Link to={`/tutela/${tutela.id}`} className={`${isDark ? 'text-slate-500 hover:text-sky-400' : 'text-gray-400 hover:text-[#002E6D]'} transition-colors`}><ExternalLink size={18} /></Link></td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      {/* Gráfica de Tendencia */}
      <div className={`p-6 rounded-xl border shadow-sm mb-8 ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-bold mb-6 text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Evolución de Tutelas (Últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={estadisticas}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="mes" stroke={isDark ? '#94a3b8' : '#6b7280'} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#6b7280'} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#020617' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }} />
                  <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
}

function KPICard({ titulo, valor, icono, color, alerta }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark-pro';
  return (
    <div className={`p-6 rounded-xl border shadow-sm ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200'} ${alerta && valor > 0 ? 'border-red-500' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div className={`p-3 rounded-lg ${color}`}>{icono}</div>
        {alerta && valor > 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
      </div>
      <h4 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>{valor}</h4>
      <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{titulo}</p>
    </div>
  );
}
