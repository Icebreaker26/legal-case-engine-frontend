import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Search, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect from '../components/SearchableSelect';

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
            const { data } = await apiService.get('/core/grupos');
            setGrupos(data);
        } catch (error) { toast.error('Error al cargar grupos'); }
    };

    const filteredPagos = useMemo(() => {
        return pagos.filter(pago => {
            const matchesSearch = pago.concepto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (pago.nit && pago.nit.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (pago.acreedor_nombre && pago.acreedor_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (pago.codigo_sig && pago.codigo_sig.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (pago.pdp_sap_id && pago.pdp_sap_id.toLowerCase().includes(searchTerm.toLowerCase()));
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
                    type="text" placeholder="Buscar concepto, NIT, Código SIG o SAP ID..."
                    className="bg-transparent border-b border-[#2d4a3e] outline-none text-[#1a1a1a] flex-1 text-xs uppercase placeholder-[#2d4a3e]/50"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <SearchableSelect
                    options={estados.map(e => ({ value: e.nombre, label: e.nombre }))}
                    value={filtroEstado}
                    onChange={setFiltroEstado}
                    placeholder="Todos los estados"
                    className="min-w-[150px]"
                />
                <SearchableSelect
                    options={grupos.map(g => ({ value: g.nombre, label: g.nombre }))}
                    value={filtroGrupo}
                    onChange={setFiltroGrupo}
                    placeholder="Todos los grupos"
                    className="min-w-[140px]"
                />

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
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold uppercase tracking-wider text-[#2d4a3e] text-sm mb-1">{pago.concepto}</h3>
                            {pago.tipo_pago === 'PREDIAL' && <span className="bg-orange-700 text-white text-[8px] px-1 font-black">PREDIAL</span>}
                        </div>
                        
                        <p className="text-xs uppercase mb-1"><strong>ACREEDOR:</strong> {pago.acreedor_nombre || 'N/A'}</p>
                        <p className="text-xs uppercase mb-1"><strong>NIT:</strong> {pago.nit || 'N/A'} </p>
                        
                        {pago.codigo_sig && (
                            <p className="text-xs uppercase mb-1 text-orange-800"><strong>SIG:</strong> {pago.codigo_sig}</p>
                        )}
                        
                        {pago.pdp_sap_id && (
                            <p className="text-xs uppercase mb-1 text-blue-800"><strong>SAP ID:</strong> {pago.pdp_sap_id}</p>
                        )}

                        <div className="mb-2">
                            <p className="text-xl font-black text-[#2d4a3e] tracking-tighter">
                                ${parseFloat(pago.monto).toLocaleString('es-CO')}
                            </p>
                        </div>

                        <p className="text-xs italic mb-1">Solicitado: {new Date(pago.fecha_solicitud).toLocaleDateString()}</p>
                        {(() => {
                            const isFinalizado = pago.estado === 'pagado' || pago.estado === 'completado';
                            const diffTime = isFinalizado 
                                ? (new Date(pago.fecha_finalizacion || new Date()) - new Date(pago.fecha_solicitud))
                                : (new Date() - new Date(pago.fecha_solicitud));
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            return (
                                <p className={`text-xs font-bold mb-1 ${isFinalizado ? 'text-green-800' : 'text-[#2d4a3e]'}`}>
                                    {isFinalizado ? `Finalizado en ${diffDays} día${diffDays !== 1 ? 's' : ''}` : `${diffDays} día${diffDays !== 1 ? 's' : ''} desde solicitud`}
                                </p>
                            );
                        })()}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {pago.grupos && pago.grupos.filter(g => g).map(g => (
                                <span key={g} className="bg-[#2d4a3e] text-[#e0dcc8] text-[10px] px-1.5 py-0.5 rounded font-bold">{g}</span>
                            ))}
                        </div>
                        <p className="text-xs font-bold uppercase mt-2 mb-2">Estado: {pago.estado}</p>
                        <div className="mt-2">
                            <Link to={`/pagos/${pago.id}`} className="text-[#2d4a3e] font-bold text-xs uppercase hover:underline border-b border-[#2d4a3e]">Ver detalle</Link>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
