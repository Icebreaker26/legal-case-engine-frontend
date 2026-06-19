import { useState, useEffect } from 'react';
import conformidadesService from '../../../services/conformidadesService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SearchableSelect from '../components/SearchableSelect';

export default function DashboardConformidades() {
    const [stats, setStats] = useState(null);
    const [entidades, setEntidades] = useState([]);
    const [selectedEntidad, setSelectedEntidad] = useState('');

    useEffect(() => {
        fetchStats();
        fetchEntidades();
    }, []);

    useEffect(() => {
        fetchStats(selectedEntidad);
    }, [selectedEntidad]);

    const fetchStats = async (entidadId) => {
        try {
            const { data } = await conformidadesService.getStats(entidadId);
            setStats(data);
        } catch (error) { toast.error('Error al cargar estadísticas'); }
    };

    const fetchEntidades = async () => {
        try {
            const { data } = await conformidadesService.getEntidades();
            setEntidades(data);
        } catch (error) { toast.error('Error al cargar entidades'); }
    };

    if (!stats) return <div className="text-[#e0dcc8]">Cargando...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-[#e0dcc8]">Dashboard de Conformidades</h2>
                
                <SearchableSelect
                    options={entidades}
                    value={selectedEntidad}
                    onChange={setSelectedEntidad}
                    placeholder="Todas las entidades"
                    valueField="id"
                    labelField="nombre"
                    className="min-w-[180px]"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Total Conformidades</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">{stats.kpis.total}</p>
                </div>
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Pendientes</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">{stats.kpis.pendientes}</p>
                </div>
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Monto Total</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">${parseFloat(stats.kpis.monto_total || 0).toLocaleString('es-CO')}</p>
                </div>
            </div>

            <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] h-80">
                <h3 className="text-sm font-bold uppercase text-[#2d4a3e] mb-4">Volumen por Estado</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.estados}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d4a3e" />
                        <XAxis dataKey="estado" stroke="#2d4a3e" fontSize={10} />
                        <YAxis stroke="#2d4a3e" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2d4a3e" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
