import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Search, ArrowUp, ArrowDown, X, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListaComunicaciones() {
    const [comunicaciones, setComunicaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('activas');
    const [filtroEntidad, setFiltroEntidad] = useState('');
    const [filtroUrgencia, setFiltroUrgencia] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroGrupo, setFiltroGrupo] = useState(''); 
    const [filtrosResponsables, setFiltrosResponsables] = useState([]);
    const [searchResponsable, setSearchResponsable] = useState('');
    const [mostrarBusquedaResponsable, setMostrarBusquedaResponsable] = useState(false);
    const [ordenFecha, setOrdenFecha] = useState('asc');
    const [abogados, setAbogados] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [grupos, setGrupos] = useState([]); 
    const [nuevaGrupo, setNuevaGrupo] = useState(''); 
    const [mostrarNuevoGrupo, setMostrarNuevoGrupo] = useState(false);

    useEffect(() => {
        fetchComunicaciones();
        fetchAbogados();
        fetchEntidades();
        fetchGrupos();
    }, []);

    const fetchComunicaciones = async () => {
        try {
            const { data } = await apiService.get('/comunicaciones');
            setComunicaciones(data);
        } catch (error) { toast.error('Error al cargar comunicaciones'); }
    };

    const fetchAbogados = async () => {
        try {
            const { data } = await apiService.get('/admin/usuarios');
            setAbogados(data);
        } catch (error) { toast.error('Error al cargar abogados'); }
    };

    const fetchEntidades = async () => {
        try {
            const { data } = await apiService.get('/comunicaciones/entidades');
            setEntidades(data);
        } catch (error) { toast.error('Error al cargar entidades'); }
    };

    const fetchGrupos = async () => {
        try {
            const { data } = await apiService.get('/comunicaciones/grupos');
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const handleCrearGrupo = async () => {
        if (!nuevaGrupo.trim()) return;
        try {
            const { data } = await apiService.post('/comunicaciones/grupos', { nombre: nuevaGrupo });
            setGrupos([...grupos, data]);
            setNuevaGrupo('');
            setMostrarNuevoGrupo(false);
            toast.success('Grupo creado');
        } catch (error) { toast.error('Error al crear grupo'); }
    };

    const getEstadoUrgencia = (fechaLimite, estado) => {
        if (estado === 'respondida' || estado === 'archivada') return { label: 'FINALIZADA', style: 'border-green-800 text-green-800' };
        const diffDays = (new Date(fechaLimite) - new Date()) / (1000 * 60 * 60 * 24);
        if (diffDays < 2) return { label: 'URGENTE', style: 'border-red-900 text-red-900' };
        if (diffDays < 5) return { label: 'ALERTA', style: 'border-orange-700 text-orange-700' };
        return null;
    };

    const filteredComunicaciones = useMemo(() => {
        return comunicaciones.filter(com => {
            const urgencia = getEstadoUrgencia(com.fecha_limite, com.estado);
            const entidadNombre = com.entidad || '';
            const matchesSearch = com.asunto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  entidadNombre.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesEstado = false;
            if (filtroEstado === 'activas') matchesEstado = com.is_active && com.estado !== 'respondida';
            else if (filtroEstado === 'respondidas') matchesEstado = com.estado === 'respondida';
            else if (filtroEstado === 'archivadas') matchesEstado = !com.is_active && com.estado !== 'respondida';
            
            const matchesEntidad = filtroEntidad === '' || entidadNombre === filtroEntidad;
            const matchesUrgencia = filtroUrgencia === '' || (urgencia?.label || 'NORMAL') === filtroUrgencia;
            const matchesTipo = filtroTipo === '' || com.tipo === filtroTipo;
            const matchesResponsable = filtrosResponsables.length === 0 || filtrosResponsables.includes(String(com.responsable_id));
            const matchesGrupo = filtroGrupo === '' || (com.grupos && com.grupos.includes(filtroGrupo)); 
            return matchesSearch && matchesEstado && matchesEntidad && matchesUrgencia && matchesTipo && matchesResponsable && matchesGrupo;
        }).sort((a, b) => {
            const dateA = new Date(a.fecha_limite);
            const dateB = new Date(b.fecha_limite);
            return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [comunicaciones, searchTerm, filtroEstado, filtroEntidad, filtroUrgencia, filtroTipo, filtrosResponsables, filtroGrupo, ordenFecha]);

    const toggleResponsable = (id) => {
        const strId = String(id);
        setFiltrosResponsables(prev => 
            prev.includes(strId) ? prev.filter(i => i !== strId) : [...prev, strId]
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex flex-wrap gap-4 items-center">
                <Search className="text-[#2d4a3e]" size={20} />
                <input 
                    type="text" placeholder="Buscar asunto o entidad..."
                    className="bg-transparent border-b border-[#2d4a3e] outline-none text-[#1a1a1a] flex-1 text-xs uppercase placeholder-[#2d4a3e]/50"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroEstado(e.target.value)} value={filtroEstado}>
                    <option value="activas">Activas</option>
                    <option value="respondidas">Respondidas</option>
                    <option value="archivadas">Archivadas</option>
                </select>
                
                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroEntidad(e.target.value)} value={filtroEntidad}>
                    <option value="">Todas las entidades</option>
                    {entidades.map(ent => <option key={ent.id} value={ent.nombre}>{ent.nombre}</option>)}
                </select>
                
                <div className="flex gap-2">
                    <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroGrupo(e.target.value)} value={filtroGrupo}>
                        <option value="">Todos los grupos</option>
                        {grupos.map(g => <option key={g.id} value={g.nombre}>{g.nombre}</option>)}
                    </select>
                    <button type="button" onClick={() => setMostrarNuevoGrupo(!mostrarNuevoGrupo)} className="text-[#2d4a3e]">
                         {mostrarNuevoGrupo ? <X size={16} /> : <Plus size={16} />}
                    </button>
                </div>
                {mostrarNuevoGrupo && (
                    <div className="flex gap-1 items-center bg-[#d6d2bd] p-1">
                        <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-[10px] placeholder-[#2d4a3e]/50" placeholder="Nuevo grupo..." value={nuevaGrupo} onChange={e => setNuevaGrupo(e.target.value)} />
                        <button type="button" onClick={handleCrearGrupo} className="bg-[#2d4a3e] text-[#e0dcc8] px-2 text-[10px] font-bold">CREAR</button>
                    </div>
                )}

                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroUrgencia(e.target.value)} value={filtroUrgencia}>
                    <option value="">Cualquier Urgencia</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="ALERTA">Alerta</option>
                    <option value="NORMAL">Normal</option>
                </select>
                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroTipo(e.target.value)} value={filtroTipo}>
                    <option value="">Todos los tipos</option>
                    <option value="recibida">Recibida</option>
                    <option value="enviada">Enviada</option>
                </select>

                <div className="relative">
                    <button onClick={() => setMostrarBusquedaResponsable(!mostrarBusquedaResponsable)} className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase flex items-center gap-1">
                        Responsables ({filtrosResponsables.length}) {mostrarBusquedaResponsable ? <X size={12}/> : <Search size={12}/>}
                    </button>
                    {mostrarBusquedaResponsable && (
                        <div className="absolute z-10 w-48 bg-[#e0dcc8] border border-[#2d4a3e] max-h-60 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs placeholder-[#2d4a3e]/50" placeholder="Buscar..." value={searchResponsable} onChange={e => setSearchResponsable(e.target.value)} />
                            <div className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs font-bold" onClick={() => setFiltrosResponsables([])}>QUITAR TODOS</div>
                            {abogados.filter(a => a.nombre.toLowerCase().includes(searchResponsable.toLowerCase())).map(a => (
                                <div key={a.id} className={`p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs flex justify-between ${filtrosResponsables.includes(String(a.id)) ? 'bg-[#2d4a3e] text-[#e0dcc8]' : ''}`} onClick={() => toggleResponsable(a.id)}>
                                    {a.nombre} {filtrosResponsables.includes(String(a.id)) && <CheckCircle size={12}/>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc')} className="text-[#2d4a3e] flex items-center gap-1 text-xs font-bold uppercase hover:underline">
                    {ordenFecha === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>} Fecha
                </button>
            </div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                <AnimatePresence>
                {filteredComunicaciones.map(com => {
                    const urgencia = getEstadoUrgencia(com.fecha_limite, com.estado);
                    return (
                        <motion.div 
                            key={com.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="relative bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] overflow-hidden"
                        >
                            {urgencia && (
                                <motion.div 
                                    initial={{ opacity: 0, rotate: -20 }}
                                    animate={{ opacity: 1, rotate: -10 }}
                                    className={`absolute top-2 right-2 border-2 px-1 text-[10px] font-bold ${urgencia.style}`}>
                                    {urgencia.label}
                                </motion.div>
                            )}
                            <h3 className="font-bold uppercase tracking-wider pr-16 text-[#2d4a3e]">{com.asunto}</h3>
                            <p className="text-[10px] uppercase mb-2">Entidad: {com.entidad} | {com.tipo}</p>
                            <p className="text-[10px] italic">Límite: {new Date(com.fecha_limite).toLocaleDateString()}</p>
                            <p className="text-[10px] font-bold uppercase">Estado: {com.estado}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {com.grupos && com.grupos.filter(g => g).map((g, index) => (
                                    <span key={`${com.id}-${g}-${index}`} className="bg-[#2d4a3e] text-[#e0dcc8] text-[9px] px-1 uppercase font-bold tracking-tighter">{g}</span>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Link to={`/comunicaciones/${com.id}`} className="text-[#2d4a3e] font-bold text-xs uppercase hover:underline border-b border-[#2d4a3e]">Ver detalle</Link>
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
