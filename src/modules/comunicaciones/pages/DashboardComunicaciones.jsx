import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Search, X } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

export default function DashboardComunicaciones() {
    const [stats, setStats] = useState({ 
        kpis: { total: 0, pendientes: 0, respondidas: 0, vencidas: 0, entidad_mas_activa: null },
        volumenPorEntidad: [],
        tendencia: []
    });

    const [entidades, setEntidades] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [filters, setFilters] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        entidad_id: '',
        grupo_id: '',
        responsable_id: ''
    });

    useEffect(() => {
        fetchMetadata();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [filters]);

    const fetchMetadata = async () => {
        try {
            const [entidadesRes, gruposRes] = await Promise.all([
                apiService.get('/comunicaciones/entidades'),
                apiService.get('/comunicaciones/grupos')
            ]);
            setEntidades(entidadesRes.data);
            setGrupos(gruposRes.data);
        } catch (error) { toast.error('Error al cargar filtros'); }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))).toString();
            const { data } = await apiService.get(`/comunicaciones/stats?${params}`);
            setStats(data);
        } catch (error) { toast.error('Error al cargar estadísticas'); }
    };

    const sonarData = [{ name: 'Activas', value: stats.kpis?.total > 0 ? (stats.kpis.respondidas / stats.kpis.total) * 100 : 0 }];

    return (
        <div className="space-y-6 font-mono text-[#1a1a1a]">
            {/* Barra de Filtros */}
            <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex flex-wrap gap-4 items-center">
                <input type="date" className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" onChange={e => setFilters({...filters, fecha_inicio: e.target.value})} />
                <input type="date" className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" onChange={e => setFilters({...filters, fecha_fin: e.target.value})} />
                
                <SearchableSelect
                    options={entidades.map(e => ({ value: e.id, label: e.nombre }))}
                    value={filters.entidad_id}
                    onChange={v => setFilters({...filters, entidad_id: v})}
                    placeholder="Todas las entidades"
                    className="min-w-[160px]"
                />
                <SearchableSelect
                    options={grupos.map(g => ({ value: g.id, label: g.nombre }))}
                    value={filters.grupo_id}
                    onChange={v => setFilters({...filters, grupo_id: v})}
                    placeholder="Todos los grupos"
                    className="min-w-[140px]"
                />
                
                <button onClick={() => setFilters({fecha_inicio: '', fecha_fin: '', entidad_id: '', grupo_id: '', responsable_id: ''})} className="bg-[#2d4a3e] text-[#e0dcc8] px-3 py-1 text-xs font-bold uppercase">Limpiar</button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {/* Sonar */}
                <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={80}>
                        <RadialBarChart innerRadius="60%" outerRadius="100%" barSize={8} data={sonarData} startAngle={90} endAngle={-270}>
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background dataKey="value" fill="#2d4a3e" />
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-black fill-[#2d4a3e]">
                                {Math.round(sonarData[0].value)}%
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                
                {/* KPIs */}
                {[
                    { label: 'Total Activas', value: stats.kpis?.total || 0 },
                    { label: 'Pendientes', value: stats.kpis?.pendientes || 0 },
                    { label: 'Respondidas', value: stats.kpis?.respondidas || 0 },
                    { label: 'Vencidas', value: stats.kpis?.vencidas || 0 },
                    { label: 'Entidad Activa', value: filters.entidad_id ? (stats.kpis?.entidad_mas_activa || 'N/A') : 'TODAS LAS ENTIDADES' }
                ].map(item => (
                    <div key={item.label} className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                        <h3 className="text-[10px] uppercase tracking-wider font-bold mb-2 text-[#2d4a3e]">{item.label}</h3>
                        <p className="text-3xl font-bold">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Volumen por Entidad */}
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

                {/* Tendencia Temporal */}
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
