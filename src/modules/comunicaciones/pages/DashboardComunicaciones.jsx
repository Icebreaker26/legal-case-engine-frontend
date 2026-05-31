import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Search, X } from 'lucide-react';

export default function DashboardComunicaciones() {
    const [stats, setStats] = useState({ 
        kpis: { total: 0, pendientes: 0, respondidas: 0, vencidas: 0, entidad_mas_activa: null },
        volumenPorEntidad: [],
        tendencia: []
    });

    const [entidades, setEntidades] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [abogados, setAbogados] = useState([]);
    const [filters, setFilters] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        entidad_id: '',
        grupo_id: '',
        responsable_id: ''
    });

    const [searchResponsable, setSearchResponsable] = useState('');
    const [mostrarBusquedaResponsable, setMostrarBusquedaResponsable] = useState(false);

    useEffect(() => {
        fetchMetadata();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [filters]);

    const fetchMetadata = async () => {
        try {
            const [entidadesRes, gruposRes, abogadosRes] = await Promise.all([
                apiService.get('/comunicaciones/entidades'),
                apiService.get('/comunicaciones/grupos'),
                apiService.get('/admin/usuarios')
            ]);
            setEntidades(entidadesRes.data);
            setGrupos(gruposRes.data);
            setAbogados(abogadosRes.data);
        } catch (error) { toast.error('Error al cargar filtros'); }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))).toString();
            const { data } = await apiService.get(`/comunicaciones/stats?${params}`);
            setStats(data);
        } catch (error) { toast.error('Error al cargar estadísticas'); }
    };

    return (
        <div className="space-y-6 font-mono text-[#1a1a1a]">
            {/* Barra de Filtros */}
            <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex flex-wrap gap-4 items-center">
                <input type="date" className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" onChange={e => setFilters({...filters, fecha_inicio: e.target.value})} />
                <input type="date" className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" onChange={e => setFilters({...filters, fecha_fin: e.target.value})} />
                
                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={e => setFilters({...filters, entidad_id: e.target.value})} value={filters.entidad_id}>
                    <option value="">Todas las entidades</option>
                    {entidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>

                <select className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase" onChange={e => setFilters({...filters, grupo_id: e.target.value})} value={filters.grupo_id}>
                    <option value="">Todos los grupos</option>
                    {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>

                <div className="relative">
                    <button onClick={() => setMostrarBusquedaResponsable(!mostrarBusquedaResponsable)} className="bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] p-1 text-xs uppercase flex items-center gap-1">
                        {searchResponsable ? searchResponsable : "Responsable"} {mostrarBusquedaResponsable ? <X size={12}/> : <Search size={12}/>}
                    </button>
                    {mostrarBusquedaResponsable && (
                        <div className="absolute z-10 w-48 bg-[#e0dcc8] border border-[#2d4a3e] max-h-60 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar..." value={searchResponsable} onChange={e => setSearchResponsable(e.target.value)} />
                            <div className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs font-bold" onClick={() => { setFilters({...filters, responsable_id: ''}); setSearchResponsable(''); setMostrarBusquedaResponsable(false); }}>TODOS</div>
                            {abogados.filter(a => a.nombre.toLowerCase().includes(searchResponsable.toLowerCase())).map(a => (
                                <div key={a.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs" onClick={() => { setFilters({...filters, responsable_id: a.id}); setSearchResponsable(a.nombre); setMostrarBusquedaResponsable(false); }}>
                                    {a.nombre}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <button onClick={() => setFilters({fecha_inicio: '', fecha_fin: '', entidad_id: '', grupo_id: '', responsable_id: ''})} className="bg-[#2d4a3e] text-[#e0dcc8] px-3 py-1 text-xs font-bold uppercase">Limpiar</button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Activas', value: stats.kpis?.total || 0 },
                    { label: 'Pendientes', value: stats.kpis?.pendientes || 0 },
                    { label: 'Respondidas', value: stats.kpis?.respondidas || 0 },
                    { label: 'Vencidas', value: stats.kpis?.vencidas || 0 },
                    { label: 'Entidad Activa', value: stats.kpis?.entidad_mas_activa || 'TODAS LAS ENTIDADES' }
                ].map(item => (
                    <div key={item.label} className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                        <h3 className="text-[10px] uppercase tracking-wider font-bold mb-2 text-[#2d4a3e]">{item.label}</h3>
                        <p className="text-3xl font-bold">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <h3 className="text-xs uppercase font-bold mb-4 text-[#2d4a3e]">Volumen por Entidad</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.volumenPorEntidad}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d4a3e" opacity={0.3} />
                                <XAxis dataKey="nombre" stroke="#2d4a3e" fontSize={10} />
                                <YAxis stroke="#2d4a3e" fontSize={10} />
                                <Tooltip contentStyle={{backgroundColor: '#e0dcc8', border: '1px solid #2d4a3e'}} />
                                <Bar dataKey="total" fill="#2d4a3e" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <h3 className="text-xs uppercase font-bold mb-4 text-[#2d4a3e]">Tendencia Temporal</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.tendencia}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d4a3e" opacity={0.3} />
                                <XAxis dataKey="mes" stroke="#2d4a3e" fontSize={10} />
                                <YAxis stroke="#2d4a3e" fontSize={10} />
                                <Tooltip contentStyle={{backgroundColor: '#e0dcc8', border: '1px solid #2d4a3e'}} />
                                <Legend />
                                <Line type="monotone" dataKey="recibidas" stroke="#2d4a3e" strokeWidth={2} />
                                <Line type="monotone" dataKey="enviadas" stroke="#b91c1c" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
