import { useState, useEffect, useMemo } from 'react';
import apiService from '../../../services/apiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import TeamManagementModal from '../components/TeamManagementModal';
import ObjetivoModal from '../components/ObjetivoModal';
import SonarKPI from '../components/SonarKPI';
import ModalHistorialAcciones from '../components/ModalHistorialAcciones';
import Typewriter from '../components/Typewriter';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [teamData, setTeamData] = useState([]); 
  const [modalEquipo, setModalEquipo] = useState(null);
  const [modalObjetivo, setModalObjetivo] = useState(null);
  const [showHistorial, setShowHistorial] = useState(null);
  const [activeProfessional, setActiveProfessional] = useState(null);
  const [selectedMes, setSelectedMes] = useState('');
  const [objetivos, setObjetivos] = useState([]);
  const [filtros, setFiltros] = useState({ mes: '', estado: 'active', busqueda: '' });

  const COLORS = ['#33FF33', '#00FF99', '#FFFF00', '#FF3333', '#FF9900'];

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      const { data } = await apiService.get('/core/areas');
      setEquipos(data);
      if (data.length > 0) {
        setSelectedEquipo(data[0].id);
        fetchTeamStats(data[0].id);
      }
    } catch (error) { toast.error('Error al cargar equipos'); }
  };

  const fetchObjetivosPorUsuario = async (usuarioId) => {
    try {
        const { data } = await apiService.get(`/rendimiento/cumplimiento/individual/${usuarioId}`);
        setObjetivos(data);
    } catch (error) { toast.error('Error al cargar objetivos'); }
  };

  const fetchTeamStats = async (equipoId) => {
    try {
      const [historialRes, objetivosRes] = await Promise.all([
          apiService.get(`/rendimiento/historial/equipo/${equipoId}`),
          apiService.get(`/rendimiento/objetivos/equipo/${equipoId}`)
      ]);
      setTeamData(historialRes.data);
      setObjetivos(objetivosRes.data);
      setActiveProfessional(null);
      setSelectedMes('');
    } catch (error) { 
        console.error('Error al cargar datos del equipo:', error);
        toast.error('Error al cargar datos del equipo'); 
    }
  };

  useEffect(() => {
      if (activeProfessional) {
          const prof = teamData.find(d => d.profesional === activeProfessional);
          if (prof) fetchObjetivosPorUsuario(prof.usuario_uuid);
          else setObjetivos([]);
      } else {
          // Si no hay profesional activo, recargar todos los objetivos del equipo seleccionado
          if(selectedEquipo) fetchTeamStats(selectedEquipo);
      }
  }, [activeProfessional]);

  const filteredData = useMemo(() => {
    let data = teamData;
    if (activeProfessional) data = data.filter(d => d.profesional === activeProfessional);
    if (selectedMes) data = data.filter(d => d.mes === selectedMes);
    return data;
  }, [teamData, activeProfessional, selectedMes]);

  const filteredObjetivos = useMemo(() => {
      return objetivos.filter(obj => {
          const matchMes = filtros.mes === '' || obj.mes === parseInt(filtros.mes);
          const estado = (obj.estado || '').trim().toLowerCase();
          const matchEstado = filtros.estado === '' || estado === filtros.estado.toLowerCase();
          const matchBusqueda = filtros.busqueda === '' || 
                                obj.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                                (obj.descripcion || '').toLowerCase().includes(filtros.busqueda.toLowerCase());
          
          return matchMes && matchEstado && matchBusqueda;
      });
  }, [objetivos, filtros]);

  const kpiData = useMemo(() => {
    const dataSet = filteredObjetivos;
    const activos = dataSet.filter(o => (o.estado || '').trim().toLowerCase() === 'active');
    const totalActivos = activos.length;
    const completados = dataSet.filter(o => (Number(o.porcentaje_cumplimiento) || 0) >= 100).length;
    
    const promedioCumplimiento = dataSet.length > 0 
      ? Math.round(dataSet.reduce((acc, obj) => acc + (Number(obj.porcentaje_cumplimiento) || 0), 0) / dataSet.length)
      : 0;
      
    const totalAcciones = dataSet.reduce((acc, obj) => acc + (Number(obj.acciones_realizadas) || 0), 0);
    
    return { totalObjetivos: totalActivos, completados, promedioCumplimiento, totalAcciones };
  }, [filteredObjetivos]);

  const meses = useMemo(() => Array.from(new Set(teamData.map(d => d.mes))).sort(), [teamData]);

  return (
    <div className="terminal-border bg-[#050A05] border-2 border-[#1A441A] p-6 text-[#33FF33] font-mono shadow-[0_0_10px_rgba(51,255,51,0.1)]">
      <div className="flex justify-between items-center mb-6 border-b border-[#1A441A] pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#33FF33]">[ PANEL DE MANAGER ]</h2>
        <div className="text-sm tracking-widest text-[#1A441A]">
            USER_AUTH: <span className="text-[#33FF33] text-lg"><Typewriter text={user?.nombre || 'OPERATOR'} /></span>
        </div>
      </div>
      
      {/* Sonar KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SonarKPI label="Equipos Activos" value={equipos.length} />
          <SonarKPI label="Objetivos Activos" value={kpiData.totalObjetivos} />
          <SonarKPI label="Cumplimiento Global" value={`${kpiData.promedioCumplimiento}%`} />
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4 p-4 border border-[#1A441A] bg-[#0A140A]">
        <div className="flex-1 min-w-[200px]">
            <label className="block text-sm uppercase tracking-wider mb-1">Equipo:</label>
            <select 
                className="w-full bg-[#050A05] border border-[#1A441A] p-3 text-base text-[#33FF33] outline-none focus:border-[#33FF33]"
                onChange={(e) => {
                    const id = e.target.value;
                    setSelectedEquipo(id);
                    if (id) fetchTeamStats(id);
                }}
                value={selectedEquipo}
            >
                <option value="">-- SELECCIONAR --</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
        </div>
        <div className="flex-1 min-w-[150px]">
            <label className="block text-sm uppercase tracking-wider mb-1">Mes:</label>
            <select className="w-full bg-[#050A05] border border-[#1A441A] p-3 text-base text-[#33FF33] outline-none focus:border-[#33FF33]" onChange={(e) => setSelectedMes(e.target.value)} value={selectedMes}>
                <option value="">TODOS</option>
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
        {selectedEquipo && (
            <div className="mt-4 flex gap-2">
                <button onClick={() => setModalObjetivo(selectedEquipo)} className="bg-[#1A441A] text-[#33FF33] px-6 py-3 text-sm uppercase hover:bg-[#33FF33] hover:text-[#050A05]">Objetivo</button>
            </div>
        )}
      </div>
      
      {teamData.length > 0 && (
          <div className="h-72 w-full mb-6 border border-[#1A441A] bg-[#050A05] p-4">
              <ResponsiveContainer>
                  <LineChart data={filteredData}> 
                      <XAxis dataKey="mes" stroke="#33FF33" tick={{fontSize: 14}} />
                      <YAxis stroke="#33FF33" tick={{fontSize: 14}} />
                      <Tooltip contentStyle={{backgroundColor: '#050A05', border: '1px solid #1A441A', color: '#33FF33', fontSize: '14px'}} formatter={(value) => `${Math.round(value)}%`} />
                      <Legend wrapperStyle={{fontSize: '14px'}} />
                      {Array.from(new Set(teamData.map(d => d.profesional))).map((prof, i) => (
                          <Line key={prof} type="step" dataKey="cumplimiento" data={teamData.filter(d => d.profesional === prof && (!selectedMes || d.mes === selectedMes))} name={prof} stroke={COLORS[i % COLORS.length]} strokeWidth={2} hide={activeProfessional && activeProfessional !== prof} />
                      ))}
                  </LineChart>
              </ResponsiveContainer>
          </div>
      )}

      {activeProfessional && (
          <div className="mb-6">
              <button onClick={() => setActiveProfessional(null)} className="mb-4 text-[#33FF33] hover:underline uppercase tracking-wider text-sm">[ ← VOLVER ]</button>
              
              {/* Filtros Profesionales */}
              <div className="mb-6 flex gap-4 p-4 border border-[#1A441A] bg-[#0A140A] flex-wrap">
                <div>
                    <label className="block text-xs uppercase text-[#1A441A] mb-1">Mes:</label>
                    <select className="bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none" value={filtros.mes} onChange={e => setFiltros({...filtros, mes: e.target.value})}>
                        <option value="">Todos</option>
                        {meses.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs uppercase text-[#1A441A] mb-1">Estado:</label>
                    <select className="bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none" value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}>
                        <option value="active">Activos</option>
                        <option value="archived">Archivados/Terminados</option>
                        <option value="">Todos</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs uppercase text-[#1A441A] mb-1">Buscar:</label>
                    <input 
                        className="w-full bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none"
                        placeholder="Filtrar por título o descripción..."
                        value={filtros.busqueda}
                        onChange={e => setFiltros({...filtros, busqueda: e.target.value})}
                    />
                </div>
              </div>

              <h3 className="text-base font-bold mb-4 uppercase tracking-wider">[ OBJETIVOS: {activeProfessional} ]</h3>
              <table className="w-full text-left border border-[#1A441A] text-base uppercase">
                <thead className="bg-[#0A140A] text-[#1A441A]"><tr className="border-b border-[#1A441A]">
                    <th className="px-4 py-4">Título</th>
                    <th className="px-4 py-4">Descripción</th>
                    <th className="px-4 py-4">Estado</th>
                    <th className="px-4 py-4">Meta</th>
                    <th className="px-4 py-4">Hechas</th>
                    <th className="px-4 py-4">%</th>
                    <th className="px-4 py-4">Mes/Año</th>
                    <th className="px-4 py-4">Acción</th>
                </tr></thead>
                <tbody>
                    {filteredObjetivos.map(obj => {
                        const realizadas = Number(obj.acciones_realizadas) || 0;
                        const meta = Number(obj.meta_acciones) || 1;
                        const progreso = Math.min(Math.round((realizadas / meta) * 100), 100);
                        
                        // Cálculo de estado (mismo que en Dashboard)
                        const hoy = new Date();
                        const diasEnMes = new Date(obj.anio, obj.mes, 0).getDate();
                        const progresoTiempo = Math.min((hoy.getDate() / diasEnMes) * 100, 100);
                        
                        let estadoColor = 'text-[#33FF33] border-[#1A441A]';
                        let estadoLabel = 'OK';
                        
                        if (progreso < progresoTiempo - 20) {
                            estadoColor = 'text-[#FF3333] border-[#FF3333] animate-pulse';
                            estadoLabel = 'CRITICAL';
                        } else if (progreso < progresoTiempo) {
                            estadoColor = 'text-[#FFFF00] border-[#FFFF00]';
                            estadoLabel = 'WARNING';
                        }

                        return (
                        <tr key={obj.id} className="border-b border-[#1A441A]">
                            <td className="px-4 py-4">{obj.titulo}</td>
                            <td className="px-4 py-4">{obj.descripcion}</td>
                            <td className="px-4 py-4">
                                <span className={`border px-2 py-0.5 text-[10px] uppercase font-bold ${estadoColor}`}>
                                    {estadoLabel}
                                </span>
                            </td>
                            <td className="px-4 py-4">{obj.meta_acciones}</td>
                            <td className="px-4 py-4">{realizadas}</td>
                            <td className="px-4 py-4">{progreso}%</td>
                            <td className="px-4 py-4">{obj.mes}/{obj.anio}</td>
                            <td className="px-4 py-4">
                                <button onClick={() => setShowHistorial(obj.id)} className="text-[#33FF33] hover:text-white flex items-center gap-2">
                                    <History size={18}/> Historial
                                </button>
                            </td>
                        </tr>
                    )})}
                </tbody>
              </table>
          </div>
      )}

      {!activeProfessional && teamData.length > 0 && (
          <table className="w-full text-left mt-4 border-t border-[#1A441A] text-sm">
              <thead className="text-[#1A441A] uppercase"><tr className="border-b border-[#1A441A]"><th>Profesional</th><th></th></tr></thead>
              <tbody>
                {Array.from(new Set(teamData.map(d => d.profesional))).map(prof => (
                    <tr key={prof} className="border-b border-[#1A441A]">
                        <td className="px-6 py-4 uppercase tracking-wider">{prof}</td>
                        <td className="px-6 py-4">
                            <button onClick={() => setActiveProfessional(prof)} className="text-[#33FF33] hover:underline uppercase">[ FILTRAR ]</button>
                        </td>
                    </tr>
                ))}
              </tbody>
          </table>
      )}

      {modalEquipo && (
          <TeamManagementModal 
            equipo={modalEquipo} 
            onClose={() => setModalEquipo(null)}
            onRefresh={() => fetchTeamStats(modalEquipo.id)}
          />
      )}
      
      {modalObjetivo && (
          <ObjetivoModal 
            equipoId={modalObjetivo} 
            onClose={() => setModalObjetivo(null)}
            onRefresh={() => fetchTeamStats(modalObjetivo)}
          />
      )}
      
      {showHistorial && (
          <ModalHistorialAcciones objetivoId={showHistorial} onClose={() => setShowHistorial(null)} />
      )}
    </div>
  );
}
