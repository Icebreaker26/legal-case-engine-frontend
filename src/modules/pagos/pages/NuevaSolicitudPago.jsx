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
        nit: '',
        solicitante_id: '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        soportes_link: '',
        grupo_ids: []
    });
    const [usuarios, setUsuarios] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [searchUser, setSearchUser] = useState('');
    const [searchGrupo, setSearchGrupo] = useState('');
    const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const [usersRes, groupsRes] = await Promise.all([
                    apiService.get('/admin/usuarios'),
                    apiService.get('/pagos/grupos')
                ]);
                setUsuarios(usersRes.data);
                setGrupos(groupsRes.data);
            } catch (error) { toast.error('Error al cargar datos'); }
        };
        fetchDatos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.solicitante_id) {
            toast.error('Por favor, selecciona un solicitante');
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
    const selectedUser = usuarios.find(u => u.id === formData.solicitante_id);
    const gruposFiltrados = grupos.filter(g => g.nombre.toLowerCase().includes(searchGrupo.toLowerCase()));

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]"
        >
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e] mb-6">Nueva Solicitud de Pago</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input className={inputClasses} placeholder="Concepto" required onChange={e => setFormData({...formData, concepto: e.target.value})} />
                <input className={inputClasses} placeholder="NIT" required onChange={e => setFormData({...formData, nit: e.target.value})} />
                <input className={inputClasses} type="number" placeholder="Monto" required onChange={e => setFormData({...formData, monto: e.target.value})} />
                
                {/* Searchable Select */}
                <div className="relative">
                    <button type="button" onClick={() => setMostrarBusqueda(!mostrarBusqueda)} className={inputClasses + " text-left flex justify-between items-center"}>
                        {selectedUser ? selectedUser.nombre : "Seleccionar Solicitante..."}
                        <Search size={16} />
                    </button>
                    {mostrarBusqueda && (
                        <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                            {usuarios.filter(u => u.nombre.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                                <div key={u.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs" onClick={() => { setFormData({...formData, solicitante_id: u.id}); setMostrarBusqueda(false); }}>
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
