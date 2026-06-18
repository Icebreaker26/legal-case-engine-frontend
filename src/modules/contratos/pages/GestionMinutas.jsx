import { useState, useEffect, useRef } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import {
    Plus, Edit, Trash2, X, Eye, RotateCcw, FileText,
    Tag, AlignLeft, Type, Search, Archive, ChevronRight,
    CheckCircle, Calendar, User
} from 'lucide-react';

const TIPOS_CONTRATO = [
    'Prestación de Servicios',
    'Suministro',
    'Obra Civil',
    'Arrendamiento',
    'Confidencialidad',
    'Marco Comercial',
    'Compraventa',
    'Otro',
];

function Label({ icon, children, required }) {
    return (
        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            {icon}
            {children}
            {required && <span className="text-pink-500 ml-0.5">*</span>}
        </label>
    );
}

function FieldInput({ ...props }) {
    return (
        <input
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all placeholder:text-gray-400"
            {...props}
        />
    );
}

// ── Modal reutilizable ──────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="font-black text-gray-800 text-lg">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ── Formulario de minuta ────────────────────────────────────────────────────
function MinutaForm({ inicial, onSave, onCancel, loading }) {
    const [form, setForm] = useState(
        inicial || { titulo: '', descripcion: '', tipo_contrato: '', contenido_texto: '' }
    );
    const charCount = form.contenido_texto?.length || 0;

    const set = (campo, val) => setForm(f => ({ ...f, [campo]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.titulo.trim()) return toast.error('El título es obligatorio');
        if (!form.tipo_contrato) return toast.error('Selecciona el tipo de contrato');
        if (!form.contenido_texto.trim()) return toast.error('El contenido no puede estar vacío');
        onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
                <Label icon={<Type size={12} />} required>Título de la minuta</Label>
                <FieldInput
                    placeholder="Ej: Minuta Estándar de Prestación de Servicios v2.0"
                    value={form.titulo}
                    onChange={e => set('titulo', e.target.value)}
                    required
                />
            </div>

            {/* Descripción */}
            <div>
                <Label icon={<AlignLeft size={12} />}>Descripción breve</Label>
                <FieldInput
                    placeholder="Describe el propósito y alcance de esta minuta..."
                    value={form.descripcion}
                    onChange={e => set('descripcion', e.target.value)}
                />
            </div>

            {/* Tipo de contrato — pills seleccionables */}
            <div>
                <Label icon={<Tag size={12} />} required>Tipo de contrato</Label>
                <div className="flex flex-wrap gap-2">
                    {TIPOS_CONTRATO.map(tipo => (
                        <button
                            key={tipo}
                            type="button"
                            onClick={() => set('tipo_contrato', tipo)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                form.tipo_contrato === tipo
                                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-pink-300 hover:text-pink-600'
                            }`}
                        >
                            {tipo}
                        </button>
                    ))}
                </div>
                {form.tipo_contrato && (
                    <p className="mt-2 text-[11px] text-pink-600 font-bold flex items-center gap-1">
                        <CheckCircle size={11} /> {form.tipo_contrato} seleccionado
                    </p>
                )}
            </div>

            {/* Contenido */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label icon={<FileText size={12} />} required>Contenido de la minuta</Label>
                    <span className="text-[11px] text-gray-400">{charCount.toLocaleString()} caracteres</span>
                </div>
                <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all resize-y font-mono leading-relaxed min-h-[240px]"
                    placeholder="Pega aquí el texto completo de la minuta estándar...

CLÁUSULA PRIMERA – OBJETO
...

CLÁUSULA SEGUNDA – OBLIGACIONES
..."
                    value={form.contenido_texto}
                    onChange={e => set('contenido_texto', e.target.value)}
                    required
                />
                <p className="mt-1.5 text-[11px] text-gray-400">
                    Este texto será usado como referencia para comparar contratos de terceros.
                </p>
            </div>

            {/* Acciones */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    <CheckCircle size={16} />
                    {loading ? 'Guardando...' : (inicial?.id ? 'Guardar Cambios' : 'Crear Minuta')}
                </button>
            </div>
        </form>
    );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function GestionMinutas() {
    const [minutas, setMinutas] = useState([]);
    const [papelera, setPapelera] = useState([]);
    const [saving, setSaving] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    // Modals
    const [modalForm, setModalForm] = useState(null);   // null | 'nueva' | minuta (para editar)
    const [modalDetalle, setModalDetalle] = useState(null);
    const [modalPapelera, setModalPapelera] = useState(false);

    useEffect(() => { fetchMinutas(); fetchPapelera(); }, []);

    const fetchMinutas = async () => {
        try {
            const { data } = await apiService.get('/contratos/minutas');
            setMinutas(data);
        } catch { toast.error('Error al cargar minutas'); }
    };

    const fetchPapelera = async () => {
        try {
            const { data } = await apiService.get('/contratos/minutas/papelera');
            setPapelera(data);
        } catch { toast.error('Error al cargar papelera'); }
    };

    const handleSave = async (form) => {
        setSaving(true);
        try {
            if (form.id) {
                await apiService.patch(`/contratos/minutas/${form.id}`, form);
                toast.success('Minuta actualizada');
            } else {
                await apiService.post('/contratos/minutas', form);
                toast.success('Minuta creada correctamente');
            }
            setModalForm(null);
            fetchMinutas();
        } catch { toast.error('Error al guardar'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Archivar esta minuta? Podrás restaurarla desde la papelera.')) return;
        try {
            await apiService.delete(`/contratos/minutas/${id}`);
            toast.success('Minuta archivada');
            fetchMinutas();
            fetchPapelera();
        } catch { toast.error('Error al archivar'); }
    };

    const handleRestore = async (id) => {
        try {
            await apiService.patch(`/contratos/minutas/${id}/restaurar`);
            toast.success('Minuta restaurada');
            fetchMinutas();
            fetchPapelera();
        } catch { toast.error('Error al restaurar'); }
    };

    const handleForceDelete = async (id) => {
        if (!confirm('¿Eliminar permanentemente? Esta acción no se puede deshacer.')) return;
        try {
            await apiService.delete(`/contratos/minutas/${id}/definitivo`);
            toast.success('Minuta eliminada');
            fetchPapelera();
        } catch { toast.error('Error al borrar'); }
    };

    const handleVerDetalle = async (id) => {
        try {
            const { data } = await apiService.get(`/contratos/minutas/${id}`);
            setModalDetalle(data);
        } catch { toast.error('Error al cargar detalle'); }
    };

    const minutasFiltradas = minutas.filter(m =>
        !busqueda ||
        m.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.tipo_contrato?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Minutas Estándar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Biblioteca de contratos de referencia para auditoría</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setModalPapelera(true)}
                        className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:border-red-200 hover:text-red-500 transition-colors"
                    >
                        <Archive size={16} />
                        Papelera
                        {papelera.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                {papelera.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setModalForm('nueva')}
                        className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} /> Nueva Minuta
                    </button>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por título o tipo..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-pink-500 transition-shadow"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
                {busqueda && (
                    <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Lista */}
            {minutasFiltradas.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FileText size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="font-bold text-gray-400">
                        {busqueda ? 'No hay minutas con ese criterio' : 'No hay minutas registradas'}
                    </p>
                    {!busqueda && (
                        <button onClick={() => setModalForm('nueva')} className="mt-3 text-sm text-pink-600 hover:underline">
                            Crear la primera minuta
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {minutasFiltradas.map(m => (
                        <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-pink-200 transition-all group flex flex-col">
                            {/* Tipo badge */}
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-50 text-pink-600 border border-pink-100">
                                    {m.tipo_contrato || 'Sin tipo'}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setModalForm(m)}
                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Editar"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(m.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Archivar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-800 leading-snug mb-1 group-hover:text-pink-600 transition-colors line-clamp-2">
                                {m.titulo}
                            </h3>

                            {m.descripcion && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{m.descripcion}</p>
                            )}

                            <div className="mt-auto pt-3 border-t border-gray-50 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-gray-400">
                                    <span className="flex items-center gap-1"><User size={10} /> {m.creado_por_nombre || 'N/A'}</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                {m.contenido_texto && (
                                    <p className="text-[11px] text-gray-400">
                                        {m.contenido_texto.length.toLocaleString()} caracteres
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={() => handleVerDetalle(m.id)}
                                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 transition-all"
                            >
                                <Eye size={13} /> Ver contenido completo <ChevronRight size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal: Crear / Editar ── */}
            <Modal
                open={!!modalForm}
                onClose={() => setModalForm(null)}
                title={modalForm === 'nueva' ? 'Nueva Minuta Estándar' : 'Editar Minuta'}
                maxWidth="max-w-3xl"
            >
                <MinutaForm
                    inicial={modalForm === 'nueva' ? null : modalForm}
                    onSave={handleSave}
                    onCancel={() => setModalForm(null)}
                    loading={saving}
                />
            </Modal>

            {/* ── Modal: Ver contenido ── */}
            <Modal
                open={!!modalDetalle}
                onClose={() => setModalDetalle(null)}
                title={modalDetalle?.titulo || ''}
            >
                {modalDetalle && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 text-xs">
                            <span className="px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 font-bold border border-pink-100">
                                {modalDetalle.tipo_contrato}
                            </span>
                            <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center gap-1">
                                <Calendar size={11} /> {new Date(modalDetalle.created_at).toLocaleDateString('es-CO')}
                            </span>
                            <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center gap-1">
                                <User size={11} /> {modalDetalle.creado_por_nombre || 'N/A'}
                            </span>
                        </div>
                        {modalDetalle.descripcion && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                {modalDetalle.descripcion}
                            </p>
                        )}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contenido</span>
                                <span className="text-[11px] text-gray-400">{modalDetalle.contenido_texto?.length?.toLocaleString()} caracteres</span>
                            </div>
                            <pre className="p-5 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto bg-white">
                                {modalDetalle.contenido_texto}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Modal: Papelera ── */}
            <Modal open={modalPapelera} onClose={() => setModalPapelera(false)} title="Papelera de Reciclaje">
                {papelera.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Archive size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">La papelera está vacía</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {papelera.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-700 text-sm">{m.titulo}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{m.tipo_contrato}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVerDetalle(m.id)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors" title="Ver">
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={() => handleRestore(m.id)} className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Restaurar">
                                        <RotateCcw size={16} />
                                    </button>
                                    <button onClick={() => handleForceDelete(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Eliminar permanentemente">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
