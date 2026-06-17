import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Trash2, Plus, RefreshCw, Archive, X, Pencil, Check } from 'lucide-react';

export default function GestionEstadosYGrupos() {
    const [datos, setDatos] = useState({ 
        estados: [], grupos: [], acreedores: [] 
    });
    const [datosInactivos, setDatosInactivos] = useState({ 
        estados: [], grupos: [], acreedores: [] 
    });
    
    const [nuevos, setNuevos] = useState({ estado: '', grupo: '', acreedor: { nombre: '', nit: '', banco: '', cuenta: '' } });
    const [mostrarPapelera, setMostrarPapelera] = useState(false);
    const [editando, setEditando] = useState({ id: null, tipo: null, valor: '', nit: '', banco: '', cuenta: '' });

    useEffect(() => { fetchDatos(); }, []);

    const fetchDatos = async () => {
        try {
            const [est, gru, acr, inactEst, inactGru, inactAcr] = await Promise.all([
                apiService.get('/pagos/estados'),
                apiService.get('/core/grupos'),
                apiService.get('/core/acreedores'),
                apiService.get('/pagos/estados/inactivas'),
                apiService.get('/core/grupos/inactivas'),
                apiService.get('/core/acreedores/inactivas')
            ]);
            setDatos({ 
                estados: est.data, 
                grupos: gru.data,
                acreedores: acr.data
            });
            setDatosInactivos({
                estados: inactEst.data,
                grupos: inactGru.data,
                acreedores: inactAcr.data
            });
        } catch (error) { toast.error('Error al cargar datos'); }
    };

    const handleCrear = async (tipo, data) => {
        try {
            if(tipo === 'estados') await apiService.post(`/pagos/estados`, { nombre: data });
            else if(tipo === 'grupos') await apiService.post(`/core/grupos`, { nombre: data });
            else if(tipo === 'acreedores') {
                if (!data.nombre.trim() || !data.nit.trim()) return toast.error('Nombre y NIT son obligatorios');
                await apiService.post(`/core/acreedores`, data);
            }
            
            toast.success('Creado');
            fetchDatos();
            if (tipo === 'acreedores') setNuevos({...nuevos, acreedor: { nombre: '', nit: '', banco: '', cuenta: '' }});
            else setNuevos({...nuevos, [tipo.slice(0,-1)]: ''});
        } catch (error) { toast.error('Error al crear'); }
    };

    const iniciarEdicion = (tipo, item) => setEditando({ id: item.id, tipo, valor: item.nombre, nit: item.nit || '', banco: item.banco || '', cuenta: item.cuenta || '' });

    const guardarEdicion = async () => {
        if (!editando.valor.trim()) return;
        try {
            if(editando.tipo === 'estados') await apiService.patch(`/pagos/estados/${editando.id}`, { nombre: editando.valor });
            else if(editando.tipo === 'grupos') await apiService.patch(`/core/grupos/${editando.id}`, { nombre: editando.valor });
            else if(editando.tipo === 'acreedores') await apiService.patch(`/core/acreedores/${editando.id}`, { nombre: editando.valor, nit: editando.nit, banco: editando.banco, cuenta: editando.cuenta });
            
            toast.success('Actualizado');
            setEditando({ id: null, tipo: null, valor: '', nit: '', banco: '', cuenta: '' });
            fetchDatos();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const handleEliminar = async (tipo, id) => {
        if (!confirm('¿Archivar?')) return;
        try {
            if(tipo === 'estados') await apiService.delete(`/pagos/estados/${id}`);
            else if(tipo === 'grupos') await apiService.delete(`/core/grupos/${id}`);
            else if(tipo === 'acreedores') await apiService.delete(`/core/acreedores/${id}`);
            toast.success('Archivado');
            fetchDatos();
        } catch (error) { toast.error('Error al archivar'); }
    };

    const handleRecuperar = async (tipo, id) => {
        try {
            if (tipo === 'estados') await apiService.patch(`/pagos/estados/${id}/recuperar`);
            else await apiService.patch(`/core/${tipo}/${id}/recuperar`);
            
            toast.success('Recuperado');
            await fetchDatos();
        } catch (error) { toast.error('Error al recuperar'); }
    };

    const renderColumn = (titulo, tipo, items, keyField, labelField) => (
        <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] flex-1">
            <h3 className="font-bold uppercase mb-4 text-[#2d4a3e]">{titulo}</h3>
            {tipo !== 'estados' && (
                <div className="mb-4">
                    {tipo === 'acreedores' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" placeholder="Nombre" value={nuevos.acreedor.nombre} onChange={e => setNuevos({...nuevos, acreedor: {...nuevos.acreedor, nombre: e.target.value}})} />
                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" placeholder="NIT" value={nuevos.acreedor.nit} onChange={e => setNuevos({...nuevos, acreedor: {...nuevos.acreedor, nit: e.target.value}})} />
                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" placeholder="Banco" value={nuevos.acreedor.banco} onChange={e => setNuevos({...nuevos, acreedor: {...nuevos.acreedor, banco: e.target.value}})} />
                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" placeholder="Cuenta" value={nuevos.acreedor.cuenta} onChange={e => setNuevos({...nuevos, acreedor: {...nuevos.acreedor, cuenta: e.target.value}})} />
                            <button onClick={() => handleCrear(tipo, nuevos.acreedor)} className="bg-[#2d4a3e] text-[#e0dcc8] col-span-2 py-1"><Plus size={16}/></button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" placeholder={`Nuevo...`} value={nuevos[tipo.slice(0,-1)]} onChange={e => setNuevos({...nuevos, [tipo.slice(0,-1)]: e.target.value})} />
                            <button onClick={() => handleCrear(tipo, nuevos[tipo.slice(0,-1)])} className="bg-[#2d4a3e] text-[#e0dcc8] px-2"><Plus size={16}/></button>
                        </div>
                    )}
                </div>
            )}
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item[keyField]} className="border-b border-[#2d4a3e]/30 p-1">
                        {editando.id === item[keyField] && editando.tipo === tipo ? (
                            <div className="flex flex-col gap-2 bg-[#d8d4c2] p-2 border border-[#2d4a3e]">
                                {tipo === 'acreedores' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-bold uppercase">Nombre</label>
                                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" value={editando.valor} onChange={e => setEditando({...editando, valor: e.target.value})} />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-bold uppercase">NIT</label>
                                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" value={editando.nit} onChange={e => setEditando({...editando, nit: e.target.value})} />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-bold uppercase">Banco</label>
                                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" value={editando.banco} onChange={e => setEditando({...editando, banco: e.target.value})} />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-bold uppercase">Cuenta</label>
                                            <input className="bg-transparent border-b border-[#2d4a3e] p-1 text-xs" value={editando.cuenta} onChange={e => setEditando({...editando, cuenta: e.target.value})} />
                                        </div>
                                    </div>
                                ) : (
                                    <input className="bg-transparent border-b border-[#2d4a3e] p-1 w-full text-xs" value={editando.valor} onChange={e => setEditando({...editando, valor: e.target.value})} />
                                )}
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditando({ id: null, tipo: null, valor: '', nit: '', banco: '', cuenta: '' })} className="text-red-800 text-[10px] uppercase font-bold">Cancelar</button>
                                    <button onClick={guardarEdicion} className="bg-[#2d4a3e] text-[#e0dcc8] px-2 py-0.5 text-[10px] uppercase font-bold flex items-center gap-1"><Check size={12}/> Guardar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="font-bold">{item[labelField]}</span>
                                    {tipo === 'acreedores' && <span className="text-[9px] opacity-70">NIT: {item.nit} | {item.banco} - {item.cuenta}</span>}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => iniciarEdicion(tipo, item)} className="text-[#2d4a3e] hover:bg-[#2d4a3e]/10 p-1"><Pencil size={14}/></button>
                                    <button onClick={() => handleEliminar(tipo, item[keyField])} className="text-red-800 hover:bg-red-100 p-1"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="space-y-8 font-mono text-[#1a1a1a] max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#2d4a3e] pb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Gestión de Pagos</h2>
                <button onClick={() => setMostrarPapelera(!mostrarPapelera)} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase flex items-center gap-2">
                    <Archive size={16}/> {mostrarPapelera ? 'Cerrar Papelera' : 'Ver Papelera'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderColumn('Estados', 'estados', datos.estados, 'id', 'nombre')}
                {renderColumn('Grupos', 'grupos', datos.grupos, 'id', 'nombre')}
                {renderColumn('Acreedores', 'acreedores', datos.acreedores, 'id', 'nombre')}
            </div>

            {mostrarPapelera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4 border-b border-[#2d4a3e] pb-2">
                            <h3 className="font-bold uppercase">Papelera</h3>
                            <button onClick={() => setMostrarPapelera(false)}><X size={16}/></button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                            {['estados', 'grupos', 'acreedores'].map(tipo => (
                                <div key={tipo}>
                                    <h4 className="font-bold mb-2 uppercase">{tipo}</h4>
                                    {datosInactivos[tipo].map(item => (
                                        <div key={item.id} className="flex justify-between mb-1">{item.nombre} <button onClick={() => handleRecuperar(tipo, item.id)} className="text-blue-800"><RefreshCw size={12}/></button></div>
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
