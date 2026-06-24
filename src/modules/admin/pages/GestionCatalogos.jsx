import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, RefreshCw, Check, X, ChevronDown, LayoutDashboard, LogOut, Search, Database, MapPin } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';

const TIPOS = {
  entidades:  { label: 'Entidades',      descripcion: 'Entidades externas que remiten tutelas u oficios',    campos: [{ key: 'nombre', label: 'Nombre', required: true }] },
  grupos:     { label: 'Grupos',         descripcion: 'Grupos o equipos de trabajo internos',                campos: [{ key: 'nombre', label: 'Nombre', required: true }] },
  proyectos:  { label: 'Proyectos',      descripcion: 'Proyectos asociados a conformidades y pagos',         campos: [{ key: 'nombre', label: 'Nombre', required: true }] },
  contratos:  { label: 'Contratos',      descripcion: 'Contratos de referencia para conformidades',          campos: [{ key: 'numero', label: 'Número de contrato', required: true }] },
  categorias: { label: 'Categorías',     descripcion: 'Categorías de la base de conocimiento RAG',          campos: [{ key: 'nombre', label: 'Nombre', required: true }, { key: 'palabras_clave', label: 'Palabras clave (separadas por coma)', required: false }] },
  documentos: { label: 'Tipos de Doc.', descripcion: 'Tipos de documento para radicados',                   campos: [{ key: 'nombre', label: 'Nombre', required: true }] },
  acreedores: { label: 'Acreedores',    descripcion: 'Acreedores para pagos judiciales',                   campos: [{ key: 'nombre', label: 'Nombre', required: true }, { key: 'nit', label: 'NIT', required: true }, { key: 'banco', label: 'Banco', required: false }, { key: 'cuenta', label: 'Cuenta bancaria', required: false }] },
};

const campoVacio = (campos) => campos.reduce((acc, c) => ({ ...acc, [c.key]: '' }), {});
const labelItem   = (item) => item.numero || item.nombre || `#${item.id}`;
const subLabelItem = (item) => [item.nit && `NIT: ${item.nit}`, item.banco, item.palabras_clave].filter(Boolean).join(' · ');

