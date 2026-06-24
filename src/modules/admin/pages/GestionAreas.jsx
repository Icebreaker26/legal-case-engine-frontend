import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X, LayoutDashboard, LogOut, Users, Search, Database, MapPin } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';

export default function GestionAreas() {
  const { hasPermission, logout } = useAuth();
  const location = useLocation();

  const puedeEscribir = hasPermission('supervisor', 'WRITE') || hasPermission('admin', 'WRITE');
  const puedeBorrar   = hasPermission('supervisor', 'DELETE') || hasPermission('admin', 'DELETE');

  const [areas, setAreas]                     = useState([]);
  const [nuevoNombre, setNuevoNombre]         = useState('');
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [editando, setEditando]               = useState(null);
  const [busqueda, setBusqueda]               = useState('');

  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    try {
      const res = await apiService.get('/admin/areas');
      setAreas(res.data);
    } catch {
      toast.error('Error al cargar áreas');
    }
  };

  const areasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return areas;
    const q = busqueda.toLowerCase();
    return areas.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [areas, busqueda]);

  const handleCrear = async () => {
    if (!nuevoNombre.trim()) return toast.error('El nombre es obligatorio');
    try {
      await apiService.post('/admin/areas', { nombre: nuevoNombre.trim() });
      toast.success('Área creada');
      setNuevoNombre('');
      setMostrarFormNuevo(false);
      fetchAreas();
    } catch { toast.error('Error al crear área'); }
  };

  const handleGuardarEdicion = async () => {
    if (!editando?.nombre?.trim()) return;
    try {
      await apiService.patch(`/admin/areas/${editando.id}`, { nombre: editando.nombre });
      toast.success('Actualizado');
      setEditando(null);
      fetchAreas();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta área?')) return;
    try {
      await apiService.delete(`/admin/areas/${id}`);
      toast.success('Área eliminada');
      fetchAreas();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-mono">
      <ConstellationBackground baseOpacity={0.15} />

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-sm">
        {/* Fila superior */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800/40">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500">Módulo Supervisor</span>
          <div className="flex items-center gap-3">
            <Link to="/selector" className="text-slate-500 hover:text-white transition-colors" title="Volver al selector">
              <LayoutDashboard size={18} />
            </Link>
            <button onClick={logout} className="text-red-600 hover:text-red-400 transition-colors" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Fila inferior: tabs */}
        <div className="flex items-center px-8">
          <Link
            to="/catalogos"
            className={`flex items-center gap-2 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-colors ${
              location.pathname === '/catalogos'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Database size={13} /> Catálogos
          </Link>
          <Link
            to="/catalogos/areas"
            className={`flex items-center gap-2 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-colors ${
              location.pathname === '/catalogos/areas'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <MapPin size={13} /> Áreas y Equipos
          </Link>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-8 py-10">

        {/* Título */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-white">Áreas y Equipos</h1>
          <p className="text-slate-500 text-xs mt-2 tracking-wide">
            Gestiona las áreas o equipos de trabajo a los que se asignan usuarios del sistema
          </p>
        </div>

        {/* Stat + botón */}
        <div className="flex items-stretch gap-3 mb-8">
          <div className="border border-slate-800 px-5 py-4 bg-slate-900/40 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(249,115,22,0.15)]">
            <Users size={20} className="text-orange-500" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Total áreas</p>
              <p className="text-2xl font-bold text-white">{areas.length}</p>
            </div>
          </div>
          {puedeEscribir && (
            <button
              onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)}
              className="flex items-center gap-2 px-5 py-4 bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-bold uppercase tracking-[0.15em] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
            >
              <Plus size={14} /> Nueva área
            </button>
          )}
        </div>

        {/* Formulario nuevo */}
        {mostrarFormNuevo && puedeEscribir && (
          <div className="mb-6 px-5 py-4 border border-orange-900/40 bg-orange-950/20">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-3">{'>'} Nueva área</p>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-orange-500 text-white text-sm px-3 py-2 outline-none placeholder-slate-600 transition-colors"
                placeholder="Nombre del área"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
                autoFocus
              />
              <button onClick={handleCrear} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
                <Check size={13} /> Guardar
              </button>
              <button onClick={() => { setMostrarFormNuevo(false); setNuevoNombre(''); }} className="flex items-center gap-2 px-3 py-2 border border-slate-700 text-slate-400 hover:text-white text-[10px] uppercase tracking-widest transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Panel con búsqueda */}
        <div className="bg-slate-900/40 border border-slate-800 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.15)]">

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-orange-500 px-3 py-2 transition-colors">
              <Search size={13} className="text-slate-500 shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                placeholder="Buscar área..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-slate-600 hover:text-slate-400 transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-600 shrink-0">{areasFiltradas.length} / {areas.length}</span>
          </div>

          {/* Lista */}
          {areasFiltradas.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-600 text-xs uppercase tracking-widest">
              {busqueda ? 'Sin resultados' : 'Sin áreas registradas'}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {areasFiltradas.map((area, idx) => (
                <div key={area.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 transition-colors group">
                  {editando?.id === area.id ? (
                    <>
                      <span className="text-[10px] text-slate-700 w-6 text-right">{String(idx + 1).padStart(2, '0')}</span>
                      <input
                        className="flex-1 bg-slate-900 border border-orange-700 text-white text-sm px-3 py-1.5 outline-none"
                        value={editando.nombre}
                        onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuardarEdicion()}
                        autoFocus
                      />
                      <button onClick={handleGuardarEdicion} className="text-green-500 hover:text-green-400 p-1.5 transition-colors"><Check size={15} /></button>
                      <button onClick={() => setEditando(null)} className="text-slate-500 hover:text-white p-1.5 transition-colors"><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-700 w-6 text-right">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">{area.nombre}</p>
                        {area.total_miembros !== undefined && (
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {area.total_miembros} miembro{area.total_miembros !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {puedeEscribir && (
                          <button onClick={() => setEditando({ id: area.id, nombre: area.nombre })} className="text-slate-500 hover:text-orange-400 p-1.5 transition-colors" title="Editar">
                            <Pencil size={14} />
                          </button>
                        )}
                        {puedeBorrar && (
                          <button onClick={() => handleEliminar(area.id)} className="text-slate-500 hover:text-red-500 p-1.5 transition-colors" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-16 text-slate-800 text-[10px] uppercase tracking-[0.2em] text-center">
          ICEBREAKER © 2026 // SUPERVISOR MODULE
        </footer>
      </div>
    </div>
  );
}
