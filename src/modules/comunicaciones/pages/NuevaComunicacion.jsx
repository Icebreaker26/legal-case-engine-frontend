import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Search, Plus, X, Check } from 'lucide-react';

export default function NuevaComunicacion() {
    const navigate = useNavigate();
    const [abogados, setAbogados] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [searchResponsable, setSearchResponsable] = useState('');
    const [searchEntidad, setSearchEntidad] = useState('');
    const [searchGrupo, setSearchGrupo] = useState('');
    const [mostrarBusquedaResponsable, setMostrarBusquedaResponsable] = useState(false);
    const [mostrarBusquedaEntidad, setMostrarBusquedaEntidad] = useState(false);
    const [mostrarBusquedaGrupo, setMostrarBusquedaGrupo] = useState(false);
    const [nuevaEntidad, setNuevaEntidad] = useState('');
    const [mostrarNuevaEntidad, setMostrarNuevaEntidad] = useState(false);
    
    const [formData, setFormData] = useState({
        entidad_id: '', tipo: 'recibida', asunto: '', fecha_recepcion: '', fecha_limite: '', responsable_id: '', descripcion: '', link: '', grupos: []
    });

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [abogadosRes, entidadesRes, gruposRes] = await Promise.all([
                apiService.get('/admin/usuarios'),
                apiService.get('/core/entidades'),
                apiService.get('/core/grupos')
            ]);
            setAbogados(abogadosRes.data);
            setEntidades(entidadesRes.data);
            setGrupos(gruposRes.data);
        } catch (error) { toast.error('Error al cargar datos'); }
    };

    const handleCrearEntidad = async () => {
        if (!nuevaEntidad.trim()) return;
        try {
            const { data } = await apiService.post('/core/entidades', { nombre: nuevaEntidad });
            setEntidades([...entidades, data]);
            setFormData({...formData, entidad_id: data.id});
            setSearchEntidad(data.nombre);
            setNuevaEntidad('');
            setMostrarNuevaEntidad(false);
            toast.success('Entidad creada');
        } catch (error) { toast.error('Error al crear entidad'); }
    };

    const toggleGrupo = (id) => {
        setFormData(prev => ({
            ...prev,
            grupos: prev.grupos.includes(id) ? prev.grupos.filter(g => g !== id) : [...prev.grupos, id]
        }));
    };

    const abogadosFiltrados = useMemo(() => {
        return abogados.filter(a => a.nombre.toLowerCase().includes(searchResponsable.toLowerCase()));
    }, [abogados, searchResponsable]);

    const entidadesFiltradas = useMemo(() => {
        return entidades.filter(e => e.nombre.toLowerCase().includes(searchEntidad.toLowerCase()));
    }, [entidades, searchEntidad]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await apiService.post('/comunicaciones', {
                ...formData,
                responsable_uuid: formData.responsable_id || null,
                entidad_id: parseInt(formData.entidad_id)
            });
            for (const grupoId of formData.grupos) {
                await apiService.post(`/comunicaciones/${data.id}/grupos`, { grupo_id: grupoId });
            }
            toast.success('Comunicación creada con grupos');
            navigate('/comunicaciones');
        } catch (error) { toast.error('Error al crear'); }
    };

    return (
        <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] max-w-2xl mx-auto font-mono">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b border-[#2d4a3e] pb-2">Nueva Comunicación</h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                {/* Entidad */}
                <div className="relative">
                    <label className="block text-[10px] text-[#2d4a3e] uppercase font-bold mb-1">Entidad:</label>
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center border-b border-[#2d4a3e] p-2 cursor-pointer" onClick={() => setMostrarBusquedaEntidad(!mostrarBusquedaEntidad)}>
                            <Search size={14} className="text-[#2d4a3e] mr-2" />
                            <span className="w-full">{searchEntidad || "Buscar entidad..."}</span>
                        </div>
                        <button type="button" onClick={() => setMostrarNuevaEntidad(!mostrarNuevaEntidad)} className="text-[#2d4a3e]"><Plus size={16} /></button>
                    </div>
                    {mostrarNuevaEntidad && (
                        <div className="flex gap-2 mt-2 p-2 bg-[#d6d2bd]">
                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 outline-none flex-1" placeholder="Nombre nueva entidad" value={nuevaEntidad} onChange={e => setNuevaEntidad(e.target.value)} />
                            <button type="button" onClick={handleCrearEntidad} className="bg-[#2d4a3e] text-[#e0dcc8] px-2 font-bold">CREAR</button>
                        </div>
                    )}
                    {mostrarBusquedaEntidad && (
                        <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar..." value={searchEntidad} onChange={e => setSearchEntidad(e.target.value)} />
                            {entidadesFiltradas.map(e => (
                                <div key={e.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer" onClick={() => { setFormData({...formData, entidad_id: e.id}); setSearchEntidad(e.nombre); setMostrarBusquedaEntidad(false); }}>
                                    {e.nombre}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Otros campos... */}
                <select className="w-full bg-transparent border-b border-[#2d4a3e] p-2 outline-none" onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="recibida">Recibida</option>
                    <option value="enviada">Enviada</option>
                </select>
                <input className="w-full bg-transparent border-b border-[#2d4a3e] p-2 outline-none" placeholder="Asunto" onChange={e => setFormData({...formData, asunto: e.target.value})} required />
                <textarea className="w-full bg-transparent border border-[#2d4a3e] p-2 outline-none" placeholder="Descripción" onChange={e => setFormData({...formData, descripcion: e.target.value})} />
                <input className="w-full bg-transparent border-b border-[#2d4a3e] p-2 outline-none" placeholder="Link de referencia" onChange={e => setFormData({...formData, link: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] text-[#2d4a3e] uppercase font-bold mb-1">Fecha de Recepción:</label>
                        <input type="datetime-local" className="w-full bg-transparent border-b border-[#2d4a3e] p-2" onChange={e => setFormData({...formData, fecha_recepcion: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-[10px] text-[#2d4a3e] uppercase font-bold mb-1">Fecha Límite (Deadline):</label>
                        <input type="datetime-local" className="w-full bg-transparent border-b border-[#2d4a3e] p-2" onChange={e => setFormData({...formData, fecha_limite: e.target.value})} />
                    </div>
                </div>

                {/* Buscador de Grupos */}
                <div className="relative">
                    <label className="block text-[10px] text-[#2d4a3e] uppercase font-bold mb-1">Grupos:</label>
                    <button type="button" onClick={() => setMostrarBusquedaGrupo(!mostrarBusquedaGrupo)} className="w-full flex items-center border-b border-[#2d4a3e] p-2 text-[#2d4a3e]">
                        <Search size={14} className="mr-2" />
                        {formData.grupos.length > 0 ? `${formData.grupos.length} seleccionados` : "Seleccionar grupos..."}
                    </button>
                    {mostrarBusquedaGrupo && (
                        <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                            {grupos.map(g => (
                                <div key={g.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs flex justify-between" onClick={() => toggleGrupo(g.id)}>
                                    {g.nombre} {formData.grupos.includes(g.id) && <Check size={14} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <label className="block text-[10px] text-[#2d4a3e] uppercase font-bold mb-1">Responsable:</label>
                    <div className="flex items-center border-b border-[#2d4a3e] p-2 cursor-pointer" onClick={() => setMostrarBusquedaResponsable(!mostrarBusquedaResponsable)}>
                        <Search size={14} className="text-[#2d4a3e] mr-2" />
                        <span className="w-full">{searchResponsable || "Buscar profesional..."}</span>
                    </div>
                    {mostrarBusquedaResponsable && (
                        <div className="absolute z-10 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                            <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar..." value={searchResponsable} onChange={e => setSearchResponsable(e.target.value)} />
                            {abogadosFiltrados.map(a => (
                                <div key={a.id} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer" onClick={() => { setFormData({...formData, responsable_id: a.id}); setSearchResponsable(a.nombre); setMostrarBusquedaResponsable(false); }}>
                                    {a.nombre}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button type="submit" className="w-full bg-[#2d4a3e] text-[#e0dcc8] py-2 font-bold uppercase">Registrar</button>
            </form>
        </div>
    );
}
