import { useState, useEffect } from 'react';
import conformidadesService from '../../../services/conformidadesService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SearchableSelect from '../components/SearchableSelect';
import HelpButton from '../../../components/HelpButton';

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
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-[#e0dcc8]">Dashboard de Conformidades</h2>
                    <HelpButton
                        title="Cómo usar el módulo de Conformidades"
                        color="text-yellow-500"
                        tips={[
                            'Crea una conformidad asociándola al proyecto, contrato y entidad correspondiente.',
                            'Asigna el grupo responsable para que el equipo correcto reciba la notificación.',
                            'Actualiza el estado cada vez que haya un avance en el trámite.',
                            'Consulta el historial en el detalle para ver todos los cambios de estado con fechas y responsables.',
                        ]}
                        sections={[
                            {
                                title: '¿Qué hace este módulo?',
                                content: (
                                    <p>
                                        Este módulo registra y hace seguimiento a las conformidades: documentos que certifican que una
                                        actividad, entrega o servicio cumple con los requisitos pactados en un proyecto o contrato.
                                        Permite llevar trazabilidad completa del estado de cada conformidad, desde su creación hasta su
                                        cierre, con historial de quién hizo qué cambio y cuándo.
                                    </p>
                                )
                            },
                            {
                                title: 'Paso 1 — Crear una nueva conformidad',
                                content: (
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Haz clic en <b>Nueva Conformidad</b> en el menú lateral.</li>
                                        <li>Selecciona el <b>proyecto</b> al que está asociada la conformidad.</li>
                                        <li>Si aplica, vincula también el <b>contrato</b> específico dentro del proyecto.</li>
                                        <li>Selecciona la <b>entidad</b> involucrada en la conformidad.</li>
                                        <li>Asigna el <b>estado inicial</b> (normalmente "Pendiente") y el grupo responsable.</li>
                                        <li>Agrega una descripción clara de qué está siendo certificado con esta conformidad.</li>
                                    </ol>
                                )
                            },
                            {
                                title: 'Paso 2 — Actualizar el estado',
                                content: (
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Abre el detalle de la conformidad desde la lista.</li>
                                        <li>Usa el selector de estado para avanzar en el flujo (ej. de Pendiente a En revisión).</li>
                                        <li>Agrega un comentario explicando el motivo del cambio — queda registrado en el historial.</li>
                                        <li>Guarda el cambio. El sistema notifica automáticamente al grupo responsable.</li>
                                    </ol>
                                )
                            },
                            {
                                title: 'Paso 3 — Revisar el historial',
                                content: (
                                    <p>
                                        Cada conformidad tiene una sección de <b>Historial de cambios</b> donde puedes ver, en orden cronológico,
                                        todos los cambios de estado realizados: quién los hizo, en qué fecha y qué comentario dejó.
                                        Esto es fundamental para auditorías y para entender el proceso que siguió cada conformidad.
                                    </p>
                                )
                            },
                            {
                                title: 'Dashboard y filtros',
                                content: (
                                    <p>
                                        El dashboard muestra el total de conformidades, cuántas están pendientes y el monto total
                                        acumulado. Usa el selector de <b>entidad</b> para filtrar las métricas por un contratante
                                        específico. El gráfico de barras muestra cómo se distribuyen las conformidades por estado,
                                        lo que permite identificar si hay muchas represadas en alguna etapa del proceso.
                                    </p>
                                )
                            }
                        ]}
                    />
                </div>

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
