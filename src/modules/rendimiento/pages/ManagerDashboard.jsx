import { useState, useEffect, useMemo } from 'react';
import apiService from '../../../services/apiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import TeamManagementModal from '../components/TeamManagementModal';
import ObjetivoModal from '../components/ObjetivoModal';

export default function ManagerDashboard() {
  const [equipos, setEquipos] = useState([]);
  const [selectedEquipo, setSelectedEquipo] = useState('');
  const [teamData, setTeamData] = useState([]); 
  const [modalEquipo, setModalEquipo] = useState(null);
  const [modalObjetivo, setModalObjetivo] = useState(null);
  const [activeProfessional, setActiveProfessional] = useState(null);
  const [selectedMes, setSelectedMes] = useState('');
  const [objetivos, setObjetivos] = useState([]);

  const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed'];

  useEffect(() => {
    fetchEquipos();
    fetchObjetivos();
  }, []);

  const fetchEquipos = async () => {
    try {
      const { data } = await apiService.get('/rendimiento/equipos');
      setEquipos(data);
    } catch (error) { toast.error('Error al cargar equipos'); }
  };

  const fetchObjetivos = async () => {
    try {
        const { data } = await apiService.get('/rendimiento/objetivos');
        setObjetivos(data);
    } catch (error) { toast.error('Error al cargar objetivos'); }
  };

  const fetchTeamStats = async (equipoId) => {
    try {
      const { data } = await apiService.get(`/rendimiento/historial/equipo/${equipoId}`);
      console.log('Datos del equipo recibidos:', data);
      setTeamData(data);
      setActiveProfessional(null);
      setSelectedMes('');
    } catch (error) { 
        console.error('Error al cargar historial:', error);
        toast.error('Error al cargar historial'); 
    }
  };

  const filteredData = useMemo(() => {
    let data = teamData;
    console.log('Filtrando teamData...', { data, activeProfessional, selectedMes });
    if (activeProfessional) data = data.filter(d => d.profesional === activeProfessional);
    if (selectedMes) data = data.filter(d => d.mes === selectedMes);
    console.log('Data filtrada:', data);
    return data;
  }, [teamData, activeProfessional, selectedMes]);

  const filteredObjetivos = useMemo(() => {
      if (!activeProfessional) return [];
      
      const professionalId = teamData.find(d => d.profesional === activeProfessional)?.usuario_id;
      
      // Combinamos los objetivos con los datos de cumplimiento que ya tenemos en teamData
      return objetivos.filter(o => Number(o.usuario_id) === Number(professionalId)).map(obj => {
          const stats = teamData.find(d => d.usuario_id === obj.usuario_id);
          
          return {
              ...obj,
              acciones_realizadas: stats ? Math.round((stats.cumplimiento * obj.meta_acciones) / 100) : 0,
              porcentaje_cumplimiento: stats ? stats.cumplimiento : 0
          };
      });
  }, [objetivos, activeProfessional, teamData]);

  const meses = useMemo(() => Array.from(new Set(teamData.map(d => d.mes))).sort(), [teamData]);

  return (
    <div className="bg-black border border-green-900 p-6 rounded-lg text-green-500 font-mono">
      <h2 className="text-xl font-bold mb-6 uppercase text-green-400">Panel de Manager</h2>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-1">Seleccionar Equipo:</label>
            <select 
                className="w-full bg-black border border-green-700 p-2 text-sm text-white"
                onChange={(e) => {
                    const id = e.target.value;
                    setSelectedEquipo(id);
                    if (id) fetchTeamStats(id);
                }}
                value={selectedEquipo}
            >
                <option value="">Seleccionar...</option>
                {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
        </div>
        <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-400 mb-1">Filtrar Mes:</label>
            <select className="w-full bg-black border border-green-700 p-2 text-sm text-white" onChange={(e) => setSelectedMes(e.target.value)} value={selectedMes}>
                <option value="">Todos los meses</option>
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
        {selectedEquipo && (
            <div className="mt-4 flex gap-2">
                <button onClick={() => setModalEquipo(equipos.find(e => e.id == selectedEquipo))} className="bg-green-800 text-white px-4 py-2 rounded text-xs">Gestionar Equipo</button>
                <button onClick={() => setModalObjetivo(selectedEquipo)} className="bg-blue-800 text-white px-4 py-2 rounded text-xs">Asignar Objetivo</button>
            </div>
        )}
      </div>
      
      {teamData.length > 0 && (
          <div className="h-64 w-full mb-6">
              <ResponsiveContainer>
                  <LineChart data={filteredData}> 
                      <XAxis dataKey="mes" stroke="#16a34a" />
                      <YAxis stroke="#16a34a" />
                      <Tooltip formatter={(value) => `${Math.round(value)}%`} />
                      <Legend />
                      {Array.from(new Set(teamData.map(d => d.profesional))).map((prof, i) => (
                          <Line key={prof} type="monotone" dataKey="cumplimiento" data={teamData.filter(d => d.profesional === prof && (!selectedMes || d.mes === selectedMes))} name={prof} stroke={COLORS[i % COLORS.length]} strokeWidth={2} hide={activeProfessional && activeProfessional !== prof} />
                      ))}
                  </LineChart>
              </ResponsiveContainer>
          </div>
      )}

      {activeProfessional && (
          <div className="mb-6">
              <button onClick={() => setActiveProfessional(null)} className="mb-4 text-green-400 hover:text-white">← Volver al equipo</button>
              <h3 className="text-sm font-bold mb-4 uppercase">Objetivos de {activeProfessional}</h3>
              <table className="w-full text-left border border-green-900 text-[10px]">
                <thead><tr className="text-green-700 uppercase">
                    <th>Título</th><th>Descripción</th><th>Meta</th><th>Cumplidas</th><th>%</th><th>Mes</th><th>Año</th>
                </tr></thead>
                <tbody>
                    {filteredObjetivos.map(obj => (
                        <tr key={obj.id} className="border-b border-green-900">
                            <td className="px-2 py-1">{obj.titulo}</td>
                            <td className="px-2 py-1">{obj.descripcion}</td>
                            <td className="px-2 py-1">{obj.meta_acciones}</td>
                            <td className="px-2 py-1">{obj.acciones_realizadas || 0}</td>
                            <td className="px-2 py-1">{Math.round(obj.porcentaje_cumplimiento || 0)}%</td>
                            <td className="px-2 py-1">{obj.mes}</td>
                            <td className="px-2 py-1">{obj.anio}</td>
                        </tr>
                    ))}
                </tbody>
              </table>
          </div>
      )}

      {!activeProfessional && teamData.length > 0 && (
          <table className="w-full text-left mt-4 border-t border-green-900">
              <thead><tr className="text-green-700 uppercase text-xs"><th>Profesional</th><th>Acción</th></tr></thead>
              <tbody>
                {Array.from(new Set(teamData.map(d => d.profesional))).map(prof => (
                    <tr key={prof} className="border-b border-green-900">
                        <td className="px-4 py-2 text-xs">{prof}</td>
                        <td className="px-4 py-2">
                            <button onClick={() => setActiveProfessional(prof)} className="text-green-400 hover:text-white text-xs">Filtrar</button>
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
    </div>
  );
}