export default function GestionCatalogos() {
  const { hasPermission, logout } = useAuth();
  const location = useLocation();

  const puedeEscribir = hasPermission('supervisor', 'WRITE') || hasPermission('admin', 'WRITE');
  const puedeBorrar   = hasPermission('supervisor', 'DELETE') || hasPermission('admin', 'DELETE');

  const [tipoActivo, setTipoActivo]           = useState('entidades');
  const [items, setItems]                     = useState([]);
  const [inactivos, setInactivos]             = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [nuevoForm, setNuevoForm]             = useState(campoVacio(TIPOS.entidades.campos));
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [editando, setEditando]               = useState(null);
  const [busqueda, setBusqueda]               = useState('');

  const config = TIPOS[tipoActivo];

  useEffect(() => {
    setNuevoForm(campoVacio(config.campos));
    setMostrarFormNuevo(false);
    setEditando(null);
    setBusqueda('');
    fetchDatos();
  }, [tipoActivo]);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [activos, arch] = await Promise.all([
        apiService.get(`/core/${tipoActivo}`),
        apiService.get(`/core/${tipoActivo}/inactivas`),
      ]);
      setItems(activos.data);
      setInactivos(arch.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return items;
    const q = busqueda.toLowerCase();
    return items.filter((item) =>
      [item.nombre, item.numero, item.nit, item.banco, item.palabras_clave]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [items, busqueda]);

  const handleCrear = async () => {
    const requeridos = config.campos.filter((c) => c.required);
    if (requeridos.some((c) => !nuevoForm[c.key]?.trim())) {
      toast.error(`Completa: ${requeridos.map((c) => c.label).join(', ')}`);
      return;
    }
    try {
      await apiService.post(`/core/${tipoActivo}`, nuevoForm);
      toast.success('Creado');
      setNuevoForm(campoVacio(config.campos));
      setMostrarFormNuevo(false);
      fetchDatos();
    } catch { toast.error('Error al crear'); }
  };

  const handleGuardarEdicion = async () => {
    if (!editando) return;
    const { id, ...datos } = editando;
    try {
      await apiService.patch(`/core/${tipoActivo}/${id}`, datos);
      toast.success('Actualizado');
      setEditando(null);
      fetchDatos();
    } catch { toast.error('Error al actualizar'); }
  };

  const handleArchivar = async (id) => {
    if (!confirm('¿Archivar este registro?')) return;
    try {
      await apiService.delete(`/core/${tipoActivo}/${id}`);
      toast.success('Archivado');
      fetchDatos();
    } catch { toast.error('Error al archivar'); }
  };

  const handleRecuperar = async (id) => {
    try {
      await apiService.patch(`/core/${tipoActivo}/${id}/recuperar`);
      toast.success('Recuperado');
      fetchDatos();
    } catch { toast.error('Error al recuperar'); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-mono">
      <ConstellationBackground baseOpacity={0.15} />

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-sm">
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

        {/* Fila inferior: tabs de sección */}
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

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">

        {/* Título */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-white">Gestión de Catálogos</h1>
          <p className="text-slate-500 text-xs mt-2 tracking-wide">{config.descripcion}</p>
        </div>

        {/* Selector de tipo */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(TIPOS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setTipoActivo(key)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] border transition-all duration-150 ${
                tipoActivo === key
                  ? 'bg-orange-500 border-orange-500 text-white shadow-[2px_2px_0px_0px_rgba(249,115,22,0.4)]'
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-orange-500 hover:text-orange-400'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-slate-900/40 border border-slate-800 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.15)]">

          {/* Panel header: búsqueda + nuevo */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
            {/* Búsqueda */}
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-orange-500 px-3 py-2 transition-colors">
              <Search size={13} className="text-slate-500 shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                placeholder={`Buscar en ${config.label.toLowerCase()}...`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-slate-600 hover:text-slate-400 transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-600 shrink-0">
              {itemsFiltrados.length} / {items.length}
            </span>

            <button onClick={fetchDatos} className="text-slate-500 hover:text-white p-1.5 transition-colors shrink-0" title="Actualizar">
              <RefreshCw size={14} />
            </button>

            {puedeEscribir && (
              <button
                onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-bold uppercase tracking-[0.15em] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] shrink-0"
              >
                <Plus size={13} /> Nuevo
              </button>
            )}
          </div>

          {/* Formulario nuevo */}
          {mostrarFormNuevo && puedeEscribir && (
            <div className="px-5 py-4 border-b border-orange-900/40 bg-orange-950/20">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-3">{'>'} Nuevo registro</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {config.campos.map((campo) => (
                  <div key={campo.key}>
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 block">
                      {campo.label} {campo.required && <span className="text-orange-500">*</span>}
                    </label>
                    <input
                      className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 text-white text-sm px-3 py-2 outline-none placeholder-slate-600 transition-colors"
                      placeholder={campo.label}
                      value={nuevoForm[campo.key] || ''}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, [campo.key]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && config.campos.length === 1 && handleCrear()}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleCrear} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
                  <Check size={13} /> Guardar
                </button>
                <button
                  onClick={() => { setMostrarFormNuevo(false); setNuevoForm(campoVacio(config.campos)); }}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-700 text-slate-400 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
                >
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista */}
          <div className="divide-y divide-slate-800/60">
            {loading ? (
              <div className="px-6 py-10 text-center text-slate-600 text-xs uppercase tracking-widest">Cargando...</div>
            ) : itemsFiltrados.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-600 text-xs uppercase tracking-widest">
                {busqueda ? 'Sin resultados' : 'Sin registros activos'}
              </div>
            ) : (
              itemsFiltrados.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors group">
                  {editando?.id === item.id ? (
                    <>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {config.campos.map((campo) => (
                          <input
                            key={campo.key}
                            className="bg-slate-900 border border-orange-700 text-white text-sm px-3 py-1.5 outline-none w-full"
                            value={editando[campo.key] || ''}
                            onChange={(e) => setEditando({ ...editando, [campo.key]: e.target.value })}
                            placeholder={campo.label}
                          />
                        ))}
                      </div>
                      <button onClick={handleGuardarEdicion} className="text-green-500 hover:text-green-400 p-1.5 transition-colors"><Check size={15} /></button>
                      <button onClick={() => setEditando(null)} className="text-slate-500 hover:text-white p-1.5 transition-colors"><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 truncate">{labelItem(item)}</p>
                        {subLabelItem(item) && <p className="text-[10px] text-slate-600 truncate mt-0.5">{subLabelItem(item)}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {puedeEscribir && (
                          <button onClick={() => setEditando({ id: item.id, ...campoVacio(config.campos), ...item })} className="text-slate-500 hover:text-orange-400 p-1.5 transition-colors" title="Editar">
                            <Pencil size={14} />
                          </button>
                        )}
                        {puedeBorrar && (
                          <button onClick={() => handleArchivar(item.id)} className="text-slate-500 hover:text-red-500 p-1.5 transition-colors" title="Archivar">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Archivados */}
          {inactivos.length > 0 && (
            <div className="border-t border-slate-800/60">
              <button
                onClick={() => setMostrarInactivos(!mostrarInactivos)}
                className="w-full flex items-center gap-2 px-5 py-3 text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
              >
                <ChevronDown size={13} className={`transition-transform ${mostrarInactivos ? 'rotate-180' : ''}`} />
                {inactivos.length} archivado{inactivos.length !== 1 ? 's' : ''}
              </button>
              {mostrarInactivos && (
                <div className="divide-y divide-slate-800/40 bg-slate-950/40">
                  {inactivos.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3 group opacity-50 hover:opacity-80 transition-opacity">
                      <p className="flex-1 text-sm text-slate-500 line-through truncate">{labelItem(item)}</p>
                      {puedeEscribir && (
                        <button onClick={() => handleRecuperar(item.id)} className="text-slate-600 hover:text-green-500 p-1.5 transition-colors opacity-0 group-hover:opacity-100" title="Recuperar">
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
