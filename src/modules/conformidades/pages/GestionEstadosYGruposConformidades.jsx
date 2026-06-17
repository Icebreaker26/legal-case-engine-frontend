import { useState, useEffect } from 'react';
import conformidadesService from '../../../services/conformidadesService';
import toast from 'react-hot-toast';
import { Trash2, Plus, Pencil, Check, Archive, RefreshCw, X } from 'lucide-react';
import apiService from '../../../services/apiService';

export default function GestionEstadosYGruposConformidades() {
    const [datos, setDatos] = useState({ 
        estados: [], grupos: [], entidades: [], proyectos: [], contratos: [] 
    });
    const [datosInactivos, setDatosInactivos] = useState({ 
        estados: [], grupos: [], entidades: [], proyectos: [], contratos: [] 
    });
    
    const [nuevos, setNuevos] = useState({ estado: '', grupo: '', entidad: '', proyecto: '', contrato: '' });
    const [editando, setEditando] = useState({ id: null, tipo: null, valor: '' });
    const [mostrarPapelera, setMostrarPapelera] = useState(false);

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        try {
            const [est, gru, ent, proy, cont, inactGru, inactEnt, inactProy, inactCont] = await Promise.all([
                conformidadesService.getEstados(),
                conformidadesService.getGrupos(),
                conformidadesService.getEntidades(),
                conformidadesService.getProyectos(),
                conformidadesService.getContratos(),
                apiService.get('/core/grupos/inactivas'),
                apiService.get('/core/entidades/inactivas'),
                apiService.get('/core/proyectos/inactivas'),
                apiService.get('/core/contratos/inactivas')
            ]);
            setDatos({ 
                estados: est.data, 
                grupos: gru.data, 
                entidades: ent.data, 
                proyectos: proy.data, 
                contratos: cont.data 
            });
            setDatosInactivos({ 
                estados: [], // Endpoint para estados inactivos no definido en core
                grupos: inactGru.data, 
                entidades: inactEnt.data, 
                proyectos: inactProy.data, 
                contratos: inactCont.data 
            });
        } catch (error) { toast.error('Error al cargar datos'); }
    };

    const handleCrear = async (tipo, nombre) => {
        if (!nombre.trim()) return;
        try {
            if(tipo === 'estados') await conformidadesService.crearEstado({ nombre, orden: 0 });
            else if(tipo === 'grupos') await apiService.post(`/core/grupos`, { nombre });
            else if(tipo === 'entidades') await conformidadesService.crearEntidad({ nombre });
            else if(tipo === 'proyectos') await conformidadesService.crearProyecto({ nombre });
            else if(tipo === 'contratos') await conformidadesService.crearContrato({ numero: nombre });
            
            toast.success('Creado');
            fetchDatos();
            setNuevos({...nuevos, [tipo === 'contratos' ? 'contrato' : tipo.slice(0,-1)]: ''});
        } catch (error) { toast.error('Error al crear'); }
    };

    const iniciarEdicion = (tipo, id, valor) => setEditando({ id, tipo, valor });

    const guardarEdicion = async () => {
        if (!editando.valor.trim()) return;
        try {
            const endpointBase = editando.tipo === 'contratos' ? 'contratos' : editando.tipo;
            const payload = editando.tipo === 'contratos' ? { numero: editando.valor } : { nombre: editando.valor };
            await apiService.patch(`/core/${endpointBase}/${editando.id}`, payload);
            
            toast.success('Actualizado');
            setEditando({ id: null, tipo: null, valor: '' });
            fetchDatos();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const handleEliminar = async (tipo, id) => {
        if (!confirm('¿Archivar?')) return;
        try {
            await apiService.delete(`/core/${tipo}/${id}`);
            toast.success('Archivado');
            fetchDatos();
        } catch (error) { toast.error('Error al archivar'); }
    };

    const handleRecuperar = async (tipo, id) => {
        try {
            await apiService.patch(`/core/${tipo}/${id}/recuperar`);
            toast.success('Recuperado');
            await fetchDatos();
        } catch (error) { toast.error('Error al recuperar'); }
    };

    const renderColumn = (titulo, tipo, items, keyField, labelField) => (
        <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
            <h3 className="font-bold uppercase mb-4 text-[#2d4a3e]">{titulo}</h3>
            <div className="flex gap-2 mb-4">
                <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" placeholder={`Nuevo ${titulo.slice(0,-1)}...`} value={nuevos[tipo === 'contratos' ? 'contrato' : tipo.slice(0,-1)]} onChange={e => setNuevos({...nuevos, [tipo === 'contratos' ? 'contrato' : tipo.slice(0,-1)]: e.target.value})} />
                <button onClick={() => handleCrear(tipo, nuevos[tipo === 'contratos' ? 'contrato' : tipo.slice(0,-1)])} className="bg-[#2d4a3e] text-[#e0dcc8] px-2"><Plus size={16}/></button>
            </div>
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item[keyField]} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/30 p-1">
                        {editando.id === item[keyField] && editando.tipo === tipo ? (
                            <div className="flex gap-1 flex-1">
                                <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" value={editando.valor} onChange={e => setEditando({...editando, valor: e.target.value})} />
                                <button onClick={guardarEdicion} className="text-[#2d4a3e]"><Check size={14}/></button>
                            </div>
                        ) : (
                            <>
                                {item[labelField]}
                                <div className="flex gap-1">
                                    <button onClick={() => iniciarEdicion(tipo, item[keyField], item[labelField])} className="text-[#2d4a3e]"><Pencil size={14}/></button>
                                    <button onClick={() => handleEliminar(tipo, item[keyField])} className="text-red-800"><Trash2 size={14}/></button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="space-y-8 font-mono text-[#1a1a1a] max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#2d4a3e] pb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Gestión de Conformidades</h2>
                <button onClick={() => setMostrarPapelera(!mostrarPapelera)} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase flex items-center gap-2">
                    <Archive size={16}/> {mostrarPapelera ? 'Cerrar Papelera' : 'Ver Papelera'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {renderColumn('Estados', 'estados', datos.estados, 'id', 'nombre')}
                {renderColumn('Grupos', 'grupos', datos.grupos, 'id', 'nombre')}
                {renderColumn('Entidades', 'entidades', datos.entidades, 'id', 'nombre')}
                {renderColumn('Proyectos', 'proyectos', datos.proyectos, 'id', 'nombre')}
                {renderColumn('Contratos', 'contratos', datos.contratos, 'id', 'numero')}
            </div>

            {mostrarPapelera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] w-full max-w-4xl">
                        <div className="flex justify-between items-center mb-4 border-b border-[#2d4a3e] pb-2">
                            <h3 className="font-bold uppercase">Papelera</h3>
                            <button onClick={() => setMostrarPapelera(false)}><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-5 gap-4 text-xs">
                            {['grupos', 'entidades', 'proyectos', 'contratos'].map(tipo => (
                                <div key={tipo}>
                                    <h4 className="font-bold mb-2 uppercase text-[#2d4a3e]">{tipo}</h4>
                                    {datosInactivos[tipo] && datosInactivos[tipo].map(item => (
                                        <div key={item.id} className="flex justify-between mb-1">
                                            {item.nombre || item.numero} 
                                            <button onClick={() => handleRecuperar(tipo, item.id)} className="text-blue-800"><RefreshCw size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
