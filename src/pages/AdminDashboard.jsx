import { useState, useEffect, useMemo } from 'react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { Shield, Lock, CheckCircle, XCircle, Search, UserCog, Plus, Trash2, Edit, Terminal, TrendingUp, DollarSign, Clock, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PermissionModal from '../components/PermissionModal';

const PERMISSION_PRESETS = {
  juridico: [{ modulo: 'tutelas', accion: 'READ' }, { modulo: 'tutelas', accion: 'WRITE' }],
  comunicaciones: [{ modulo: 'comunicaciones', accion: 'READ_COM' }, { modulo: 'comunicaciones', accion: 'WRITE_COM' }],
  admin: [{ modulo: 'tutelas', accion: 'READ' }, { modulo: 'tutelas', accion: 'WRITE' }, { modulo: 'tutelas', accion: 'DELETE' }, { modulo: 'admin', accion: 'READ' }, { modulo: 'admin', accion: 'WRITE' }, { modulo: 'comunicaciones', accion: 'READ_COM' }, { modulo: 'comunicaciones', accion: 'WRITE_COM' }, { modulo: 'comunicaciones', accion: 'DELETE_COM' }]
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [areas, setAreas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [nuevaNota, setNuevaNota] = useState({ titulo: '', contenido: '' });
  const [roi, setRoi] = useState({ totalTutelas: 0, horasAhorradas: 0, dineroAhorrado: 0, configuracion: { tiempo_ahorrado_minutos: 100, costo_hora_juridico: 50.00 } });
  const [cargaTrabajo, setCargaTrabajo] = useState([]);
  const [latencia, setLatencia] = useState([]);
  
  const [nuevaArea, setNuevaArea] = useState('');
  const [editAreaId, setEditAreaId] = useState(null);
  const [editAreaNombre, setEditAreaNombre] = useState('');

  const [nuevaCat, setNuevaCat] = useState('');
  const [editCatId, setEditCatId] = useState(null);
  const [editCatNombre, setEditCatNombre] = useState('');
  const [editCatKeywords, setEditCatKeywords] = useState('');

  const [nuevoPatron, setNuevoPatron] = useState({ patron: '', descripcion: '' });
  const [editPatronId, setEditPatronId] = useState(null);
  const [editPatronData, setEditPatronData] = useState({ patron: '', descripcion: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterApproval, setFilterApproval] = useState('Todos');

  useEffect(() => {
    fetchUsers();
    fetchAreas();
    fetchCategorias();
    fetchNoise();
    fetchLogs();
    fetchROI();
    fetchCargaTrabajo();
    fetchLatencia();
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await apiService.get('/admin/config');
      setSystemConfig(data);
    } catch (err) { toast.error('Error al cargar configuración'); }
  };

  const toggleConfig = async (key, currentValue) => {
    try {
      await apiService.post('/admin/config', { key, value: !currentValue });
      setSystemConfig(prev => ({ ...prev, [key]: !currentValue }));
      toast.success('Configuración actualizada');
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const handleAgregarNota = async (e) => {
    e.preventDefault();
    if (!nuevaNota.titulo.trim() || !nuevaNota.contenido.trim()) return;

    const notasActuales = systemConfig.legal_notes || [];
    const nuevasNotas = [...notasActuales, { ...nuevaNota, id: Date.now() }];

    try {
      await apiService.post('/admin/config', { key: 'legal_notes', value: nuevasNotas });
      setSystemConfig(prev => ({ ...prev, legal_notes: nuevasNotas }));
      setNuevaNota({ titulo: '', contenido: '' });
      toast.success('Argumento fijo agregado');
    } catch (err) { toast.error('Error al guardar nota'); }
  };

  const handleEliminarNota = async (id) => {
    const nuevasNotas = systemConfig.legal_notes.filter(n => n.id !== id);
    try {
      await apiService.post('/admin/config', { key: 'legal_notes', value: nuevasNotas });
      setSystemConfig(prev => ({ ...prev, legal_notes: nuevasNotas }));
      toast.success('Nota eliminada');
    } catch (err) { toast.error('Error al eliminar'); }
  };

  const fetchUserPermissions = async (userId) => {
    try {
      const { data } = await apiService.get(`/permisos/usuario/${userId}`);
      setUserPermissions(prev => ({ ...prev, [userId]: data }));
    } catch (error) { console.error(`Error al cargar permisos del usuario ${userId}`); }
  };

  const asignarPermiso = async (userId, modulo, accion) => {
    try {
      const response = await apiService.post('/permisos/asignar', { 
          usuario_id: userId, modulo, accion 
      }, {
          validateStatus: (status) => status >= 200 && status < 300 || status === 409
      });

      if (response.status === 409) {
        toast.success('El permiso ya estaba asignado');
      } else {
        toast.success('Permiso asignado');
      }
      fetchUserPermissions(userId);
    } catch (error) {
        toast.error('Error al asignar');
    }
  };

  const revocarPermiso = async (userId, modulo, accion) => {
    try {
      await apiService.delete('/permisos/revocar', { data: { usuario_id: userId, modulo, accion } });
      toast.success('Permiso revocado');
      fetchUserPermissions(userId);
    } catch (error) { toast.error('Error al revocar'); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await apiService.get('/admin/usuarios');
      setUsers(data);
      data.forEach(u => fetchUserPermissions(u.id));
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };
  
  const fetchAreas = async () => {
    try {
      const { data } = await apiService.get('/admin/areas');
      setAreas(data);
    } catch (err) {
      toast.error('Error al cargar áreas');
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data } = await apiService.get('/admin/categorias');
      setCategorias(data);
    } catch (err) {
      toast.error('Error al cargar categorías');
    }
  };

  const fetchNoise = async () => {
    try {
      const { data } = await apiService.get('/admin/noise');
      setPatterns(data);
    } catch (err) {
      toast.error('Error al cargar patrones de ruido');
    }
  };
  
  const fetchLogs = async () => {
    try {
      const { data } = await apiService.get('/admin/logs');
      setLogs(data);
    } catch (err) { toast.error('Error al cargar logs'); }
  };

  const fetchROI = async () => {
    try {
        const { data } = await apiService.get('/admin/roi');
        setRoi(data);
    } catch (err) { toast.error('Error al cargar ROI'); }
  };

  const fetchCargaTrabajo = async () => {
    try {
        const { data } = await apiService.get('/admin/carga-trabajo');
        setCargaTrabajo(data);
    } catch (err) { toast.error('Error al cargar carga de trabajo'); }
  };

  const fetchLatencia = async () => {
    try {
        const { data } = await apiService.get('/admin/latencia');
        setLatencia(data.map(item => ({
            ...item,
            mes: new Date(item.mes).toLocaleDateString('es-ES', { month: 'short' }),
            horas: parseFloat(item.horas_promedio).toFixed(1)
        })));
    } catch (err) { toast.error('Error al cargar latencia'); }
  };

  const updateROI = async () => {
    try {
        await apiService.patch('/admin/roi', roi.configuracion);
        fetchROI();
        toast.success('Parámetros guardados');
    } catch (err) { toast.error('Error al guardar'); }
  };

  const handleCrearArea = async (e) => {
    e.preventDefault();
    if (!nuevaArea.trim()) return;
    try {
        await apiService.post('/admin/areas', { nombre: nuevaArea });
        setNuevaArea('');
        fetchAreas();
        toast.success('Área creada');
    } catch (err) { toast.error('Error al crear área'); }
  };

  const handleUpdateArea = async (id) => {
    try {
        await apiService.patch(`/admin/areas/${id}`, { nombre: editAreaNombre });
        setEditAreaId(null);
        fetchAreas();
        toast.success('Área renombrada');
    } catch (err) { toast.error('Error al renombrar'); }
  };

  const toggleAreaStatus = async (id, currentStatus) => {
    try {
        await apiService.patch(`/admin/areas/${id}`, { activo: !currentStatus });
        fetchAreas();
        toast.success('Área actualizada');
    } catch (err) { toast.error('Error al actualizar área'); }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCat.trim()) return;
    try {
        await apiService.post('/admin/categorias', { nombre: nuevaCat, palabras_clave: [] });
        setNuevaCat('');
        fetchCategorias();
        toast.success('Categoría creada');
    } catch (err) { toast.error('Error al crear categoría'); }
  };

  const handleUpdateCategoria = async (id) => {
    try {
        const keywordsArray = editCatKeywords.split(',').map(k => k.trim()).filter(k => k);
        await apiService.patch(`/admin/categorias/${id}`, { nombre: editCatNombre, palabras_clave: keywordsArray });
        setEditCatId(null);
        fetchCategorias();
        toast.success('Categoría actualizada');
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const toggleCategoriaStatus = async (id, currentStatus) => {
    try {
        await apiService.patch(`/admin/categorias/${id}`, { activo: !currentStatus });
        fetchCategorias();
        toast.success('Categoría actualizada');
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const handleCrearPatron = async (e) => {
    e.preventDefault();
    if (!nuevoPatron.patron.trim()) return;
    try {
        await apiService.post('/admin/noise', nuevoPatron);
        setNuevoPatron({ patron: '', descripcion: '' });
        fetchNoise();
        toast.success('Patrón creado');
    } catch (err) { toast.error('Error al crear patrón'); }
  };

  const handleUpdatePatron = async (id) => {
    try {
        await apiService.patch(`/admin/noise/${id}`, editPatronData);
        setEditPatronId(null);
        fetchNoise();
        toast.success('Patrón actualizado');
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const handleDeletePatron = async (id) => {
    try {
        await apiService.delete(`/admin/noise/${id}`);
        fetchNoise();
        toast.success('Patrón eliminado');
    } catch (err) { toast.error('Error al eliminar'); }
  };

  const togglePatronStatus = async (id, currentStatus) => {
    try {
        await apiService.patch(`/admin/noise/${id}`, { activo: !currentStatus });
        fetchNoise();
        toast.success('Estado actualizado');
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const getPredominantRole = (userId) => {
    const perms = userPermissions[userId] || [];
    if (perms.length === 0) return 'Sin Rol';

    const hasRole = (role) => {
        return PERMISSION_PRESETS[role].every(presetPerm => 
            perms.some(p => p.modulo === presetPerm.modulo && p.accion === presetPerm.accion)
        );
    };

    if (hasRole('admin')) return 'Admin';
    if (hasRole('juridico')) return 'Jurídico';
    
    return 'Personalizado';
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || (filterStatus === 'Activos' ? u.activo : !u.activo);
      const matchesApproval = filterApproval === 'Todos' || (filterApproval === 'Aprobados' ? u.is_approved : !u.is_approved);
      return matchesSearch && matchesStatus && matchesApproval;
    });
  }, [users, searchTerm, filterStatus, filterApproval]);

  const cambiarRol = async (id, nuevoRol) => {
    try {
      await apiService.patch(`/admin/usuarios/${id}/rol`, { rol: nuevoRol });
      fetchUsers();
      toast.success('Rol actualizado');
    } catch (error) {
      toast.error('Error al actualizar rol');
    }
  };

  const toggleApproval = async (id, currentApproval) => {
    try {
      await apiService.patch(`/admin/usuarios/${id}`, { is_approved: !currentApproval });
      fetchUsers();
      toast.success('Estado de aprobación actualizado');
    } catch (error) {
      toast.error('Error al actualizar aprobación');
    }
  };

  const toggleStatus = async (id, currentStatus, isApproved) => {
    try {
      await apiService.patch(`/admin/usuarios/${id}`, { 
        activo: !currentStatus,
        is_approved: isApproved
      });
      fetchUsers();
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleResetPassword = async (id, nombre) => {
    const newPassword = prompt(`Introduce la nueva contraseña para ${nombre}:`);
    if (!newPassword) return;
    
    try {
      await apiService.post(`/admin/usuarios/${id}/reset-password`, { newPassword });
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      toast.error('Error al resetear contraseña');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-black rounded-lg shadow-2xl border border-gray-800 overflow-hidden font-mono text-[10px] md:text-sm">
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 text-xs ml-2 uppercase hidden md:inline">admin@{import.meta.env.VITE_APP_NAME}: ~</span>
          </div>
          <div className="flex gap-1 text-[10px] md:text-xs">
              {['usuarios', 'areas', 'categorias', 'ruido', 'logs', 'roi', 'config'].map(tab => (
                  <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2 py-1 md:px-3 md:py-1 uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-green-900 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      {tab}
                  </button>
              ))}
          </div>
        </div>

        <div className="p-4 md:p-6 text-green-500">
          {activeTab === 'config' && (
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                  <Shield className="text-green-400" size={20} />
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">Configuración del Sistema</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-900 p-6 border border-green-900 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-bold">Borradores IA (OpenAI)</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Habilita la redacción automática de contestaciones usando GPT-4o. 
                                Requiere conexión externa.
                            </p>
                        </div>
                        <button 
                            onClick={() => toggleConfig('ai_draft_enabled', systemConfig.ai_draft_enabled)}
                            className={`px-4 py-2 rounded font-bold text-xs transition-colors ${systemConfig.ai_draft_enabled ? 'bg-green-600 text-black hover:bg-green-500' : 'bg-red-900 text-white hover:bg-red-800'}`}
                        >
                            {systemConfig.ai_draft_enabled ? 'ACTIVADO' : 'DESACTIVADO'}
                        </button>
                    </div>
                </div>

                <div className="mt-12 border-t border-green-800 pt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Terminal className="text-green-400" size={20} />
                        <h3 className="text-white font-bold uppercase tracking-widest">Gestión de Argumentos Fijos (Notas Legales)</h3>
                    </div>

                    <form onSubmit={handleAgregarNota} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 bg-gray-900 p-4 rounded-lg border border-green-900">
                        <div className="md:col-span-4">
                            <input 
                                className="bg-black border border-green-700 p-2 text-xs w-full text-green-400 placeholder-green-900 outline-none focus:border-green-400" 
                                value={nuevaNota.titulo} 
                                onChange={e => setNuevaNota({...nuevaNota, titulo: e.target.value})} 
                                placeholder="Título (ej: Prescripción)" 
                            />
                        </div>
                        <div className="md:col-span-6">
                            <input 
                                className="bg-black border border-green-700 p-2 text-xs w-full text-green-400 placeholder-green-900 outline-none focus:border-green-400" 
                                value={nuevaNota.contenido} 
                                onChange={e => setNuevaNota({...nuevaNota, contenido: e.target.value})} 
                                placeholder="Contenido legal o legislación..." 
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="w-full bg-green-800 text-black py-2 hover:bg-green-600 font-bold uppercase text-[10px] transition-colors flex items-center justify-center gap-2">
                                <Plus size={14} /> Guardar
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(systemConfig.legal_notes || []).map(nota => (
                            <div key={nota.id} className="bg-gray-950 p-4 border border-green-900 flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h4 className="text-green-400 font-bold text-xs uppercase mb-1">{nota.titulo}</h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed">{nota.contenido}</p>
                                </div>
                                <button onClick={() => handleEliminarNota(nota.id)} className="text-red-900 hover:text-red-500 transition-colors pt-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {(systemConfig.legal_notes || []).length === 0 && (
                            <p className="text-[10px] text-gray-700 italic">No hay argumentos fijos definidos.</p>
                        )}
                    </div>
                </div>
            </div>
          )}
          {activeTab === 'usuarios' && (
            <div>
              <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                <UserCog className="text-green-400" size={20} />
                <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider">User Administration</h1>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg border border-green-900 mb-6 flex flex-wrap gap-4 items-center">
                <Search className="text-green-700" size={16} />
                <input 
                  type="text" placeholder="grep user..."
                  className="bg-transparent border-none outline-none text-green-400 placeholder-green-900 w-full md:w-auto flex-1"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="bg-black border border-green-900 text-green-500 p-1 rounded" onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="Todos">Status: ALL</option>
                  <option value="Activos">Active</option>
                  <option value="Inactivos">Inactive</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-green-900 text-green-700 uppercase">
                      <th className="px-4 py-2">Nombre</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2">Aprobado</th>
                      <th className="px-4 py-2">Permisos</th>
                      <th className="px-4 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-900">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-green-950">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{u.nombre}</span>
                                {(userPermissions[u.id] || []).some(p => p.modulo === 'admin' && p.accion === 'WRITE') && (
                                    <Shield className="text-red-500 flex-shrink-0" size={14} title="Administrador" />
                                )}
                            </div>
                            <span className="text-xs text-gray-500">{u.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleStatus(u.id, u.activo, u.is_approved)} className={`px-2 py-1 rounded text-xs font-bold ${u.activo ? 'text-green-400' : 'text-red-400'}`}>
                            {u.activo ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleApproval(u.id, u.is_approved)} className="flex items-center gap-1">
                            {u.is_approved ? <CheckCircle className="text-green-600" size={16} /> : <XCircle className="text-yellow-600" size={16} />}
                            <span className="text-xs">{u.is_approved ? 'APPROVED' : 'PENDING'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                           <button onClick={() => setSelectedUser(u)} className="bg-green-900 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">Gestionar</button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleResetPassword(u.id, u.nombre)} className="text-green-600 hover:underline font-mono">
                            [RESET_PASS]
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'areas' && (
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                  <Edit className="text-green-400" size={20} />
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">Gestión de Áreas</h2>
                </div>
                
                <form onSubmit={handleCrearArea} className="flex gap-4 mb-8 bg-gray-900 p-4 rounded-lg border border-green-900">
                    <input 
                      className="bg-transparent border-b border-green-700 p-2 text-sm w-full text-white placeholder-green-900 outline-none focus:border-green-400" 
                      value={nuevaArea} 
                      onChange={e => setNuevaArea(e.target.value)} 
                      placeholder="> Nombre de nueva área..." 
                    />
                    <button type="submit" className="bg-green-800 text-black px-6 py-2 hover:bg-green-600 font-bold uppercase text-xs transition-colors flex items-center gap-2">
                        <Plus size={16} /> Agregar
                    </button>
                </form>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {areas.map(a => (
                        <div key={a.id} className="flex justify-between items-center bg-gray-950 p-4 border border-green-900 hover:border-green-600 transition-colors">
                            {editAreaId === a.id ? (
                                <input 
                                    className="bg-gray-800 text-white p-1 text-sm w-full outline-none border border-green-500" 
                                    value={editAreaNombre} 
                                    onChange={e => setEditAreaNombre(e.target.value)}
                                    onBlur={() => handleUpdateArea(a.id)}
                                    autoFocus
                                />
                            ) : (
                                <span className={`text-sm ${a.activo ? 'text-green-400' : 'text-gray-600 line-through'}`}>{a.nombre}</span>
                            )}
                            <div className="flex gap-2">
                                <button onClick={() => { setEditAreaId(a.id); setEditAreaNombre(a.nombre); }} className="text-gray-500 hover:text-green-400"><Edit size={16}/></button>
                                <button onClick={() => toggleAreaStatus(a.id, a.activo)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'categorias' && (
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                  <Edit className="text-green-400" size={20} />
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">Gestión de Categorías</h2>
                </div>
                
                <form onSubmit={handleCrearCategoria} className="flex gap-4 mb-8 bg-gray-900 p-4 rounded-lg border border-green-900">
                    <input 
                      className="bg-transparent border-b border-green-700 p-2 text-sm w-full text-white placeholder-green-900 outline-none focus:border-green-400" 
                      value={nuevaCat} 
                      onChange={e => setNuevaCat(e.target.value)} 
                      placeholder="> Nombre de nueva categoría..." 
                    />
                    <button type="submit" className="bg-green-800 text-black px-6 py-2 hover:bg-green-600 font-bold uppercase text-xs transition-colors flex items-center gap-2">
                        <Plus size={16} /> Agregar
                    </button>
                </form>
                
                <div className="grid grid-cols-1 gap-4">
                    {categorias.map(c => (
                        <div key={c.id} className="bg-gray-950 p-4 border border-green-900 hover:border-green-600 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                {editCatId === c.id ? (
                                    <input 
                                        className="bg-gray-800 text-white p-1 text-sm w-full outline-none border border-green-500" 
                                        value={editCatNombre} 
                                        onChange={e => setEditCatNombre(e.target.value)}
                                    />
                                ) : (
                                    <span className={`text-sm font-bold ${c.activo ? 'text-green-400' : 'text-gray-600 line-through'}`}>{c.nombre}</span>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditCatId(c.id); setEditCatNombre(c.nombre); setEditCatKeywords(c.palabras_clave ? c.palabras_clave.join(', ') : ''); }} className="text-gray-500 hover:text-green-400"><Edit size={16}/></button>
                                    <button onClick={() => toggleCategoriaStatus(c.id, c.activo)} className="text-red-900 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            {editCatId === c.id ? (
                                <div className="flex flex-col gap-2">
                                    <input 
                                        className="bg-gray-800 text-white p-1 text-xs w-full outline-none border border-green-700" 
                                        value={editCatKeywords} 
                                        onChange={e => setEditCatKeywords(e.target.value)}
                                        placeholder="Palabras clave (separadas por coma)"
                                    />
                                    <button onClick={() => handleUpdateCategoria(c.id)} className="bg-green-800 text-white text-xs py-1">Guardar</button>
                                </div>
                            ) : (
                                <p className="text-[10px] text-gray-500 font-mono mt-1 break-all">{c.palabras_clave ? c.palabras_clave.join(', ') : ''}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'ruido' && (
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                  <Terminal className="text-green-400" size={20} />
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">Gestión de Filtros de Ruido</h2>
                </div>
                <form onSubmit={handleCrearPatron} className="flex gap-2 mb-6">
                  <input className="bg-gray-900 border border-green-900 p-2 text-sm w-full text-white placeholder-green-900 outline-none" value={nuevoPatron.patron} onChange={e => setNuevoPatron({...nuevoPatron, patron: e.target.value})} placeholder="Regex del patrón..." />
                  <input className="bg-gray-900 border border-green-900 p-2 text-sm w-full text-white placeholder-green-900 outline-none" value={nuevoPatron.descripcion} onChange={e => setNuevoPatron({...nuevoPatron, descripcion: e.target.value})} placeholder="Descripción..." />
                  <button type="submit" className="bg-green-800 text-white px-4 hover:bg-green-700"><Plus /></button>
                </form>
                <div className="grid grid-cols-1 gap-2">
                  {patterns.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-900 p-3 border border-green-900">
                      {editPatronId === p.id ? (
                        <div className="flex gap-2 w-full">
                            <input className="bg-gray-800 text-white p-1 text-xs w-full" value={editPatronData.patron} onChange={e => setEditPatronData({...editPatronData, patron: e.target.value})} />
                            <input className="bg-gray-800 text-white p-1 text-xs w-full" value={editPatronData.descripcion} onChange={e => setEditPatronData({...editPatronData, descripcion: e.target.value})} />
                            <button onClick={() => handleUpdatePatron(p.id)} className="bg-green-800 text-white px-2">Guardar</button>
                        </div>
                      ) : (
                        <span className={p.activo ? 'text-white' : 'text-gray-600 line-through'}>{p.patron} ({p.descripcion})</span>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => { setEditPatronId(p.id); setEditPatronData({ patron: p.patron, descripcion: p.descripcion }); }} className="text-gray-500 hover:text-green-400"><Edit size={16}/></button>
                        <button onClick={() => handleDeletePatron(p.id)} className="text-red-500 hover:text-red-300"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}

          {activeTab === 'roi' && (
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                  <DollarSign className="text-green-400" size={20} />
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider">ROI & Productividad</h2>
                </div>
                
                <div className="bg-gray-900 p-6 border border-green-900 rounded-lg mb-8">
                    <h3 className="text-green-300 font-bold mb-4">Configuración de KPIs</h3>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 uppercase">Tiempo ahorro (min)</label>
                            <input className="w-full bg-black border border-green-700 p-2 text-sm" type="number" value={roi.configuracion.tiempo_ahorrado_minutos} onChange={(e) => setRoi({...roi, configuracion: {...roi.configuracion, tiempo_ahorrado_minutos: e.target.value}})} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 uppercase">Costo hora jur ($)</label>
                            <input className="w-full bg-black border border-green-700 p-2 text-sm" type="number" value={roi.configuracion.costo_hora_juridico} onChange={(e) => setRoi({...roi, configuracion: {...roi.configuracion, costo_hora_juridico: e.target.value}})} />
                        </div>
                        <button onClick={updateROI} className="mt-5 bg-green-800 text-white px-4 py-2 hover:bg-green-700">Guardar</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-900 p-6 border border-green-900">
                        <p className="text-xs text-gray-500 uppercase">Tutelas Procesadas</p>
                        <p className="text-2xl font-bold">{parseInt(roi.totalTutelas).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 p-6 border border-green-900">
                        <p className="text-xs text-gray-500 uppercase">Horas Ahorradas</p>
                        <p className="text-2xl font-bold">{Math.round(roi.horasAhorradas).toLocaleString()} h</p>
                    </div>
                    <div className="bg-gray-900 p-6 border border-green-900">
                        <p className="text-xs text-gray-500 uppercase">Impacto Económico</p>
                        <p className="text-2xl font-bold">${Math.round(roi.dineroAhorrado).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-gray-950 p-6 border border-green-900 rounded-lg mb-8">
                    <h3 className="text-green-300 font-bold mb-6">Carga de Trabajo por Abogado</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={cargaTrabajo}>
                            <XAxis dataKey="nombre" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #166534'}} />
                            <Bar dataKey="total_activas" fill="#16a34a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-gray-950 p-6 border border-green-900 rounded-lg">
                    <h3 className="text-green-300 font-bold mb-6">Latencia Operativa (Horas promedio para tomar caso)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={latencia}>
                            <XAxis dataKey="mes" stroke="#fff" />
                            <YAxis stroke="#fff" />
                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #166534'}} />
                            <Line type="monotone" dataKey="horas" stroke="#16a34a" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6 border-b border-green-800 pb-4">
                  <Terminal className="text-green-400" size={20} />
                  <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider">/var/log/audit.log</h1>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-green-900 mb-6 flex gap-4 items-center">
                    <Search className="text-green-700" size={16} />
                    <input 
                      type="text" 
                      placeholder="grep query..."
                      className="bg-transparent border-none outline-none text-green-400 placeholder-green-900 w-full"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto text-[10px] md:text-xs">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-green-900 text-green-700 uppercase">
                          <th className="px-4 py-2">Timestamp</th>
                          <th className="px-4 py-2">User</th>
                          <th className="px-4 py-2">Action</th>
                          <th className="px-4 py-2">Entity</th>
                          <th className="px-4 py-2">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-900">
                        {logs.filter(log => 
                          log.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.accion.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(log => (
                          <tr key={log.id} className="hover:bg-green-950">
                            <td className="px-4 py-3 text-green-400">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3">{log.usuario_nombre}</td>
                            <td className="px-4 py-3 font-bold text-white">{log.accion}</td>
                            <td className="px-4 py-3">
                                {log.entidad_afectada}
                                {log.radicado ? ` (${log.radicado})` : ` [ID: ${log.entidad_id}]`}
                            </td>
                            <td className="px-4 py-3 text-green-800">{log.ip_origen}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            </div>
          )}
        </div>
      </div>
      {selectedUser && (
        <PermissionModal 
          user={selectedUser} 
          permissions={userPermissions} 
          onClose={() => setSelectedUser(null)}
          onAsignar={asignarPermiso}
          onRevocar={revocarPermiso}
          presets={PERMISSION_PRESETS}
        />
      )}
    </div>
  );
}
