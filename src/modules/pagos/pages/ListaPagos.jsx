import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Search, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListaPagos() {
    const [pagos, setPagos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroGrupo, setFiltroGrupo] = useState('');
    const [ordenFecha, setOrdenFecha] = useState('desc');

    useEffect(() => {
        fetchPagos();
        fetchEstados();
        fetchGrupos();
    }, []);

    const fetchPagos = async () => {
        try {
            const { data } = await apiService.get('/pagos');
            setPagos(data);
        } catch (error) { toast.error('Error al cargar pagos'); }
    };

    const fetchEstados = async () => {
        try {
            const { data } = await apiService.get('/pagos/estados');
            setEstados(data);
        } catch (error) { toast.error('Error al cargar estados'); }
    };

    const fetchGrupos = async () => {
        try {
            const { data } = await apiService.get('/pagos/grupos');
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const filteredPagos = useMemo(() => {
        return pagos.filter(pago => {
            const matchesSearch = pago.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  pago.nit.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEstado = filtroEstado === '' || pago.estado === filtroEstado;
            const matchesGrupo = filtroGrupo === '' || (pago.grupos && pago.grupos.includes(filtroGrupo));
            return matchesSearch && matchesEstado && matchesGrupo;
        }).sort((a, b) => {
            const dateA = new Date(a.fecha_solicitud);
            const dateB = new Date(b.fecha_solicitud);
            return ordenFecha === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [pagos, searchTerm, filtroEstado, filtroGrupo, ordenFecha]);

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'solicitado': return 'border-[#f59e0b] shadow-[4px_4px_0px_0px_#f59e0b]';
            case 'subido_sap_espera_liberacion': return 'border-[#3b82f6] shadow-[4px_4px_0px_0px_#3b82f6]';
            case 'liberado': return 'border-[#06b6d4] shadow-[4px_4px_0px_0px_#06b6d4]';
            case 'espera_firmas': return 'border-[#8b5cf6] shadow-[4px_4px_0px_0px_#8b5cf6]';
            case 'firmado': return 'border-[#6366f1] shadow-[4px_4px_0px_0px_#6366f1]';
            case 'radicado': return 'border-[#ec4899] shadow-[4px_4px_0px_0px_#ec4899]';
            case 'completado': return 'border-[#10b981] shadow-[4px_4px_0px_0px_#10b981]';
            case 'pagado': return 'border-[#059669] shadow-[4px_4px_0px_0px_#059669]';
            case 'rechazado': return 'border-[#ef4444] shadow-[4px_4px_0px_0px_#ef4444]';
            default: return 'border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]';
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex flex-wrap gap-4 items-center">
                <Search className="text-[#2d4a3e]" size={20} />
                <input 
                    type="text" placeholder="Buscar concepto o NIT..."
                    className="bg-transparent border-b border-[#2d4a3e] outline-none text-[#1a1a1a] flex-1 text-xs uppercase placeholder-[#2d4a3e]/50"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroEstado(e.target.value)} value={filtroEstado}>
                    <option value="">Todos los estados</option>
                    {estados.map(estado => <option key={estado.id} value={estado.nombre}>{estado.nombre}</option>)}
                </select>

                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={(e) => setFiltroGrupo(e.target.value)} value={filtroGrupo}>
                    <option value="">Todos los grupos</option>
                    {grupos.map(grupo => <option key={grupo.id} value={grupo.nombre}>{grupo.nombre}</option>)}
                </select>

                <button onClick={() => setOrdenFecha(ordenFecha === 'asc' ? 'desc' : 'asc')} className="text-[#2d4a3e] flex items-center gap-1 text-xs font-bold uppercase hover:underline">
                    {ordenFecha === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>} Fecha
                </button>
            </div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
                <AnimatePresence>
                {filteredPagos.map(pago => (
                    <motion.div 
                        key={pago.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={"relative bg-[#e0dcc8] p-4 border " + getEstadoColor(pago.estado)}
                    >
                        <h3 className="font-bold uppercase tracking-wider text-[#2d4a3e]">{pago.concepto}</h3>
                        <p className="text-[10px] uppercase">NIT: {pago.nit} | Monto: ${parseFloat(pago.monto).toLocaleString('es-CO')}</p>
                        <p className="text-[10px] italic">Solicitado: {new Date(pago.fecha_solicitud).toLocaleDateString()}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {pago.grupos && pago.grupos.filter(g => g).map(g => (
                                <span key={g} className="bg-[#2d4a3e] text-[#e0dcc8] text-[9px] px-1 py-0.5 rounded">{g}</span>
                            ))}
                        </div>
                        <p className="text-[10px] font-bold uppercase mt-2">Estado: {pago.estado}</p>
                        <div className="mt-4">
                            <Link to={`/pagos/${pago.id}`} className="text-[#2d4a3e] font-bold text-xs uppercase hover:underline border-b border-[#2d4a3e]">Ver detalle</Link>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
