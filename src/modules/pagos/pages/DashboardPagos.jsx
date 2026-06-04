import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

export default function DashboardPagos() {
    const [stats, setStats] = useState(null);
    const [tendencia, setTendencia] = useState([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await apiService.get('/pagos/stats');
            setStats(data.kpis);
            setTendencia(data.tendencia);
        } catch (error) { toast.error('Error al cargar estadísticas'); }
    };

    if (!stats) return <div className="text-[#e0dcc8]">Cargando...</div>;

    const dataBar = [
        { name: 'Solicitados', value: parseInt(stats.solicitados) || 0, color: '#f59e0b' },
        { name: 'Liberados', value: parseInt(stats.liberados) || 0, color: '#3b82f6' },
        { name: 'Pagados', value: parseInt(stats.pagados) || 0, color: '#10b981' },
        { name: 'Rechazados', value: parseInt(stats.rechazados) || 0, color: '#ef4444' },
    ];

    const dataLine = Object.values(tendencia.reduce((acc, curr) => {
        if (!acc[curr.mes]) acc[curr.mes] = { mes: curr.mes };
        acc[curr.mes][curr.estado] = parseInt(curr.total);
        return acc;
    }, {}));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-[#e0dcc8] mb-6">Dashboard de Pagos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Total Pagos</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">{stats.total_pagos}</p>
                </div>
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Monto Total</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">${parseInt(stats.monto_total || 0).toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Liberados</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">{stats.liberados}</p>
                </div>
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                    <p className="text-[10px] uppercase text-[#2d4a3e]">Pagados</p>
                    <p className="text-3xl font-bold text-[#2d4a3e]">{stats.pagados}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] h-80">
                    <h3 className="text-sm font-bold uppercase text-[#2d4a3e] mb-4">Volumen por Estado</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataBar}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a3e" />
                            <XAxis dataKey="name" stroke="#2d4a3e" fontSize={10} />
                            <YAxis stroke="#2d4a3e" fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="value">
                                {dataBar.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] h-80">
                    <h3 className="text-sm font-bold uppercase text-[#2d4a3e] mb-4">Tendencia Temporal</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataLine}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a3e" />
                            <XAxis dataKey="mes" stroke="#2d4a3e" fontSize={10} />
                            <YAxis stroke="#2d4a3e" fontSize={10} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="solicitado" stroke="#f59e0b" />
                            <Line type="monotone" dataKey="liberado" stroke="#3b82f6" />
                            <Line type="monotone" dataKey="pagado" stroke="#10b981" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    );
}
