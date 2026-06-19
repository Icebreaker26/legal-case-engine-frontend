import { useState, useEffect, useCallback } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, DollarSign, Search, Tag, Filter, ScrollText, Settings, Save, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';


function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5 border-b border-green-900 pb-3">
      <Icon className="text-green-400 mt-0.5 shrink-0" size={16} />
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h2>
        {subtitle && <p className="text-[10px] text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {

  const [categorias, setCategorias] = useState([]);
  const [categoriasArchivadas, setCategoriasArchivadas] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState({ total: 0, page: 1, pages: 1, limit: 25, acciones: [] });
  const [logSearch, setLogSearch] = useState('');
  const [logAccion, setLogAccion] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(25);
  const [systemConfig, setSystemConfig] = useState({});
  const [roi, setRoi] = useState({ totalTutelas: 0, horasAhorradas: 0, dineroAhorrado: 0, configuracion: { tiempo_ahorrado_minutos: 100, costo_hora_juridico: 50 } });
  const [cargaTrabajo, setCargaTrabajo] = useState([]);
  const [latencia, setLatencia] = useState([]);
  const [showArchivadas, setShowArchivadas] = useState(false);

  const [nuevaCat, setNuevaCat] = useState('');
  const [editCatId, setEditCatId] = useState(null);
  const [editCatNombre, setEditCatNombre] = useState('');
  const [editCatKeywords, setEditCatKeywords] = useState('');

  const [nuevoPatron, setNuevoPatron] = useState({ patron: '', descripcion: '' });
  const [editPatronId, setEditPatronId] = useState(null);
  const [editPatronData, setEditPatronData] = useState({ patron: '', descripcion: '' });

  const [nuevaNota, setNuevaNota] = useState({ titulo: '', contenido: '' });

  const fetchCategorias = async () => { try { const { data } = await apiService.get('/core/categorias'); setCategorias(data); const { data: i } = await apiService.get('/core/categorias/inactivas'); setCategoriasArchivadas(i); } catch { toast.error('Error al cargar categorías'); } };
  const fetchNoise = async () => { try { const { data } = await apiService.get('/tutelas/noise'); setPatterns(data); } catch { toast.error('Error al cargar filtros'); } };
  const fetchConfig = async () => { try { const { data } = await apiService.get('/tutelas/config'); setSystemConfig(data); } catch { toast.error('Error al cargar configuración'); } };
  const fetchROI = async () => { try { const { data } = await apiService.get('/tutelas/roi'); setRoi(data); } catch {} };
  const fetchCargaTrabajo = async () => { try { const { data } = await apiService.get('/tutelas/carga-trabajo'); setCargaTrabajo(data); } catch {} };
  const fetchLatencia = async () => { try { const { data } = await apiService.get('/tutelas/latencia'); setLatencia(data.map(i => ({ ...i, mes: new Date(i.mes).toLocaleDateString('es-ES', { month: 'short' }), horas: parseFloat(i.horas_promedio).toFixed(1) }))); } catch {} };

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: logPage, limit: logLimit });
      if (logSearch) params.set('search', logSearch);
      if (logAccion) params.set('accion', logAccion);
      const { data } = await apiService.get(`/tutelas/logs?${params}`);
      setLogs(data.data);
      setLogsMeta({ total: data.total, page: data.page, pages: data.pages, limit: data.limit, acciones: data.acciones });
    } catch { toast.error('Error al cargar logs'); }
  }, [logPage, logLimit, logSearch, logAccion]);

  useEffect(() => {
    fetchCategorias(); fetchNoise(); fetchConfig();
    fetchROI(); fetchCargaTrabajo(); fetchLatencia();
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Categorías
  const handleCrearCategoria = async (e) => { e.preventDefault(); if (!nuevaCat.trim()) return; try { await apiService.post('/core/categorias', { nombre: nuevaCat }); setNuevaCat(''); fetchCategorias(); toast.success('Categoría creada'); } catch { toast.error('Error'); } };
  const handleUpdateCategoria = async (id) => { try { const kw = editCatKeywords.split(',').map(k => k.trim()).filter(k => k); await apiService.patch(`/core/categorias/${id}`, { nombre: editCatNombre, palabras_clave: kw }); setEditCatId(null); fetchCategorias(); toast.success('Categoría actualizada'); } catch { toast.error('Error'); } };
  const handleEliminarCategoria = async (id) => { try { await apiService.delete(`/core/categorias/${id}`); fetchCategorias(); toast.success('Categoría archivada'); } catch { toast.error('Error'); } };
  const handleRecuperarCategoria = async (id) => { try { await apiService.patch(`/core/categorias/${id}/recuperar`); fetchCategorias(); toast.success('Categoría recuperada'); } catch { toast.error('Error'); } };

  // Ruido
  const handleCrearPatron = async (e) => { e.preventDefault(); if (!nuevoPatron.patron.trim()) return; try { await apiService.post('/tutelas/noise', nuevoPatron); setNuevoPatron({ patron: '', descripcion: '' }); fetchNoise(); toast.success('Patrón creado'); } catch { toast.error('Error'); } };
  const handleUpdatePatron = async (id) => { try { await apiService.patch(`/tutelas/noise/${id}`, editPatronData); setEditPatronId(null); fetchNoise(); toast.success('Patrón actualizado'); } catch { toast.error('Error'); } };
  const handleDeletePatron = async (id) => { try { await apiService.delete(`/tutelas/noise/${id}`); fetchNoise(); toast.success('Patrón eliminado'); } catch { toast.error('Error'); } };
  const togglePatronStatus = async (id, current) => { try { await apiService.patch(`/tutelas/noise/${id}`, { activo: !current }); fetchNoise(); } catch { toast.error('Error'); } };

  // Config / Notas
  const handleAgregarNota = async (e) => { e.preventDefault(); if (!nuevaNota.titulo.trim() || !nuevaNota.contenido.trim()) return; const notas = [...(systemConfig.legal_notes || []), { ...nuevaNota, id: Date.now() }]; try { await apiService.post('/tutelas/config', { key: 'legal_notes', value: notas }); setSystemConfig(p => ({ ...p, legal_notes: notas })); setNuevaNota({ titulo: '', contenido: '' }); toast.success('Nota agregada'); } catch { toast.error('Error'); } };
  const handleEliminarNota = async (id) => { const notas = systemConfig.legal_notes.filter(n => n.id !== id); try { await apiService.post('/tutelas/config', { key: 'legal_notes', value: notas }); setSystemConfig(p => ({ ...p, legal_notes: notas })); toast.success('Nota eliminada'); } catch { toast.error('Error'); } };

  // ROI
  const updateROI = async () => { try { await apiService.patch('/tutelas/roi', roi.configuracion); fetchROI(); toast.success('Parámetros guardados'); } catch { toast.error('Error'); } };


  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header terminal */}
        <div className="bg-black rounded-lg shadow-2xl border border-gray-800 overflow-hidden font-mono mb-6">
          <div className="bg-gray-800 px-4 py-2 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-400 text-xs uppercase">admin@{import.meta.env.VITE_APP_NAME || 'tutelas'}: ~ panel de gestión</span>
          </div>
          <div className="px-6 py-4 text-green-500 text-[11px]">
            <span className="text-green-700">$ </span>
            <span className="text-green-400">load_config --all --env=production</span>
            <span className="ml-4 text-gray-600">// {categorias.length} categorías · {patterns.length} filtros · {logsMeta.total} logs</span>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── CATEGORÍAS ── */}
          <div className="bg-black rounded-lg border border-gray-800 font-mono overflow-hidden">
            <div className="bg-gray-900 px-4 py-2 border-b border-green-900">
              <span className="text-green-500 text-[10px] uppercase tracking-widest">[ categorías de derechos ]</span>
            </div>
            <div className="p-5 text-green-500">
              <SectionHeader icon={Tag} title="Categorías" subtitle="Clasificación de derechos vulnerados y sus palabras clave para detección automática" />
              <form onSubmit={handleCrearCategoria} className="flex gap-3 mb-5">
                <input
                  className="bg-gray-900 border border-green-900 focus:border-green-500 p-2 text-sm w-full text-white placeholder-green-900 outline-none transition-colors"
                  value={nuevaCat}
                  onChange={e => setNuevaCat(e.target.value)}
                  placeholder="> nombre de la categoría..."
                />
                <button type="submit" className="bg-green-800 text-black px-5 py-2 hover:bg-green-600 font-bold uppercase text-xs transition-colors flex items-center gap-2 shrink-0">
                  <Plus size={14} /> Agregar
                </button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categorias.map(c => (
                  <div key={c.id} className="bg-gray-950 p-4 border border-green-900 hover:border-green-700 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      {editCatId === c.id ? (
                        <input
                          className="bg-gray-800 text-white p-1 text-sm w-full outline-none border border-green-500 mr-2"
                          value={editCatNombre}
                          onChange={e => setEditCatNombre(e.target.value)}
                        />
                      ) : (
                        <span className={`text-sm font-bold ${c.is_active ? 'text-green-400' : 'text-gray-600 line-through'}`}>{c.nombre}</span>
                      )}
                      <div className="flex gap-2 shrink-0 ml-2">
                        <button
                          onClick={() => { setEditCatId(c.id); setEditCatNombre(c.nombre); setEditCatKeywords(c.palabras_clave?.join(', ') || ''); }}
                          className="text-gray-600 hover:text-green-400 transition-colors"
                        ><Edit size={14} /></button>
                        <button onClick={() => handleEliminarCategoria(c.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {editCatId === c.id ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <input
                          className="bg-gray-800 text-white p-1 text-xs w-full outline-none border border-green-900 placeholder-green-900"
                          value={editCatKeywords}
                          onChange={e => setEditCatKeywords(e.target.value)}
                          placeholder="palabras clave separadas por coma"
                        />
                        <button onClick={() => handleUpdateCategoria(c.id)} className="bg-green-800 text-black text-xs py-1 hover:bg-green-600 font-bold flex items-center justify-center gap-1">
                          <Save size={12} /> Guardar
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-600 font-mono mt-1 break-all leading-relaxed">
                        {c.palabras_clave?.join(', ') || <span className="text-gray-700 italic">sin palabras clave</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {categoriasArchivadas.length > 0 && (
                <div className="mt-5">
                  <button
                    onClick={() => setShowArchivadas(p => !p)}
                    className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw size={11} /> {showArchivadas ? 'Ocultar' : 'Ver'} archivadas ({categoriasArchivadas.length})
                  </button>
                  {showArchivadas && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {categoriasArchivadas.map(c => (
                        <div key={c.id} className="bg-gray-950 p-3 border border-gray-800 flex justify-between items-center">
                          <span className="text-gray-600 line-through text-sm">{c.nombre}</span>
                          <button onClick={() => handleRecuperarCategoria(c.id)} className="text-[10px] bg-green-900 text-green-400 px-3 py-1 hover:bg-green-800 uppercase tracking-wider">Recuperar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── FILTROS DE RUIDO ── */}
          <div className="bg-black rounded-lg border border-gray-800 font-mono overflow-hidden">
            <div className="bg-gray-900 px-4 py-2 border-b border-green-900">
              <span className="text-green-500 text-[10px] uppercase tracking-widest">[ filtros de ruido / limpieza de texto ]</span>
            </div>
            <div className="p-5 text-green-500">
              <SectionHeader icon={Filter} title="Filtros de Ruido" subtitle="Expresiones regulares aplicadas al texto de PDFs antes de generar embeddings" />
              <form onSubmit={handleCrearPatron} className="flex gap-2 mb-5">
                <input
                  className="bg-gray-900 border border-green-900 focus:border-green-500 p-2 text-xs w-full text-white placeholder-green-900 outline-none font-mono transition-colors"
                  value={nuevoPatron.patron}
                  onChange={e => setNuevoPatron({ ...nuevoPatron, patron: e.target.value })}
                  placeholder="regex del patrón..."
                />
                <input
                  className="bg-gray-900 border border-green-900 focus:border-green-500 p-2 text-xs w-full text-white placeholder-green-900 outline-none transition-colors"
                  value={nuevoPatron.descripcion}
                  onChange={e => setNuevoPatron({ ...nuevoPatron, descripcion: e.target.value })}
                  placeholder="descripción..."
                />
                <button type="submit" className="bg-green-800 text-black px-4 hover:bg-green-600 shrink-0 transition-colors">
                  <Plus size={16} />
                </button>
              </form>
              <div className="space-y-2">
                {patterns.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-gray-950 p-3 border border-green-900 gap-3">
                    {editPatronId === p.id ? (
                      <div className="flex gap-2 w-full">
                        <input className="bg-gray-800 text-white p-1 text-xs w-full outline-none border border-green-700 font-mono" value={editPatronData.patron} onChange={e => setEditPatronData({ ...editPatronData, patron: e.target.value })} />
                        <input className="bg-gray-800 text-white p-1 text-xs w-full outline-none border border-green-700" value={editPatronData.descripcion} onChange={e => setEditPatronData({ ...editPatronData, descripcion: e.target.value })} />
                        <button onClick={() => handleUpdatePatron(p.id)} className="bg-green-800 text-black px-3 text-xs hover:bg-green-600 shrink-0">
                          <Save size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <span
                          className={`font-mono text-xs ${p.activo ? 'text-green-400' : 'text-gray-700 line-through'}`}
                          onClick={() => togglePatronStatus(p.id, p.activo)}
                          title="Click para activar/desactivar"
                          style={{ cursor: 'pointer' }}
                        >
                          {p.patron}
                        </span>
                        {p.descripcion && <span className="text-gray-600 text-[10px] ml-3">{'// '}{p.descripcion}</span>}
                      </div>
                    )}
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditPatronId(p.id); setEditPatronData({ patron: p.patron, descripcion: p.descripcion }); }} className="text-gray-600 hover:text-green-400 transition-colors"><Edit size={14} /></button>
                      <button onClick={() => handleDeletePatron(p.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {patterns.length === 0 && <p className="text-gray-700 text-[10px] italic">No hay filtros definidos.</p>}
              </div>
            </div>
          </div>

          {/* ── NOTAS LEGALES ── */}
          <div className="bg-black rounded-lg border border-gray-800 font-mono overflow-hidden">
            <div className="bg-gray-900 px-4 py-2 border-b border-green-900">
              <span className="text-green-500 text-[10px] uppercase tracking-widest">[ argumentos fijos / notas legales ]</span>
            </div>
            <div className="p-5 text-green-500">
              <SectionHeader icon={Settings} title="Argumentos Fijos" subtitle="Fragmentos legales reutilizables disponibles para todos los abogados al redactar contestaciones" />
              <form onSubmit={handleAgregarNota} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5 bg-gray-900 p-4 border border-green-900 rounded">
                <div className="md:col-span-4">
                  <input
                    className="bg-black border border-green-900 focus:border-green-500 p-2 text-xs w-full text-green-400 placeholder-green-900 outline-none transition-colors"
                    value={nuevaNota.titulo}
                    onChange={e => setNuevaNota({ ...nuevaNota, titulo: e.target.value })}
                    placeholder="Título (ej: Prescripción)"
                  />
                </div>
                <div className="md:col-span-6">
                  <input
                    className="bg-black border border-green-900 focus:border-green-500 p-2 text-xs w-full text-green-400 placeholder-green-900 outline-none transition-colors"
                    value={nuevaNota.contenido}
                    onChange={e => setNuevaNota({ ...nuevaNota, contenido: e.target.value })}
                    placeholder="Contenido legal o legislación aplicable..."
                  />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-green-800 text-black py-2 hover:bg-green-600 font-bold uppercase text-[10px] transition-colors flex items-center justify-center gap-1">
                    <Plus size={13} /> Guardar
                  </button>
                </div>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(systemConfig.legal_notes || []).map(nota => (
                  <div key={nota.id} className="bg-gray-950 p-4 border border-green-900 flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-green-400 font-bold text-[10px] uppercase mb-1 tracking-wider">{nota.titulo}</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{nota.contenido}</p>
                    </div>
                    <button onClick={() => handleEliminarNota(nota.id)} className="text-gray-700 hover:text-red-500 transition-colors pt-0.5 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {(systemConfig.legal_notes || []).length === 0 && (
                  <p className="text-[10px] text-gray-700 italic">No hay argumentos fijos definidos.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── ROI ── */}
          <div className="bg-black rounded-lg border border-gray-800 font-mono overflow-hidden">
              <div className="bg-gray-900 px-4 py-2 border-b border-green-900">
                <span className="text-green-500 text-[10px] uppercase tracking-widest">[ roi & productividad ]</span>
              </div>
              <div className="p-5 text-green-500">
                <SectionHeader icon={DollarSign} title="ROI & Productividad" subtitle="Impacto económico del sistema y distribución de carga por abogado" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-950 p-5 border border-green-900">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Tutelas procesadas</p>
                    <p className="text-2xl font-bold text-white">{parseInt(roi.totalTutelas).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-950 p-5 border border-green-900">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Horas ahorradas</p>
                    <p className="text-2xl font-bold text-white">{Math.round(roi.horasAhorradas).toLocaleString()} h</p>
                  </div>
                  <div className="bg-gray-950 p-5 border border-green-900">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Impacto económico</p>
                    <p className="text-2xl font-bold text-green-400">${Math.round(roi.dineroAhorrado).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-950 border border-green-900 p-4 mb-6">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Parámetros de cálculo</p>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-600 mb-1">Tiempo ahorrado por caso (min)</label>
                      <input className="w-full bg-black border border-green-900 focus:border-green-500 p-2 text-sm text-white outline-none transition-colors" type="number" value={roi.configuracion.tiempo_ahorrado_minutos} onChange={e => setRoi({ ...roi, configuracion: { ...roi.configuracion, tiempo_ahorrado_minutos: e.target.value } })} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-600 mb-1">Costo hora jurídico ($)</label>
                      <input className="w-full bg-black border border-green-900 focus:border-green-500 p-2 text-sm text-white outline-none transition-colors" type="number" value={roi.configuracion.costo_hora_juridico} onChange={e => setRoi({ ...roi, configuracion: { ...roi.configuracion, costo_hora_juridico: e.target.value } })} />
                    </div>
                    <button onClick={updateROI} className="bg-green-800 text-black px-5 py-2 hover:bg-green-600 font-bold text-xs uppercase flex items-center gap-2 transition-colors shrink-0">
                      <Save size={14} /> Guardar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-950 p-5 border border-green-900">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Carga por abogado</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={cargaTrabajo}>
                        <XAxis dataKey="nombre" stroke="#4b5563" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #166534', fontSize: 11 }} />
                        <Bar dataKey="total_activas" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-gray-950 p-5 border border-green-900">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Latencia operativa (h promedio)</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={latencia}>
                        <XAxis dataKey="mes" stroke="#4b5563" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #166534', fontSize: 11 }} />
                        <Line type="monotone" dataKey="horas" stroke="#16a34a" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

          {/* ── LOGS ── */}
          <div className="bg-black rounded-lg border border-gray-800 font-mono overflow-hidden">
            <div className="bg-gray-900 px-4 py-2 border-b border-green-900">
              <span className="text-green-500 text-[10px] uppercase tracking-widest">[ /var/log/audit.log ]</span>
            </div>
            <div className="p-5 text-green-500">
              <SectionHeader icon={ScrollText} title="Logs de Auditoría" subtitle="Registro inmutable de todas las acciones realizadas en el sistema" />

              {/* Controles */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="bg-gray-900 p-3 border border-green-900 flex gap-3 items-center flex-1">
                  <Search className="text-green-800 shrink-0" size={14} />
                  <input
                    type="text"
                    placeholder="grep query — usuario o acción..."
                    className="bg-transparent border-none outline-none text-green-400 placeholder-green-900 w-full text-xs"
                    value={logSearch}
                    onChange={e => { setLogSearch(e.target.value); setLogPage(1); }}
                  />
                </div>
                <select
                  className="bg-gray-900 border border-green-900 text-green-400 text-xs px-3 py-2 outline-none"
                  value={logAccion}
                  onChange={e => { setLogAccion(e.target.value); setLogPage(1); }}
                >
                  <option value="">-- todas las acciones --</option>
                  {logsMeta.acciones.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select
                  className="bg-gray-900 border border-green-900 text-green-400 text-xs px-3 py-2 outline-none"
                  value={logLimit}
                  onChange={e => { setLogLimit(Number(e.target.value)); setLogPage(1); }}
                >
                  <option value={10}>10 / pág</option>
                  <option value={25}>25 / pág</option>
                  <option value={50}>50 / pág</option>
                  <option value={100}>100 / pág</option>
                </select>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] md:text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-green-900 text-green-800 uppercase">
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Usuario</th>
                      <th className="px-3 py-2">Acción</th>
                      <th className="px-3 py-2">Entidad</th>
                      <th className="px-3 py-2">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-950">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-green-950 transition-colors">
                        <td className="px-3 py-2 text-green-700 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-3 py-2 text-gray-400">{log.usuario_nombre}</td>
                        <td className="px-3 py-2 font-bold text-white">{log.accion}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {log.entidad_afectada}{log.radicado ? ` (${log.radicado})` : log.entidad_id ? ` [${log.entidad_id?.slice(0, 8)}...]` : ''}
                        </td>
                        <td className="px-3 py-2 text-green-900">{log.ip_origen}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-green-900 italic">// no records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4 text-[10px] text-green-800">
                <span>// {logsMeta.total.toLocaleString()} registros · página {logsMeta.page} de {logsMeta.pages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage === 1}
                    className="p-1 hover:text-green-400 disabled:opacity-30 transition-colors"
                  ><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.min(5, logsMeta.pages) }, (_, i) => {
                    const start = Math.max(1, Math.min(logPage - 2, logsMeta.pages - 4));
                    const p = start + i;
                    return p <= logsMeta.pages ? (
                      <button
                        key={p}
                        onClick={() => setLogPage(p)}
                        className={`px-2 py-0.5 transition-colors ${p === logPage ? 'text-green-400 bg-green-950' : 'hover:text-green-400'}`}
                      >{p}</button>
                    ) : null;
                  })}
                  <button
                    onClick={() => setLogPage(p => Math.min(logsMeta.pages, p + 1))}
                    disabled={logPage === logsMeta.pages}
                    className="p-1 hover:text-green-400 disabled:opacity-30 transition-colors"
                  ><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
