import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';
import HelpButton from '../../../components/HelpButton';

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
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-[#e0dcc8]">Dashboard de Pagos</h2>
                <HelpButton
                    title="Cómo usar el módulo de Pagos"
                    color="text-amber-400"
                    tips={[
                        'Radica cualquier pago del área que requiera aprobación antes de ser ejecutado.',
                        'El flujo va de Solicitado → Liberado → Pagado, con un responsable en cada etapa.',
                        'Adjunta los documentos soporte al crear la solicitud para facilitar la aprobación.',
                        'El dashboard muestra el monto total por estado y la tendencia mensual de pagos.',
                    ]}
                    sections={[
                        {
                            title: '¿Qué hace este módulo?',
                            content: (
                                <p>
                                    Este módulo gestiona las solicitudes de pago del área, sin importar su naturaleza o concepto.
                                    Centraliza el proceso de radicación, aprobación y confirmación de cualquier pago que deba
                                    tramitarse internamente, proporcionando trazabilidad completa de quién solicitó, quién autorizó
                                    y cuándo se ejecutó cada desembolso.
                                </p>
                            )
                        },
                        {
                            title: 'Paso 1 — Radicar una solicitud de pago',
                            content: (
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Haz clic en <b>Nueva Solicitud de Pago</b> en el menú lateral.</li>
                                    <li>Describe el concepto del pago: qué se está pagando y por qué.</li>
                                    <li>Ingresa el monto, la moneda y la fecha en que se necesita ejecutar.</li>
                                    <li>Selecciona el grupo o área al que pertenece la solicitud.</li>
                                    <li>Adjunta los documentos soporte (factura, acta, resolución u otro soporte que respalde el pago).</li>
                                    <li>Guarda — la solicitud queda en estado <b>Solicitado</b> y el supervisor recibe una notificación.</li>
                                </ol>
                            )
                        },
                        {
                            title: 'Paso 2 — Revisión y liberación',
                            content: (
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>El supervisor revisa la solicitud y los documentos adjuntos.</li>
                                    <li>Si aprueba, cambia el estado a <b>Liberado</b> — esto indica que el pago fue autorizado.</li>
                                    <li>Si hay algún inconveniente, cambia a <b>Rechazado</b> y debe dejar una justificación escrita.</li>
                                    <li>El solicitante recibe una notificación con la decisión tomada.</li>
                                </ol>
                            )
                        },
                        {
                            title: 'Paso 3 — Confirmación del pago',
                            content: (
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Una vez ejecutado el desembolso, cambia el estado a <b>Pagado</b>.</li>
                                    <li>Registra la fecha real de pago y el número de comprobante si aplica.</li>
                                    <li>El registro queda en el historial con todos los datos del proceso de aprobación.</li>
                                </ol>
                            )
                        },
                        {
                            title: 'Dashboard y métricas',
                            content: (
                                <p>
                                    El dashboard muestra el número y monto de pagos por estado (Solicitados, Liberados, Pagados, Rechazados),
                                    y una gráfica de tendencia mensual. Úsalo para detectar si hay solicitudes acumuladas sin respuesta
                                    en algún estado del flujo, e identificar cuánto dinero se ha ejecutado en el período.
                                </p>
                            )
                        }
                    ]}
                />
            </div>
            
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
