import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Clock, FileCheck, AlertTriangle, User, Calendar,
  ExternalLink, Search, Inbox, BarChart2, Users, LayoutDashboard, RefreshCw,
  List, Columns, GripVertical, X
} from 'lucide-react';
import HelpButton from '../../../components/HelpButton';
import { Link } from 'react-router-dom';
import { BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { tutelaService } from '../services/tutelaService';
import apiService from '../../../services/apiService';
import { ESTADOS, PRIORIDADES } from '../../../constants';
import toast from 'react-hot-toast';
import SolicitudesPorArea from '../components/dashboard/SolicitudesPorArea';

// ── Colores ──────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#002E6D', '#E20074', '#FF7900', '#00A300'];
const NIVEL_COLOR = {
  Alto:  { bar: '#ef4444', badge: 'bg-red-100 text-red-700'      },
  Medio: { bar: '#f97316', badge: 'bg-orange-100 text-orange-700' },
  Bajo:  { bar: '#22c55e', badge: 'bg-green-100 text-green-700'   },
};

// ── Helpers de estilo ─────────────────────────────────────────────────────────
const getPrioridadColor = (p) => {
  if (p === PRIORIDADES.ALTA)  return 'bg-red-600 text-white border-red-600';
  if (p === PRIORIDADES.MEDIA) return 'bg-amber-500 text-white border-amber-500';
  return 'bg-blue-600 text-white border-blue-600';
};
const getEstadoColor = (e) => {
  if (e === ESTADOS.PENDIENTE)  return 'text-enel-blue bg-blue-50';
  if (e === ESTADOS.EN_PROCESO) return 'text-enel-green bg-green-50';
  if (e === ESTADOS.RESPONDIDA) return 'text-gray-600 bg-gray-100';
  return 'text-gray-600 bg-gray-50';
};

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'resumen',       label: 'Resumen',       icon: LayoutDashboard },
  { id: 'bandeja',       label: 'Bandeja',       icon: Inbox         },
  { id: 'inteligencia',  label: 'Inteligencia',  icon: BarChart2     },
  { id: 'areas',         label: 'Áreas',         icon: Users         },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState('resumen');
  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'kanban'

  // — kanban drag state —
  const [dragId, setDragId]         = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const [kanbanChecklist, setKanbanChecklist] = useState(null); // { tutela, targetEstado }
  const [kanbanCheck, setKanbanCheck] = useState({ contestacion: false, requerimientos: false, notificacion: false });
  const [updatingKanban, setUpdatingKanban] = useState(false);

  // — datos operativos —
  const [tutelas, setTutelas]         = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [roi, setRoi]                 = useState({ totalTutelas: 0, horasAhorradas: 0, dineroAhorrado: 0 });
  const [grupos, setGrupos]           = useState([]);
  const [loading, setLoading]         = useState(true);

  // — filtros bandeja —
  const [searchTerm, setSearchTerm]         = useState('');
  const [estadoFilter, setEstadoFilter]     = useState('Todos');
  const [prioridadFilter, setPrioridadFilter] = useState('Todas');
  const [grupoFilter, setGrupoFilter]       = useState('Todas');

  // — datos analítica —
  const [scores, setScores]           = useState([]);
  const [tiempos, setTiempos]         = useState([]);
  const [fallos, setFallos]           = useState({ porDerecho: [], porJuzgado: [] });
  const [rag, setRag]                 = useState({ resumen: {}, porCategoria: [], top_documentos: [], bottom_documentos: [] });
  const [carga, setCarga]             = useState([]);
  const [loadingScores, setLoadingScores]   = useState(true);
  const [loadingTiempos, setLoadingTiempos] = useState(true);
  const [loadingFallos, setLoadingFallos]   = useState(true);
  const [loadingRag, setLoadingRag]         = useState(true);
  const [loadingCarga, setLoadingCarga]     = useState(true);
  const [filtroNivel, setFiltroNivel] = useState('Todos');

  // ── Fetches ────────────────────────────────────────────────────────────────
  const fetchTutelas = async () => {
    try {
      const data = await tutelaService.listar();
      setTutelas(data);
    } catch { toast.error('Error al cargar tutelas'); }
    finally   { setLoading(false); }
  };

  const fetchEstadisticas = async () => {
    try {
      const { data } = await apiService.get('/tutelas/estadisticas');
      setEstadisticas(data.map(item => ({
        ...item,
        mes: new Date(item.mes).toLocaleDateString('es-ES', { month: 'short' })
      })));
    } catch { toast.error('Error cargando estadísticas'); }
  };

  const fetchROI = async () => {
    try {
      const { data } = await apiService.get('/tutelas/roi');
      setRoi(data);
    } catch { toast.error('Error al cargar ROI'); }
  };

  const fetchGrupos = async () => {
    try {
      const { data } = await apiService.get('/core/grupos');
      setGrupos(data.filter(g => g.is_active));
    } catch { toast.error('Error al cargar grupos'); }
  };

  const fetchScores = async () => {
    setLoadingScores(true);
    try {
      const { data } = await apiService.get('/analytics/score-riesgo');
      setScores(data);
    } catch { toast.error('Error al cargar scores de riesgo'); }
    finally   { setLoadingScores(false); }
  };

  const fetchTiempos = async () => {
    setLoadingTiempos(true);
    try {
      const { data } = await apiService.get('/analytics/tiempo-respuesta-area');
      setTiempos(data);
    } catch { toast.error('Error al cargar tiempos por área'); }
    finally   { setLoadingTiempos(false); }
  };

  const fetchFallos = async () => {
    setLoadingFallos(true);
    try {
      const { data } = await apiService.get('/analytics/patrones-fallo');
      setFallos(data);
    } catch { toast.error('Error al cargar patrones de fallo'); }
    finally { setLoadingFallos(false); }
  };

  const fetchRag = async () => {
    setLoadingRag(true);
    try {
      const { data } = await apiService.get('/analytics/eficiencia-rag');
      setRag(data);
    } catch { toast.error('Error al cargar eficiencia RAG'); }
    finally { setLoadingRag(false); }
  };

  const fetchCarga = async () => {
    setLoadingCarga(true);
    try {
      const { data } = await apiService.get('/analytics/carga-abogados');
      setCarga(data);
    } catch { toast.error('Error al cargar carga de abogados'); }
    finally { setLoadingCarga(false); }
  };

  useEffect(() => {
    fetchTutelas();
    fetchEstadisticas();
    fetchROI();
    fetchGrupos();
    fetchScores();
    fetchTiempos();
    fetchFallos();
    fetchRag();
    fetchCarga();
  }, []);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const filteredTutelas = useMemo(() => tutelas.filter(t => {
    const q = searchTerm.toLowerCase();
    return (
      (t.radicado.toLowerCase().includes(q) || t.accionante.toLowerCase().includes(q)) &&
      (estadoFilter    === 'Todos'  || t.estado        === estadoFilter)    &&
      (prioridadFilter === 'Todas'  || t.prioridad     === prioridadFilter) &&
      (grupoFilter     === 'Todas'  || t.grupo_nombre  === grupoFilter)
    );
  }), [tutelas, searchTerm, estadoFilter, prioridadFilter, grupoFilter]);

  const dataDerechos = useMemo(() => {
    const counts = tutelas.reduce((acc, t) => {
      const d = t.derecho_vulnerado || 'No clasificado';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tutelas]);

  const tareas = useMemo(() => {
    const hoy = new Date();
    return tutelas
      .filter(t => t.estado !== ESTADOS.RESPONDIDA)
      .flatMap(t => {
        const fecha   = new Date(t.fecha_vencimiento);
        const diffDays = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
        if (diffDays > 3) return [];
        return [{ titulo: `Vencimiento: ${t.radicado}`, subtitulo: t.accionante, fecha, urgencia: diffDays <= 0 ? 'critica' : 'alta', id: t.id }];
      })
      .sort((a, b) => a.fecha - b.fecha);
  }, [tutelas]);

  const scoresFiltrados = filtroNivel === 'Todos' ? scores : scores.filter(s => s.nivel === filtroNivel);
  const scoresMap       = useMemo(() => Object.fromEntries(scores.map(s => [s.id, s])), [scores]);
  const altos  = scores.filter(s => s.nivel === 'Alto').length;
  const medios = scores.filter(s => s.nivel === 'Medio').length;
  const bajos  = scores.filter(s => s.nivel === 'Bajo').length;

  // ── Kanban drag & drop ────────────────────────────────────────────────────
  const handleDrop = (targetEstado) => {
    if (!dragId) return;
    const tutela = tutelas.find(t => t.id === dragId);
    if (!tutela || tutela.estado === targetEstado) { setDragId(null); setDragOver(null); return; }

    if (targetEstado === ESTADOS.RESPONDIDA) {
      setKanbanChecklist({ tutela, targetEstado });
      setDragId(null); setDragOver(null);
      return;
    }
    commitKanbanMove(tutela, targetEstado);
  };

  const commitKanbanMove = async (tutela, targetEstado) => {
    setUpdatingKanban(true);
    try {
      await tutelaService.actualizar(tutela.id, { estado: targetEstado });
      setTutelas(prev => prev.map(t => t.id === tutela.id ? { ...t, estado: targetEstado } : t));
      toast.success(`"${tutela.radicado}" → ${targetEstado}`);
    } catch { toast.error('Error al actualizar estado'); }
    finally { setUpdatingKanban(false); setDragId(null); setDragOver(null); }
  };

  const confirmKanbanRespondida = async () => {
    setUpdatingKanban(true);
    try {
      await tutelaService.actualizar(kanbanChecklist.tutela.id, { estado: ESTADOS.RESPONDIDA });
      setTutelas(prev => prev.map(t => t.id === kanbanChecklist.tutela.id ? { ...t, estado: ESTADOS.RESPONDIDA } : t));
      toast.success(`"${kanbanChecklist.tutela.radicado}" → Respondida`);
      setKanbanChecklist(null);
      setKanbanCheck({ contestacion: false, requerimientos: false, notificacion: false });
    } catch { toast.error('Error al actualizar estado'); }
    finally { setUpdatingKanban(false); }
  };

  // ── Recargar según tab activa ──────────────────────────────────────────────
  const handleRefresh = () => {
    if (tab === 'bandeja')      { fetchTutelas(); fetchScores(); }
    if (tab === 'inteligencia') { fetchScores(); fetchTiempos(); fetchFallos(); fetchRag(); fetchCarga(); }
    if (tab === 'resumen')      { fetchEstadisticas(); fetchROI(); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-[#002E6D]">{import.meta.env.VITE_APP_NAME}</h1>
            <p className="text-sm text-gray-500">Panel de gestión y análisis de derechos de petición.</p>
          </div>
          <HelpButton
            title="Cómo usar el módulo de Derechos de Petición"
            color="text-blue-700"
            tips={[
              'Sube el PDF del derecho de petición en "Procesar" para que el sistema extraiga los hechos automáticamente.',
              'El sistema genera un prompt enriquecido con RAG — cópialo y pégalo en la herramienta corporativa de IA.',
              'Pega la respuesta del LLM de vuelta en el sistema y exporta la contestación en PDF.',
              'Cambia el estado a "Respondida" una vez enviada la contestación al peticionario.',
            ]}
            sections={[
              {
                title: '¿Qué hace este módulo?',
                content: (
                  <p>
                    Este módulo gestiona el ciclo de vida completo de los derechos de petición que llegan al área jurídica.
                    Permite radicar, hacer seguimiento de términos legales y generar contestaciones apoyadas en inteligencia
                    documental: el sistema construye un prompt enriquecido con casos similares (RAG) que el abogado lleva
                    a la herramienta corporativa de IA, y la respuesta generada se incorpora al sistema para su exportación y archivo.
                  </p>
                )
              },
              {
                title: 'Paso 1 — Radicar y procesar el derecho de petición',
                content: (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Ve al menú <b>Procesar</b> y sube el PDF del derecho de petición recibido.</li>
                    <li>El sistema extrae automáticamente los hechos, pretensiones e información del peticionario.</li>
                    <li>Verifica que los datos extraídos sean correctos antes de continuar.</li>
                    <li>Asigna la prioridad (Alta / Media / Baja) según la urgencia del caso.</li>
                  </ol>
                )
              },
              {
                title: 'Paso 2 — Generar el prompt enriquecido con RAG',
                content: (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Desde el detalle del derecho de petición, haz clic en <b>Generar prompt</b>.</li>
                    <li>El sistema busca automáticamente en la <b>Memoria</b> casos y argumentos similares (RAG) y los incorpora al prompt.</li>
                    <li><b>Copia</b> el prompt generado y pégalo en la herramienta corporativa de inteligencia artificial.</li>
                    <li>La IA redactará la contestación con base en los hechos del caso y el contexto jurídico recuperado.</li>
                  </ol>
                )
              },
              {
                title: 'Paso 3 — Incorporar la respuesta y exportar',
                content: (
                  <ol className="list-decimal list-inside space-y-2">
                    <li><b>Copia</b> la contestación generada por la herramienta de IA.</li>
                    <li>Pégala en el campo correspondiente dentro del sistema.</li>
                    <li>Haz clic en <b>Exportar PDF</b> para descargar la contestación lista para enviar.</li>
                  </ol>
                )
              },
              {
                title: 'Paso 4 — Requerimientos internos',
                content: (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Si necesitas información de otra área antes de contestar, crea un <b>Requerimiento interno</b>.</li>
                    <li>Asigna el requerimiento al área responsable e indica la fecha límite de respuesta.</li>
                    <li>El área recibe una notificación y puede responder desde su panel.</li>
                    <li>Con las respuestas recibidas, puedes volver a generar el prompt con información más completa.</li>
                  </ol>
                )
              },
              {
                title: 'Paso 5 — Cierre del caso',
                content: (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Marca el derecho de petición como <b>Respondido</b> al enviar la contestación al peticionario.</li>
                    <li>El sistema registra la fecha de respuesta y calcula si se cumplió el término legal.</li>
                    <li>Los casos respondidos quedan en el historial y alimentan la Memoria para futuros casos.</li>
                  </ol>
                )
              },
              {
                title: 'Vistas y herramientas adicionales',
                content: (
                  <ul className="list-disc list-inside space-y-2">
                    <li><b>Bandeja Lista:</b> tabla filtrable por estado, prioridad, fecha y responsable.</li>
                    <li><b>Bandeja Kanban:</b> arrastra los derechos de petición entre columnas para cambiar su estado visualmente.</li>
                    <li><b>Inteligencia:</b> gráficas de tendencias, temas recurrentes y métricas del área.</li>
                    <li><b>Memoria:</b> base de argumentos legales reutilizables que el RAG consulta automáticamente.</li>
                    <li><b>Prioridad Alta</b> (rojo) se activa automáticamente cuando quedan menos de 5 días hábiles para responder.</li>
                  </ul>
                )
              }
            ]}
          />
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-[#002E6D] text-[#002E6D]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB: BANDEJA ─────────────────────────────────────────────────── */}
      {tab === 'bandeja' && (
        <div>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard titulo="Pendientes"  valor={tutelas.filter(t => t.estado === ESTADOS.PENDIENTE).length}  icono={<Clock size={20} className="text-amber-500" />}  color="bg-amber-50" />
            <KPICard titulo="En Proceso"  valor={tutelas.filter(t => t.estado === ESTADOS.EN_PROCESO).length} icono={<TrendingUp size={20} className="text-blue-500" />} color="bg-blue-50" />
            <KPICard titulo="Respondidas" valor={tutelas.filter(t => t.estado === ESTADOS.RESPONDIDA).length} icono={<FileCheck size={20} className="text-green-500" />} color="bg-green-50" />
            <KPICard titulo="Urgentes"    valor={tutelas.filter(t => t.prioridad === PRIORIDADES.ALTA && t.estado !== ESTADOS.RESPONDIDA).length} icono={<AlertTriangle size={20} className="text-red-500" />} color="bg-red-50" alerta />
          </div>

          {/* Filtros + toggle vista */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por radicado o accionante..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" onChange={e => setEstadoFilter(e.target.value)}>
              <option value="Todos">Todos los Estados</option>
              {Object.values(ESTADOS).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" onChange={e => setPrioridadFilter(e.target.value)}>
              <option value="Todas">Todas las Prioridades</option>
              {Object.values(PRIORIDADES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" onChange={e => setGrupoFilter(e.target.value)}>
              <option value="Todas">Todos los Grupos</option>
              {grupos.map(g => <option key={g.id} value={g.nombre}>{g.nombre}</option>)}
            </select>
            {/* Toggle lista/kanban */}
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 shrink-0">
              <button onClick={() => setViewMode('lista')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'lista' ? 'bg-white text-[#002E6D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <List size={14} /> Lista
              </button>
              <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'kanban' ? 'bg-white text-[#002E6D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Columns size={14} /> Kanban
              </button>
            </div>
          </div>

          {/* ── Vista Lista ── */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-xs uppercase font-semibold bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Radicado / Accionante</th>
                    <th className="px-6 py-4">Responsable</th>
                    <th className="px-6 py-4">Vencimiento</th>
                    <th className="px-6 py-4">Prioridad</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Riesgo</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Cargando bandeja...</td></tr>
                  ) : filteredTutelas.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No se encontraron tutelas.</td></tr>
                  ) : filteredTutelas.map(tutela => {
                    const sc = scoresMap[tutela.id];
                    const c  = sc ? NIVEL_COLOR[sc.nivel] : null;
                    return (
                      <tr key={tutela.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-gray-800">{tutela.radicado}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs truncate max-w-[150px] text-gray-500">{tutela.accionante}</span>
                            {tutela.derecho_vulnerado && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600">{tutela.derecho_vulnerado}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{tutela.responsables_nombres?.join(', ') || 'Sin asignar'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(tutela.fecha_vencimiento).toLocaleDateString()}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPrioridadColor(tutela.prioridad)}`}>{tutela.prioridad}</span></td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getEstadoColor(tutela.estado)}`}>{tutela.estado}</span></td>
                        <td className="px-6 py-4">
                          {loadingScores ? (
                            <div className="h-2 w-16 bg-gray-200 rounded-full animate-pulse" />
                          ) : sc ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${sc.score}%`, backgroundColor: c.bar }} />
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>{sc.nivel}</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link to={`/tutela/${tutela.id}`} className="text-gray-400 hover:text-[#002E6D] transition-colors"><ExternalLink size={18} /></Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Vista Kanban ── */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-3 gap-4 items-start">
              {[ESTADOS.PENDIENTE, ESTADOS.EN_PROCESO, ESTADOS.RESPONDIDA].map(estado => {
                const colTutelas = filteredTutelas.filter(t => t.estado === estado);
                const isOver = dragOver === estado;
                const colStyle = {
                  [ESTADOS.PENDIENTE]:  { header: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-400', label: 'text-amber-700'  },
                  [ESTADOS.EN_PROCESO]: { header: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500',  label: 'text-blue-700'   },
                  [ESTADOS.RESPONDIDA]: { header: 'bg-green-50 border-green-200',  dot: 'bg-green-500', label: 'text-green-700'  },
                }[estado];
                return (
                  <div
                    key={estado}
                    onDragOver={e => { e.preventDefault(); setDragOver(estado); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => handleDrop(estado)}
                    className={`rounded-2xl border-2 transition-all min-h-[200px] ${isOver ? 'border-[#002E6D] bg-blue-50/40 scale-[1.01]' : 'border-gray-200 bg-gray-50'}`}
                  >
                    {/* Cabecera columna */}
                    <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border-b ${colStyle.header}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colStyle.dot}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${colStyle.label}`}>{estado}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${colStyle.header}`}>{colTutelas.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="p-3 space-y-2.5">
                      {colTutelas.length === 0 && (
                        <p className="text-xs text-gray-400 text-center italic py-8">
                          {isOver ? 'Suelta aquí' : 'Sin peticiones'}
                        </p>
                      )}
                      {colTutelas.map(tutela => {
                        const sc  = scoresMap[tutela.id];
                        const c   = sc ? NIVEL_COLOR[sc.nivel] : null;
                        const dias = Math.ceil((new Date(tutela.fecha_vencimiento) - new Date()) / 86400000);
                        const diasColor = dias <= 0 ? 'text-red-600 font-bold' : dias <= 3 ? 'text-amber-600 font-semibold' : 'text-gray-500';
                        return (
                          <div
                            key={tutela.id}
                            draggable
                            onDragStart={() => setDragId(tutela.id)}
                            onDragEnd={() => { setDragId(null); setDragOver(null); }}
                            className={`bg-white border rounded-xl p-3.5 shadow-sm cursor-grab active:cursor-grabbing transition-all select-none ${dragId === tutela.id ? 'opacity-40 scale-95' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                          >
                            {/* Barra prioridad */}
                            <div className={`h-0.5 w-full rounded-full mb-3 ${tutela.prioridad === 'Alta' ? 'bg-red-400' : tutela.prioridad === 'Media' ? 'bg-amber-400' : 'bg-blue-400'}`} />

                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{tutela.radicado}</p>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">{tutela.accionante}</p>
                              </div>
                              <Link to={`/tutela/${tutela.id}`} onClick={e => e.stopPropagation()} className="shrink-0 p-1 text-gray-300 hover:text-[#002E6D] transition-colors rounded">
                                <ExternalLink size={13} />
                              </Link>
                            </div>

                            {tutela.derecho_vulnerado && (
                              <p className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium inline-block mb-2 truncate max-w-full">{tutela.derecho_vulnerado}</p>
                            )}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <User size={11} />
                                <span className="truncate max-w-[90px]">{tutela.responsables_nombres?.[0] || 'Sin asignar'}</span>
                              </div>
                              <span className={`text-[11px] ${diasColor}`}>
                                {dias <= 0 ? 'Vencida' : `${dias}d`}
                              </span>
                            </div>

                            {sc && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-1">
                                  <div className="h-1 rounded-full" style={{ width: `${sc.score}%`, backgroundColor: c.bar }} />
                                </div>
                                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${c.badge}`}>{sc.nivel}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Modal checklist Kanban → Respondida ── */}
          {kanbanChecklist && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Checklist de Cierre</h2>
                  <button onClick={() => setKanbanChecklist(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
                </div>
                <p className="text-xs text-gray-500 mb-1">Tutela: <span className="font-semibold text-gray-700">{kanbanChecklist.tutela.radicado}</span></p>
                <p className="text-xs text-gray-400 mb-6">Verifica lo siguiente antes de marcar como respondida:</p>
                <div className="space-y-4 mb-6">
                  {[
                    ['contestacion', 'Contestación radicada en juzgado'],
                    ['requerimientos', 'Requerimientos cerrados'],
                    ['notificacion', 'Notificación a partes confirmada'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded text-[#002E6D]" checked={kanbanCheck[key]} onChange={e => setKanbanCheck(prev => ({ ...prev, [key]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setKanbanChecklist(null); setKanbanCheck({ contestacion: false, requerimientos: false, notificacion: false }); }} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                  <button
                    onClick={confirmKanbanRespondida}
                    disabled={!kanbanCheck.contestacion || !kanbanCheck.requerimientos || !kanbanCheck.notificacion || updatingKanban}
                    className="flex-1 bg-[#002E6D] hover:bg-[#001d4a] disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    {updatingKanban ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: INTELIGENCIA ────────────────────────────────────────────── */}
      {tab === 'inteligencia' && (
        <div>
          {/* KPIs riesgo */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={18} className="text-red-600" /></div>
                <span className="text-xs font-bold uppercase text-gray-500">Riesgo Alto</span>
              </div>
              <p className="text-4xl font-black text-red-600">{altos}</p>
              <p className="text-xs mt-1 text-gray-400">tutelas activas</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp size={18} className="text-orange-500" /></div>
                <span className="text-xs font-bold uppercase text-gray-500">Riesgo Medio</span>
              </div>
              <p className="text-4xl font-black text-orange-500">{medios}</p>
              <p className="text-xs mt-1 text-gray-400">tutelas activas</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg"><Clock size={18} className="text-green-600" /></div>
                <span className="text-xs font-bold uppercase text-gray-500">Riesgo Bajo</span>
              </div>
              <p className="text-4xl font-black text-green-600">{bajos}</p>
              <p className="text-xs mt-1 text-gray-400">tutelas activas</p>
            </div>
          </div>

          {/* Tabla scores */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-800">Score de Riesgo por Tutela</h2>
              <div className="flex gap-2">
                {['Todos', 'Alto', 'Medio', 'Bajo'].map(n => (
                  <button key={n} onClick={() => setFiltroNivel(n)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filtroNivel === n ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase font-semibold bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Radicado / Accionante</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Vencimiento</th>
                    <th className="px-4 py-3">Días</th>
                    <th className="px-4 py-3">Reqs. pendientes</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Nivel</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingScores ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">Calculando scores...</td></tr>
                  ) : scoresFiltrados.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm italic text-gray-400">Sin tutelas en este nivel.</td></tr>
                  ) : scoresFiltrados.map(t => {
                    const c = NIVEL_COLOR[t.nivel];
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="font-bold text-gray-800">{t.radicado}</div>
                          <div className="text-xs truncate max-w-[160px] text-gray-400">{t.accionante}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{t.responsable}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(t.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                        <td className="px-4 py-3 text-sm font-mono">
                          <span className={t.dias_restantes <= 0 ? 'text-red-500 font-bold' : t.dias_restantes <= 3 ? 'text-orange-500 font-bold' : 'text-gray-700'}>
                            {t.dias_restantes <= 0 ? 'Vencida' : `${t.dias_restantes}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{t.reqs_pendientes}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                              <div className="h-2 rounded-full" style={{ width: `${t.score}%`, backgroundColor: c.bar }} />
                            </div>
                            <span className="font-mono text-xs font-bold w-8 text-right">{t.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.badge}`}>{t.nivel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/tutela/${t.id}`} className="text-gray-400 hover:text-[#002E6D] transition-colors"><ExternalLink size={16} /></Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tiempo de respuesta por área */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="font-bold mb-6 text-gray-800">Tiempo de Respuesta por Área</h2>
            {loadingTiempos ? (
              <p className="text-sm text-center py-8 text-gray-400">Cargando datos...</p>
            ) : tiempos.length === 0 ? (
              <p className="text-sm text-center py-8 italic text-gray-400">Sin requerimientos respondidos aún.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold uppercase mb-4 text-gray-500">Promedio días (todos)</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={tiempos} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="grupo" tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} unit="d" />
                      <Tooltip formatter={v => v !== null ? [`${v} días`, 'Promedio'] : ['Sin datos', 'Promedio']}
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb', fontSize: 12 }} />
                      <Bar dataKey="promedio_dias" radius={[4, 4, 0, 0]}>
                        {tiempos.map((_, i) => <Cell key={i} fill="#002E6D" />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase font-semibold bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Área</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Respondidos</th>
                        <th className="px-4 py-3">Prom. Alta</th>
                        <th className="px-4 py-3">Prom. Media</th>
                        <th className="px-4 py-3">Prom. Baja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tiempos.map((t, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{t.grupo}</td>
                          <td className="px-4 py-3 text-gray-700">{t.total}</td>
                          <td className="px-4 py-3 text-gray-700">{t.respondidos}</td>
                          <td className="px-4 py-3 text-gray-700">{t.promedio_dias_alta  !== null ? `${t.promedio_dias_alta}d`  : '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{t.promedio_dias_media !== null ? `${t.promedio_dias_media}d` : '—'}</td>
                          <td className="px-4 py-3 text-gray-700">{t.promedio_dias_baja  !== null ? `${t.promedio_dias_baja}d`  : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Carga por abogado ──────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Carga de Trabajo por Abogado</h2>
              <span className="text-xs text-gray-400">{carga.length} abogados con casos asignados</span>
            </div>
            {loadingCarga ? (
              <p className="text-sm text-center py-8 text-gray-400">Cargando datos...</p>
            ) : carga.length === 0 ? (
              <p className="text-sm text-center py-8 italic text-gray-400">Sin datos de carga.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase font-semibold bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Abogado</th>
                      <th className="px-5 py-3">Activos</th>
                      <th className="px-5 py-3 text-red-500">Urgentes</th>
                      <th className="px-5 py-3 text-amber-500">Medios</th>
                      <th className="px-5 py-3 text-blue-500">Bajos</th>
                      <th className="px-5 py-3">Cerrados</th>
                      <th className="px-5 py-3">Tasa cierre</th>
                      <th className="px-5 py-3">Próx. vencimiento</th>
                      <th className="px-5 py-3">Carga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carga.map((a, i) => {
                      const maxCasos = Math.max(...carga.map(x => x.casos_activos), 1);
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-semibold text-sm text-gray-800">{a.nombre}</td>
                          <td className="px-5 py-3 text-sm font-bold text-gray-800">{a.casos_activos}</td>
                          <td className="px-5 py-3 text-sm text-red-600 font-semibold">{a.urgentes || 0}</td>
                          <td className="px-5 py-3 text-sm text-amber-600">{a.medios || 0}</td>
                          <td className="px-5 py-3 text-sm text-blue-600">{a.bajos || 0}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">{a.casos_cerrados}</td>
                          <td className="px-5 py-3 text-sm">
                            <span className={`font-semibold ${a.tasa_cierre >= 70 ? 'text-green-600' : a.tasa_cierre >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                              {a.tasa_cierre}%
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {a.proximo_vencimiento ? new Date(a.proximo_vencimiento).toLocaleDateString('es-CO') : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="w-24 bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${(a.casos_activos / maxCasos) * 100}%`,
                                  backgroundColor: a.casos_activos / maxCasos > 0.7 ? '#ef4444' : a.casos_activos / maxCasos > 0.4 ? '#f97316' : '#22c55e'
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Patrones de fallo judicial ──────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-800">Patrones de Fallo Judicial</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tasa de éxito por derecho vulnerado y por juzgado</p>
            </div>
            {loadingFallos ? (
              <p className="text-sm text-center py-8 text-gray-400">Cargando datos...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                {/* Por derecho */}
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-4">Por Derecho Vulnerado</p>
                  {fallos.porDerecho.length === 0 ? (
                    <p className="text-sm italic text-gray-400">Sin datos de fallo aún.</p>
                  ) : (
                    <div className="space-y-3">
                      {fallos.porDerecho.map((d, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[55%]">{d.derecho}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-green-600 font-semibold">{d.favorables} ✓</span>
                              <span className="text-red-500 font-semibold">{d.desfavorables} ✗</span>
                              {d.tasa_exito !== null && (
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${d.tasa_exito >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {d.tasa_exito}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-[#002E6D]"
                              style={{ width: `${(d.total / (fallos.porDerecho[0]?.total || 1)) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{d.total} tutelas · {d.sin_fallo} sin fallo registrado</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Por juzgado */}
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-4">Por Juzgado</p>
                  {fallos.porJuzgado.length === 0 ? (
                    <p className="text-sm italic text-gray-400">Sin datos de juzgado aún.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase font-semibold bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-3 py-2">Juzgado</th>
                            <th className="px-3 py-2 text-center">Total</th>
                            <th className="px-3 py-2 text-center text-green-600">Fav.</th>
                            <th className="px-3 py-2 text-center text-red-500">Desfav.</th>
                            <th className="px-3 py-2 text-center">Éxito</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fallos.porJuzgado.map((j, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 text-xs truncate max-w-[140px]">{j.juzgado}</td>
                              <td className="px-3 py-2 text-center text-gray-700">{j.total}</td>
                              <td className="px-3 py-2 text-center text-green-600 font-semibold">{j.favorables}</td>
                              <td className="px-3 py-2 text-center text-red-500 font-semibold">{j.desfavorables}</td>
                              <td className="px-3 py-2 text-center">
                                {j.tasa_exito !== null ? (
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${j.tasa_exito >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {j.tasa_exito}%
                                  </span>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Eficiencia RAG ──────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800">Eficiencia de la Memoria Legal (RAG)</h2>
                <p className="text-xs text-gray-400 mt-0.5">Documentos más y menos útiles según feedback de usuarios</p>
              </div>
              {rag.resumen?.total && (
                <div className="flex gap-4 text-xs">
                  <span className="text-gray-500">{rag.resumen.total} docs</span>
                  <span className="text-green-600 font-semibold">↑ {rag.resumen.muy_utiles} muy útiles</span>
                  <span className="text-red-500 font-semibold">↓ {rag.resumen.candidatos_eliminar} a revisar</span>
                </div>
              )}
            </div>
            {loadingRag ? (
              <p className="text-sm text-center py-8 text-gray-400">Cargando datos...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                {/* Por categoría */}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Por Categoría</p>
                  {rag.porCategoria.length === 0 ? (
                    <p className="text-xs italic text-gray-400">Sin documentos indexados.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {rag.porCategoria.map((c, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{c.categoria}</p>
                            <p className="text-[10px] text-gray-400">{c.total_documentos} docs</p>
                          </div>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${c.score_promedio >= 1 ? 'bg-green-100 text-green-700' : c.score_promedio <= -1 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {c.score_promedio > 0 ? '+' : ''}{c.score_promedio}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Top útiles */}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase text-green-600 mb-3">Más Útiles</p>
                  <div className="space-y-2">
                    {rag.top_documentos.slice(0, 6).map((d, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-green-500 text-xs font-bold shrink-0 mt-0.5">+{d.relevancia_score}</span>
                        <p className="text-xs text-gray-600 leading-snug line-clamp-2">{d.titulo_referencia}</p>
                      </div>
                    ))}
                    {rag.top_documentos.length === 0 && <p className="text-xs italic text-gray-400">Sin datos.</p>}
                  </div>
                </div>
                {/* Candidatos a revisar */}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase text-red-500 mb-3">Candidatos a Revisar</p>
                  <div className="space-y-2">
                    {rag.bottom_documentos.slice(0, 6).map((d, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-red-400 text-xs font-bold shrink-0 mt-0.5">{d.relevancia_score}</span>
                        <p className="text-xs text-gray-600 leading-snug line-clamp-2">{d.titulo_referencia}</p>
                      </div>
                    ))}
                    {rag.bottom_documentos.length === 0 && <p className="text-xs italic text-gray-400">Sin datos.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ÁREAS ───────────────────────────────────────────────────── */}
      {tab === 'areas' && <SolicitudesPorArea />}

      {/* ── TAB: RESUMEN ─────────────────────────────────────────────────── */}
      {tab === 'resumen' && (
        <div>
          {/* Agenda */}
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Calendar size={18} className="text-blue-600" /> Agenda Jurídica (Próximas Tareas)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {tareas.length === 0 ? (
              <p className="text-sm italic text-gray-400">No hay tareas urgentes programadas.</p>
            ) : tareas.map((tarea, i) => (
              <Link to={`/tutela/${tarea.id}`} key={i}
                className={`p-4 rounded-xl border-l-4 bg-white border-gray-200 shadow-sm transition-all ${tarea.urgencia === 'critica' ? 'border-red-500' : 'border-amber-500'}`}>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-gray-800">{tarea.titulo}</h4>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${tarea.urgencia === 'critica' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'}`}>
                    {tarea.urgencia}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-2">{tarea.subtitulo}</p>
                <p className="text-[10px] font-bold uppercase text-gray-400">Vence: {tarea.fecha.toLocaleDateString()}</p>
              </Link>
            ))}
          </div>

          {/* ROI */}
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="font-bold mb-4 text-sm text-gray-800">Distribución por Categoría</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dataDerechos} dataKey="value" nameKey="name" outerRadius={75} label>
                    {dataDerechos.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="font-bold mb-4 text-sm text-gray-800">Evolución de Peticiones (Últimos 6 meses)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={estadisticas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e7eb' }} />
                  <Line type="monotone" dataKey="total" stroke="#002E6D" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ titulo, valor, icono, color, alerta }) {
  return (
    <div className={`p-6 rounded-xl border border-gray-200 bg-white shadow-sm ${alerta && valor > 0 ? 'border-red-500' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div className={`p-3 rounded-lg ${color}`}>{icono}</div>
        {alerta && valor > 0 && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        )}
      </div>
      <h4 className="text-3xl font-bold mb-1 text-gray-800">{valor}</h4>
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
    </div>
  );
}
