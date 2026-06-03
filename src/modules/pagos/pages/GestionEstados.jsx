import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Trash2, Plus, RefreshCw, Archive, X, Pencil, Check } from 'lucide-react';

export default function GestionEstados() {
    const [estados, setEstados] = useState([]);
    const [inactivos, setInactivos] = useState([]);
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [mostrarPapelera, setMostrarPapelera] = useState(false);
    
    // Estados para edición en línea
    const [editandoId, setEditandoId] = useState(null);
    const [valorEditado, setValorEditado] = useState('');

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async () => {
        try {
            const { data } = await apiService.get('/pagos/estados');
            // Como no tenemos un endpoint separado para inactivos, filtraremos aquí o asumimos que necesitamos otro endpoint.
            // Para mantener la consistencia con el backend ya creado, filtramos los activos:
            setEstados(data.filter(e => e.is_active));
            setInactivos(data.filter(e => !e.is_active));
        } catch (error) { toast.error('Error al cargar estados'); }
    };

    const handleCrear = async () => {
        if (!nuevoEstado.trim()) return;
        try {
            await apiService.post(`/pagos/estados`, { nombre: nuevoEstado });
            toast.success('Estado creado');
            fetchDatos();
            setNuevoEstado('');
        } catch (error) { toast.error('Error al crear estado'); }
    };

    const iniciarEdicion = (id, nombre) => {
        setEditandoId(id);
        setValorEditado(nombre);
    };

    const guardarEdicion = async () => {
        if (!valorEditado.trim()) return;
        try {
            await apiService.patch(`/pagos/estados/${editandoId}`, { nombre: valorEditado });
            toast.success('Actualizado');
            setEditandoId(null);
            fetchDatos();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Archivar este estado?')) return;
        try {
            await apiService.delete(`/pagos/estados/${id}`);
            toast.success('Estado archivado');
            fetchDatos();
        } catch (error) { toast.error('Error al archivar'); }
    };

    const handleRecuperar = async (id) => {
        try {
            await apiService.patch(`/pagos/estados/${id}/recuperar`);
            toast.success('Estado recuperado');
            fetchDatos();
        } catch (error) { toast.error('Error al recuperar'); }
    };

    return (
        <div className="space-y-8 font-mono text-[#1a1a1a] max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#2d4a3e] pb-2">
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#2d4a3e]">Gestión de Estados (PDP)</h2>
                <button onClick={() => setMostrarPapelera(!mostrarPapelera)} className="bg-[#2d4a3e] text-[#e0dcc8] px-4 py-2 text-xs font-bold uppercase flex items-center gap-2">
                    <Archive size={16}/> {mostrarPapelera ? 'Cerrar Papelera' : 'Ver Papelera'}
                </button>
            </div>
            
            <div className="bg-[#e0dcc8] p-4 border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e]">
                <div className="flex gap-2 mb-4">
                    <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" placeholder="Nuevo estado..." value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} />
                    <button onClick={handleCrear} className="bg-[#2d4a3e] text-[#e0dcc8] px-2"><Plus size={16}/></button>
                </div>
                <ul className="space-y-2">
                    {estados.map(e => (
                        <li key={e.id} className="flex justify-between items-center text-xs border-b border-[#2d4a3e]/30 p-1">
                            {editandoId === e.id ? (
                                <div className="flex gap-1 flex-1">
                                    <input className="bg-transparent border-b border-[#2d4a3e] p-1 flex-1 text-xs" value={valorEditado} onChange={e => setValorEditado(e.target.value)} />
                                    <button onClick={guardarEdicion} className="text-[#2d4a3e]"><Check size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    {e.nombre}
                                    <div className="flex gap-1">
                                        <button onClick={() => iniciarEdicion(e.id, e.nombre)} className="text-[#2d4a3e]"><Pencil size={14}/></button>
                                        <button onClick={() => handleEliminar(e.id)} className="text-red-800"><Trash2 size={14}/></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {mostrarPapelera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-[#e0dcc8] p-6 border border-[#2d4a3e] shadow-[8px_8px_0px_0px_#2d4a3e] w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4 border-b border-[#2d4a3e] pb-2">
                            <h3 className="font-bold uppercase">Papelera (Estados Archivados)</h3>
                            <button onClick={() => setMostrarPapelera(false)}><X size={16}/></button>
                        </div>
                        <ul className="text-xs">
                            {inactivos.map(e => (
                                <li key={e.id} className="flex justify-between mb-1">{e.nombre} <button onClick={() => handleRecuperar(e.id)} className="text-blue-800"><RefreshCw size={12}/></button></li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
