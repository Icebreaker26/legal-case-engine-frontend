import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import conformidadesService from '../../../services/conformidadesService';
import toast from 'react-hot-toast';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect from '../components/SearchableSelect';
import { calcularTiempoTranscurrido } from '../../../utils/dateUtils';

export default function ListaConformidades() {
    const [conformidades, setConformidades] = useState([]);
    const [estados, setEstados] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroGrupo, setFiltroGrupo] = useState('');
    const [filtroEntidad, setFiltroEntidad] = useState('');
    const [ordenFecha, setOrdenFecha] = useState('desc');

    useEffect(() => {
        fetchConformidades();
        fetchEstados();
        fetchGrupos();
        fetchEntidades();
    }, []);

    const fetchConformidades = async () => {
        try {
            const { data } = await conformidadesService.getAll();
            setConformidades(data);
        } catch (error) { toast.error('Error al cargar conformidades'); }
    };

    const fetchEstados = async () => {
        try {
            const { data } = await conformidadesService.getEstados();
            setEstados(data);
        } catch (error) { toast.error('Error al cargar estados'); }
    };

    const fetchGrupos = async () => {
        try {
            const { data } = await conformidadesService.getGrupos();
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const fetchEntidades = async () => {
        try {
            const { data } = await conformidadesService.getEntidades();
            setEntidades(data);
        } catch (error) { toast.error('Error al cargar entidades'); }
    };

    const filteredConformidades = useMemo(() => {
        return conformidades.filter(c => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                c.concepto.toLowerCase().includes(searchLower) ||
                (c.entidad_nombre && c.entidad_nombre.toLowerCase().includes(searchLower)) ||
                (c.valor && c.valor.toString().includes(searchLower));
            
            const matchesEstado = filtroEstado === '' || c.estado === filtroEstado;
            const matchesGrupo = filtroGrupo === '' || (c.grupos && c.grupos.includes(filtroGrupo));
            const matchesEntidad = filtroEntidad === '' || c.entidad_id === parseInt(filtroEntidad);
            return matchesSearch && matchesEstado && matchesGrupo && matchesEntidad;
        }).sort((a, b) => {
            const dateA = new Date(a.fecha_solicitud);
            const dateB = new Date(b.fecha_solicitud);
            return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [conformidades, searchTerm, filtroEstado, filtroGrupo, filtroEntidad, ordenFecha]);

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'SOLICITADO': return 'border-[#f59e0b] shadow-[4px_4px_0px_0px_#f59e0b]';
            case 'CONFORMADO': return 'border-[#10b981] shadow-[4px_4px_0px_0px_#10b981]';
            default: return 'border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex flex-wrap gap-4 items-center">
                <Search className="text-[#2d4a3e]" size={20} />
                <input 
                    type="text" placeholder="Buscar concepto..."
                    className="bg-transparent border-b border-[#2d4a3e] outline-none text-[#1a1a1a] flex-1 text-xs uppercase placeholder-[#2d4a3e]/50"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <SearchableSelect
                    options={estados}
                    value={filtroEstado}
                    onChange={setFiltroEstado}
                    placeholder="Todos los estados"
                    valueField="nombre"
                    labelField="nombre"
                    className="min-w-[150px]"
                />
                <SearchableSelect
                    options={grupos}
                    value={filtroGrupo}
                    onChange={setFiltroGrupo}
                    placeholder="Todos los grupos"
                    valueField="nombre"
                    labelField="nombre"
                    className="min-w-[140px]"
                />
                <SearchableSelect
                    options={entidades}
                    value={filtroEntidad}
                    onChange={setFiltroEntidad}
                    placeholder="Todas las entidades"
                    valueField="id"
                    labelField="nombre"
                    className="min-w-[160px]"
                />

                <button onClick={() => setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc')} className="text-[#2d4a3e] flex items-center gap-1 text-xs font-bold uppercase hover:underline">
                    {ordenFecha === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>} Fecha
                </button>
            </div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                <AnimatePresence>
                {filteredConformidades.map(c => (
                    <motion.div 
                        key={c.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={"relative bg-[#e0dcc8] p-4 border " + getEstadoColor(c.estado)}
                    >
                        <h3 className="font-bold uppercase tracking-wider text-[#2d4a3e] text-sm mb-1">{c.concepto}</h3>
                        <p className="text-xs uppercase mb-1"><strong>Entidad:</strong> {c.entidad_nombre} | <strong>Valor:</strong> ${parseFloat(c.valor).toLocaleString('es-CO')}</p>
                        <p className="text-xs italic mb-1">Solicitado: {new Date(c.fecha_solicitud).toLocaleDateString()}</p>
                        <p className="text-xs font-bold mb-1 text-[#2d4a3e]">
                            {calcularTiempoTranscurrido(c.fecha_solicitud, c.estado)}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                            {c.grupos && c.grupos.filter(g => g).map(g => (
                                <span key={g} className="bg-[#2d4a3e] text-[#e0dcc8] text-[10px] px-1.5 py-0.5 rounded font-bold">{g}</span>
                            ))}
                        </div>
                        <p className="text-xs font-bold uppercase mt-2 mb-2">Estado: {c.estado}</p>
                        <div className="mt-2">
                            <Link to={`/conformidades/${c.id}`} className="text-[#2d4a3e] font-bold text-xs uppercase hover:underline border-b border-[#2d4a3e]">Ver detalle</Link>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
