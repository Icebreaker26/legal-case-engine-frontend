import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function NuevaSolicitudPago() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        concepto: '',
        monto: '',
        acreedor_id: '',
        solicitante_uuid: '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        soportes_link: '',
        grupo_ids: [],
        tipo_pago: 'ESTANDAR',
        proyecto_id: '',
        wbe: '',
        metodo_pago: 'TRANSFERENCIA',
        codigo_sig: ''
    });
    const [acreedores, setAcreedores] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [searchAcreedor, setSearchAcreedor] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [searchGrupo, setSearchGrupo] = useState('');
    const [searchProyecto, setSearchProyecto] = useState('');
    const [mostrarBusquedaAcreedor, setMostrarBusquedaAcreedor] = useState(false);
    const [mostrarBusquedaUsuario, setMostrarBusquedaUsuario] = useState(false);
    const [mostrarBusquedaProyecto, setMostrarBusquedaProyecto] = useState(false);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const [acrRes, usersRes, groupsRes, projRes] = await Promise.all([
                    apiService.get('/core/acreedores'),
                    apiService.get('/admin/usuarios'),
                    apiService.get('/core/grupos'),
                    apiService.get('/core/proyectos')
                ]);
                setAcreedores(acrRes.data);
                setUsuarios(usersRes.data);
                setGrupos(groupsRes.data);
                setProyectos(projRes.data);
            } catch (error) { toast.error('Error al cargar datos'); }
        };
        fetchDatos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.acreedor_id || !formData.solicitante_uuid || !formData.proyecto_id) {
            toast.error('Por favor, selecciona un acreedor, un solicitante y un proyecto');
            return;
        }
        try {
            const { data } = await apiService.post('/pagos', {
                ...formData,
                monto: parseFloat(formData.monto)
            });
            
            // Asignar grupos después de crear
            for (const gId of formData.grupo_ids) {
                await apiService.post(`/pagos/${data.id}/grupos`, { grupo_id: gId });
            }

            toast.success('Solicitud de pago creada');
            navigate('/pagos');
        } catch (error) {
            toast.error('Error al crear solicitud');
        }
    };

    const inputClasses = "w-full bg-[#e0dcc8] border-b-2 border-[#2d4a3e] p-2 outline-none text-[#1a1a1a] uppercase text-sm placeholder-[#2d4a3e]/50";
    const selectedAcreedor = acreedores.find(a => a.id === formData.acreedor_id);
    const selectedSolicitante = usuarios.find(u => u.id === formData.solicitante_uuid);
    const selectedProyecto = proyectos.find(p => p.id === parseInt(formData.proyecto_id));
    const gruposFiltrados = grupos.filter(g => g.nombre.toLowerCase().includes(searchGrupo.toLowerCase()));

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]"
        >
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e] mb-6">Nueva Solicitud de Pago</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] uppercase font-bold text-[#2d4a3e] mb-1">Tipo de Pago:</p>
                        <select 
                            className={inputClasses} 
                            value={formData.tipo_pago} 
                            onChange={e => setFormData({...formData, tipo_pago: e.target.value})}
                        >
                            <option value="ESTANDAR">ESTÁNDAR / GENERAL</option>
                            <option value="PREDIAL">PREDIAL</option>
                        </select>
                    </div>

                    <input className={inputClasses} placeholder="Concepto" required onChange={e => setFormData({...formData, concepto: e.target.value})} />
                    <input className={inputClasses} type="number" placeholder="Monto" required onChange={e => setFormData({...formData, monto: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Searchable Select Proyecto */}
                    <div className="relative">
                        <p className="text-[10px] uppercase font-bold text-[#2d4a3e] mb-1">Proyecto:</p>
                        <button type="button" onClick={() => setMostrarBusquedaProyecto(!mostrarBusquedaProyecto)} className={inputClasses + " text-left flex justify-between items-center"}>
                            {selectedProyecto ? selectedProyecto.nombre : "Seleccionar Proyecto..."}
                            <Search size={16} />
                        </button>
                        {mostrarBusquedaProyecto && (
                            <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1 shadow-lg">
                                <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-[10px] uppercase" placeholder="Buscar proyecto..." value={searchProyecto} onChange={e => setSearchProyecto(e.target.value)} />
                                {proyectos.filter(p => p.nombre.toLowerCase().includes(searchProyecto.toLowerCase())).map(p => (
                                    <div key={p.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-[10px] uppercase" onClick={() => { setFormData({...formData, proyecto_id: p.id}); setMostrarBusquedaProyecto(false); }}>
                                        {p.nombre}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-end">
                        <input className={inputClasses} placeholder="WBE" onChange={e => setFormData({...formData, wbe: e.target.value})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-[#2d4a3e] mb-1">Método de Pago:</p>
                        <select 
                            className={inputClasses} 
                            value={formData.metodo_pago} 
                            onChange={e => setFormData({...formData, metodo_pago: e.target.value})}
                        >
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="CHEQUE">CHEQUE</option>
                        </select>
                    </div>
                    {formData.tipo_pago === 'PREDIAL' && (
                        <input 
                            className={inputClasses + " border-orange-600"} 
                            placeholder="CÓDIGO SIG (SÓLO PREDIAL)" 
                            required={formData.tipo_pago === 'PREDIAL'}
                            onChange={e => setFormData({...formData, codigo_sig: e.target.value})} 
                        />
                    )}
                </div>
                
                {/* Searchable Select Acreedores */}
                <div className="relative">
                    <p className="text-xs uppercase font-bold text-[#2d4a3e] mb-1">Acreedor (Nombre - NIT):</p>
                    <button type="button" onClick={() => setMostrarBusquedaAcreedor(!mostrarBusquedaAcreedor)} className={inputClasses + " text-left flex justify-between items-center"}>
                        {selectedAcreedor ? `${selectedAcreedor.nombre} - ${selectedAcreedor.nit}` : "Seleccionar Acreedor..."}
                        <Search size={16} />
                    </button>
                    {mostrarBusquedaAcreedor && (
                        <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar por nombre o NIT..." value={searchAcreedor} onChange={e => setSearchAcreedor(e.target.value)} />
                            {acreedores.filter(a => a.nombre.toLowerCase().includes(searchAcreedor.toLowerCase()) || a.nit.includes(searchAcreedor)).map(a => (
                                <div key={a.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs" onClick={() => { setFormData({...formData, acreedor_id: a.id}); setMostrarBusquedaAcreedor(false); }}>
                                    {a.nombre} - NIT: {a.nit}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Searchable Select Solicitante */}
                <div className="relative">
                    <p className="text-xs uppercase font-bold text-[#2d4a3e] mb-1">Solicitante:</p>
                    <button type="button" onClick={() => setMostrarBusquedaUsuario(!mostrarBusquedaUsuario)} className={inputClasses + " text-left flex justify-between items-center"}>
                        {selectedSolicitante ? selectedSolicitante.nombre : "Seleccionar Solicitante..."}
                        <Search size={16} />
                    </button>
                    {mostrarBusquedaUsuario && (
                        <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar por nombre..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                            {usuarios.filter(u => u.nombre.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                                <div key={u.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs" onClick={() => { setFormData({...formData, solicitante_uuid: u.id}); setMostrarBusquedaUsuario(false); }}>
                                    {u.nombre}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grupos */}
                <div className="space-y-2">
                    <p className="text-xs uppercase font-bold text-[#2d4a3e]">Grupos:</p>
                    <input 
                        className={inputClasses + " mb-2"} 
                        placeholder="Buscar grupos..." 
                        value={searchGrupo} 
                        onChange={e => setSearchGrupo(e.target.value)} 
                    />
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 border-[#2d4a3e]/30">
                        {gruposFiltrados.map(g => (
                            <button 
                                type="button"
                                key={g.id}
                                className={`text-[10px] px-2 py-1 uppercase font-bold border ${formData.grupo_ids.includes(g.id) ? 'bg-[#2d4a3e] text-[#e0dcc8]' : 'border-[#2d4a3e] text-[#2d4a3e]'}`}
                                onClick={() => {
                                    const ids = formData.grupo_ids.includes(g.id) 
                                        ? formData.grupo_ids.filter(id => id !== g.id)
                                        : [...formData.grupo_ids, g.id];
                                    setFormData({...formData, grupo_ids: ids});
                                }}
                            >
                                {g.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                <input className={inputClasses} type="date" required onChange={e => setFormData({...formData, fecha_solicitud: e.target.value})} value={formData.fecha_solicitud} />
                <input className={inputClasses} placeholder="Link de Soportes" onChange={e => setFormData({...formData, soportes_link: e.target.value})} />
                
                <button type="submit" className="w-full bg-[#2d4a3e] text-[#e0dcc8] py-2 font-bold uppercase tracking-widest hover:bg-[#1a2e26] transition-colors">
                    Enviar Solicitud
                </button>
            </form>
        </motion.div>
    );
}
