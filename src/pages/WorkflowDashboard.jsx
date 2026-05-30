import React, { useEffect, useState } from 'react';
import { workflowService } from '../services/workflowService';
import DefinitionBuilder from '../components/DefinitionBuilder';
import TaskDetail from '../components/TaskDetail';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';
import { PlusCircle, Eye } from 'lucide-react';

const WorkflowDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [abogados, setAbogados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ definitionId: '', stepAssignments: {} });

  useEffect(() => { fetchData(); fetchAbogados(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks') {
        const { data } = await workflowService.getTasks();
        setTasks(data);
      } else {
        const { data } = await workflowService.getDefinitions();
        setDefinitions(data);
      }
    } catch (err) { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const fetchAbogados = async () => {
    try {
      const { data } = await apiService.get('/admin/abogados-activos');
      setAbogados(data);
    } catch { toast.error('No se pudieron cargar abogados'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const selectedDef = definitions.find(d => d.id === formData.definitionId);
    if (!selectedDef) return toast.error('Selecciona una definición');

    const initialStep = Object.keys(selectedDef.steps)[0];
    try {
      await workflowService.createTask({
          definitionId: formData.definitionId,
          stepAssignments: formData.stepAssignments,
          initialStep: initialStep
      });
      toast.success('Tarea creada');
      setIsAdding(false); fetchData();
    } catch (err) { toast.error('Error al crear: ' + err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-white">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tareas</h1>
          <div className="flex gap-4 mt-4 text-sm">
            <button onClick={() => setActiveTab('tasks')} className={activeTab === 'tasks' ? 'text-blue-400' : 'text-gray-500'}>Tareas Activas</button>
            <button onClick={() => setActiveTab('definitions')} className={activeTab === 'definitions' ? 'text-blue-400' : 'text-gray-500'}>Definiciones</button>
          </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2"><PlusCircle size={16}/> Nueva {activeTab === 'tasks' ? 'Tarea' : 'Proceso'}</button>
      </header>

      {isAdding ? (
        activeTab === 'tasks' ? (
            <form onSubmit={handleCreate} className="bg-gray-800 p-6 rounded-lg mb-6 space-y-4">
                <select className="bg-gray-900 p-2 rounded w-full" onChange={e => setFormData({...formData, definitionId: e.target.value})}>
                    <option value="">Selecciona Proceso...</option>
                    {definitions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                
                {formData.definitionId && (
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(definitions.find(d => d.id === formData.definitionId)?.steps || {}).map(([key, step]) => (
                            <div key={key} className="bg-gray-900 p-3 rounded">
                                <label className="text-xs text-gray-400 block mb-1">{step.name} (Responsable)</label>
                                <select className="bg-gray-800 w-full p-1" onChange={e => setFormData({
                                    ...formData, stepAssignments: { ...formData.stepAssignments, [key]: e.target.value }
                                })}>
                                    <option value="">Sin asignar</option>
                                    {abogados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <button className="bg-green-600 px-4 py-2 rounded">Guardar Tarea</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="bg-gray-700 px-4 py-2 rounded">Cancelar</button>
                </div>
            </form>
        ) : (
            <div className="mb-6"><DefinitionBuilder refresh={() => {setIsAdding(false); fetchData();}} /></div>
        )
      ) : null}

      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 bg-gray-800 rounded-lg p-4">
            {tasks.map(task => (
              <div key={task.id} className="p-3 border-b border-gray-700 flex justify-between items-center hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedTask(task)}>
                <span>{task.current_step}</span>
                <Eye size={16} />
              </div>
            ))}
          </div>
          <div className="col-span-7">
            {selectedTask ? (
              <TaskDetail taskId={selectedTask.id} onClose={() => setSelectedTask(null)} refresh={fetchData} />
            ) : <p className="text-gray-500 text-center mt-10">Selecciona una tarea</p>}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-4">
            {definitions.map(d => <div key={d.id} className="p-3 border-b border-gray-700">{d.name}</div>)}
        </div>
      )}
    </div>
  );
};

export default WorkflowDashboard;
