import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Wallet, FileText, User, Target, Clock, Activity, Plus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

function ModuloCard({ titulo, icono, items, renderItem, isCompact = false }) {
    return (
        <div className={`bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] ${isCompact ? 'col-span-full' : ''}`}>
            <div className="flex items-center gap-2 mb-4 text-[#2d4a3e] font-bold uppercase text-sm">
                {icono} {titulo} ({items.length})
            </div>
            <ul className="space-y-2 text-xs">
                {items.map((item, idx) => (
                    <li key={idx} className="border-b border-[#2d4a3e]/30 pb-1 hover:bg-[#2d4a3e]/5 cursor-pointer">
                        {renderItem(item)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function MiPerfil() {
    const { user, permissions, hasPermission } = useAuth();
    const [tareas, setTareas] = useState({ tutelas: [], comunicaciones: [], pagos: [], conformidades: [], objetivos: [], logs: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarTodo, setMostrarTodo] = useState(false);
    const [soloPendientes, setSoloPendientes] = useState(false);

    const QUICK_ACTIONS = [
        { label: 'Nueva Tutela', path: '/procesar', permission: ['tutelas', 'WRITE'], icon: <Plus size={16}/> },
        { label: 'Nueva Comunicación', path: '/comunicaciones/nueva', permission: ['comunicaciones', 'WRITE_COM'], icon: <Plus size={16}/> },
        { label: 'Nuevo Pago', path: '/pagos/nueva', permission: ['pagos', 'WRITE_PAGO'], icon: <Plus size={16}/> },
        { label: 'Nueva Conformidad', path: '/conformidades/nueva', permission: ['conformidades', 'WRITE'], icon: <Plus size={16}/> }
    ];

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const [tutRes, comRes, pagRes, conRes, objRes, logRes] = await Promise.all([
                    apiService.get('/tutelas/mis-tutelas'),
                    apiService.get('/comunicaciones/mis-comunicaciones'),
                    apiService.get('/pagos/mis-pagos'),
                    apiService.get('/conformidades/mis-conformidades'),
                    apiService.get('/rendimiento/mis-objetivos'),
                    apiService.get('/admin/logs/mis-logs')
                ]);
                setTareas({ 
                    tutelas: tutRes.data, 
                    comunicaciones: comRes.data, 
                    pagos: pagRes.data,
                    conformidades: conRes.data,
                    objetivos: objRes.data,
                    logs: logRes.data 
                });
            } catch (error) { toast.error('Error al cargar datos'); }
            finally { setLoading(false); }
        };
        fetchDatos();
    }, []);

    const filteredTareas = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return {
            tutelas: tareas.tutelas.filter(t => 
                (t.radicado.toLowerCase().includes(term) || t.accionante.toLowerCase().includes(term)) &&
                (mostrarTodo || t.estado.toLowerCase() !== 'finalizada')
            ),
            comunicaciones: tareas.comunicaciones.filter(c => 
                (c.asunto.toLowerCase().includes(term) || c.entidad.toLowerCase().includes(term)) &&
                (mostrarTodo || c.estado.toLowerCase() !== 'respondida')
            ),
            pagos: tareas.pagos.filter(p => 
                (p.concepto.toLowerCase().includes(term) || p.nit.toLowerCase().includes(term)) &&
                (mostrarTodo || !['completado', 'pagado', 'rechazado'].includes(p.estado.toLowerCase()))
            ),
            conformidades: tareas.conformidades.filter(c => 
                (c.concepto.toLowerCase().includes(term)) &&
                (!soloPendientes || c.estado !== 'CONFORMADO')
            ),
            objetivos: tareas.objetivos.filter(o => 
                String(o.meta_acciones || '').toLowerCase().includes(term)
            )
        };
    }, [tareas, searchTerm, mostrarTodo]);

    const proximosVencimientos = useMemo(() => {
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(hoy.getDate() + 5);

        const vencimientos = [
            ...tareas.tutelas.filter(t => t.fecha_vencimiento && new Date(t.fecha_vencimiento) <= limite && t.estado !== 'Finalizada').map(t => ({...t, tipo: 'Tutela', fecha: t.fecha_vencimiento, ref: t.radicado, link: `/tutela/${t.id}`})),
            ...tareas.pagos.filter(p => p.fecha_limite && new Date(p.fecha_limite) <= limite && !['completado', 'pagado'].includes(p.estado)).map(p => ({...p, tipo: 'Pago', fecha: p.fecha_limite, ref: p.concepto, link: `/pagos/${p.id}`}))
        ];
        return vencimientos.sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    }, [tareas]);

    const contarPendientes = () => {
        return filteredTareas.tutelas.length + 
               filteredTareas.comunicaciones.length + 
               filteredTareas.pagos.length + 
               filteredTareas.conformidades.length +
               filteredTareas.objetivos.length;
    };

    if (loading) return <div className="text-[#2d4a3e] p-10 font-mono">Cargando datos...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 p-6 font-mono text-[#1a1a1a]">
            {/* Header Perfil */}
            <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#2d4a3e] text-[#e0dcc8] p-4 rounded-full"><User size={32}/></div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">{user?.nombre}</h2>
                            <p className="text-xs text-[#2d4a3e]/70 mb-1">{user?.email}</p>
                            <div className="flex flex-wrap gap-1">
                                {permissions.map((p, idx) => (
                                    <span key={idx} className="text-[9px] bg-[#2d4a3e]/20 text-[#2d4a3e] px-1.5 py-0.5 rounded uppercase">
                                        {p.modulo}:{p.accion}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-center border-l border-[#2d4a3e] pl-4">
                        <p className="text-2xl font-bold text-[#2d4a3e]">{contarPendientes()}</p>
                        <p className="text-[9px] uppercase tracking-widest">Tareas Pendientes</p>
                    </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="flex flex-wrap gap-2 mt-6">
                    {QUICK_ACTIONS.filter(action => hasPermission(action.permission[0], action.permission[1])).map(action => (
                        <Link key={action.path} to={action.path} className="flex items-center gap-2 bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase shadow-[2px_2px_0px_0px_#1a2e26] hover:bg-[#1a2e26]">
                            {action.icon} {action.label}
                        </Link>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                    <label className="flex items-center gap-2 text-xs uppercase cursor-pointer">
                        <input type="checkbox" checked={mostrarTodo} onChange={e => setMostrarTodo(e.target.checked)} />
                        Mostrar todo
                    </label>
                    <label className="flex items-center gap-2 text-xs uppercase cursor-pointer">
                        <input type="checkbox" checked={soloPendientes} onChange={e => setSoloPendientes(e.target.checked)} />
                        Solo pendientes
                    </label>
                    <input 
                        type="text" 
                        placeholder="Filtrar por palabra clave..." 
                        className="bg-transparent border-b-2 border-[#2d4a3e] p-2 outline-none text-[#1a1a1a] uppercase text-xs placeholder-[#2d4a3e]/50 w-full md:w-64"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            {/* Próximos Vencimientos */}
            {proximosVencimientos.length > 0 && (
                <ModuloCard 
                    titulo="Próximos Vencimientos (5 días)" 
                    icono={<Clock size={18} className="text-red-700"/>} 
                    items={proximosVencimientos} 
                    isCompact={true}
                    renderItem={(v) => (
                        <Link to={v.link} className="flex justify-between w-full text-red-800 font-bold">
                            <span>{v.tipo}: {v.ref}</span>
                            <span>{new Date(v.fecha).toLocaleDateString()}</span>
                        </Link>
                    )}
                />
            )}

            {/* Tareas Consolidadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModuloCard 
                    titulo="Tutelas" 
                    icono={<FileText size={18}/>} 
                    items={filteredTareas.tutelas} 
                    renderItem={(t) => (
                        <Link to={`/tutela/${t.id}`} className="flex justify-between w-full">
                            <span className="font-bold">{t.radicado}</span>
                            <span className="text-[9px] bg-[#2d4a3e]/10 px-1">{t.estado}</span>
                        </Link>
                    )}
                />
                <ModuloCard 
                    titulo="Comunicaciones" 
                    icono={<Mail size={18}/>} 
                    items={filteredTareas.comunicaciones} 
                    renderItem={(c) => (
                        <Link to={`/comunicaciones/${c.id}`} className="flex justify-between w-full">
                            <span className="font-bold">{c.asunto}</span>
                            <span className="text-[9px] bg-[#2d4a3e]/10 px-1">{c.estado}</span>
                        </Link>
                    )}
                />
                <ModuloCard 
                    titulo="Pagos" 
                    icono={<Wallet size={18}/>} 
                    items={filteredTareas.pagos} 
                    renderItem={(p) => (
                        <Link to={`/pagos/${p.id}`} className="flex justify-between w-full">
                            <span className="font-bold">{p.concepto}</span>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] bg-[#2d4a3e]/10 px-1">{p.estado}</span>
                                <span className="text-[10px] font-bold">${parseFloat(p.monto).toLocaleString('es-CO')}</span>
                            </div>
                        </Link>
                    )}
                />
                <ModuloCard 
                    titulo="Conformidades" 
                    icono={<FileText size={18} className="text-blue-700"/>} 
                    items={filteredTareas.conformidades} 
                    renderItem={(c) => (
                        <Link to={`/conformidades/${c.id}`} className="flex justify-between w-full">
                            <span className="font-bold">{c.concepto}</span>
                            <span className="text-[9px] bg-[#2d4a3e]/10 px-1">{c.estado}</span>
                        </Link>
                    )}
                />
                <ModuloCard 
                    titulo="Objetivos" 
                    icono={<Target size={18}/>} 
                    items={filteredTareas.objetivos} 
                    renderItem={(o) => (
                        <div className="flex justify-between w-full">
                            <span className="font-bold">{o.meta_acciones}</span>
                        </div>
                    )}
                />
                <ModuloCard 
                    titulo="Actividad Reciente" 
                    icono={<Activity size={18}/>} 
                    items={tareas.logs} 
                    renderItem={(l) => (
                        <div className="flex justify-between w-full">
                            <span className="font-bold">{l.accion}</span>
                            <span className="text-[9px] text-gray-500">{new Date(l.created_at).toLocaleDateString()}</span>
                        </div>
                    )}
                />
            </div>
        </motion.div>
    );
}
