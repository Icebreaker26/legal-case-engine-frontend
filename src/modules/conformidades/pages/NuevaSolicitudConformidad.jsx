import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import conformidadesService from '../../../services/conformidadesService';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import SearchableSelect from '../components/SearchableSelect';

export default function NuevaSolicitudConformidad() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        concepto: '',
        entidad_id: '',
        proyecto_id: '',
        contrato_id: '',
        responsable_id: '',
        solicitante_id: '',
        fecha_recepcion: new Date().toISOString().split('T')[0],
        fecha_solicitud: new Date().toISOString().split('T')[0],
        ot: '',
        wbe: '',
        valor: '',
        link_acta: '',
        grupo_ids: []
    });
    
    const [entidades, setEntidades] = useState([]);
    const [proyectos, setProyectos] = useState([]);
    const [contratos, setContratos] = useState([]);
    const [abogados, setAbogados] = useState([]);
    
    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const [entRes, proyRes, contRes, userRes] = await Promise.all([
                    conformidadesService.getEntidades(),
                    conformidadesService.getProyectos(),
                    conformidadesService.getContratos(),
                    apiService.get('/admin/usuarios')
                ]);
                setEntidades(entRes.data);
                setProyectos(proyRes.data);
                setContratos(contRes.data);
                setAbogados(userRes.data);
            } catch (error) { toast.error('Error al cargar datos'); }
        };
        fetchDatos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await conformidadesService.create({
                ...formData,
                valor: parseFloat(formData.valor)
            });
            toast.success('Solicitud de conformidad creada');
            navigate('/conformidades');
        } catch (error) { toast.error('Error al crear solicitud'); }
    };

    const inputClasses = "w-full bg-[#e0dcc8] border-b-2 border-[#2d4a3e] p-2 outline-none text-[#1a1a1a] uppercase text-sm placeholder-[#2d4a3e]/50";
    const labelClasses = "text-xs font-bold uppercase text-[#2d4a3e] mt-2 block";

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]"
        >
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e] mb-6">Nueva Conformidad</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className={labelClasses}>Concepto</label>
                    <input className={inputClasses} placeholder="Concepto" required onChange={e => setFormData({...formData, concepto: e.target.value})} />
                </div>
                
                <div>
                    <label className={labelClasses}>Entidad</label>
                    <SearchableSelect options={entidades} value={formData.entidad_id} onChange={id => setFormData({...formData, entidad_id: id})} placeholder="Seleccionar Entidad..." />
                </div>
                
                <div>
                    <label className={labelClasses}>Proyecto</label>
                    <SearchableSelect options={proyectos} value={formData.proyecto_id} onChange={id => setFormData({...formData, proyecto_id: id})} placeholder="Seleccionar Proyecto..." />
                </div>
                
                <div>
                    <label className={labelClasses}>Contrato</label>
                    <SearchableSelect options={contratos} value={formData.contrato_id} onChange={id => setFormData({...formData, contrato_id: id})} placeholder="Seleccionar Contrato..." labelField="numero" />
                </div>
                
                <div>
                    <label className={labelClasses}>Responsable</label>
                    <SearchableSelect options={abogados} value={formData.responsable_id} onChange={id => setFormData({...formData, responsable_id: id})} placeholder="Seleccionar Responsable..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>OT</label>
                        <input className={inputClasses} placeholder="OT" required onChange={e => setFormData({...formData, ot: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClasses}>WBE</label>
                        <input className={inputClasses} placeholder="WBE" required onChange={e => setFormData({...formData, wbe: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className={labelClasses}>Valor</label>
                    <input className={inputClasses} type="number" placeholder="Valor" required onChange={e => setFormData({...formData, valor: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Fecha Recepción</label>
                        <input className={inputClasses} type="date" required onChange={e => setFormData({...formData, fecha_recepcion: e.target.value})} value={formData.fecha_recepcion} />
                    </div>
                    <div>
                        <label className={labelClasses}>Fecha Solicitud</label>
                        <input className={inputClasses} type="date" required onChange={e => setFormData({...formData, fecha_solicitud: e.target.value})} value={formData.fecha_solicitud} />
                    </div>
                </div>
                
                <div>
                    <label className={labelClasses}>Link Acta</label>
                    <input className={inputClasses} placeholder="Link Acta" onChange={e => setFormData({...formData, link_acta: e.target.value})} />
                </div>
                
                <button type="submit" className="w-full bg-[#2d4a3e] text-[#e0dcc8] py-2 font-bold uppercase tracking-widest hover:bg-[#1a2e26] transition-colors mt-6">
                    Crear Conformidad
                </button>
            </form>
        </motion.div>
    );
}
