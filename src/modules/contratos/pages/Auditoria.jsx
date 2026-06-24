import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Upload, FileText, Building2, ClipboardList,
    CheckCircle, X, File, ChevronRight, AlertCircle, Loader2, Plus
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

// ── Modal Nueva Entidad ──────────────────────────────────────────────────────
function ModalNuevaEntidad({ open, onClose, onCreated }) {
    const [nombre, setNombre] = useState('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) { setNombre(''); setTimeout(() => inputRef.current?.focus(), 80); }
    }, [open]);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nombreTrim = nombre.trim();
        if (!nombreTrim) return toast.error('El nombre es obligatorio');
        setSaving(true);
        try {
            const { data } = await apiService.post('/core/entidades', { nombre: nombreTrim });
            toast.success(`Entidad "${nombreTrim}" creada`);
            onCreated(nombreTrim);
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear la entidad');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 rounded-xl">
                            <Building2 size={18} className="text-pink-600" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800">Nueva Entidad</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Catálogo de terceros</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={17} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Nombre de la entidad <span className="text-pink-500">*</span>
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all placeholder:text-gray-400"
                            placeholder="Ej: Empresas XYZ S.A.S."
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            required
                        />
                        <p className="mt-1.5 text-[11px] text-gray-400">
                            Quedará disponible en todos los módulos del sistema.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving || !nombre.trim()} className="flex-1 py-3 rounded-xl bg-pink-600 text-white text-sm font-bold hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {saving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : <><Building2 size={15} /> Crear Entidad</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Label({ icon, children, required }) {
    return (
        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            {icon}
            {required && <span className="text-pink-500">*</span>}
            {children}
        </label>
    );
}

function StepIndicator({ step, label, active, done }) {
    return (
        <div className={`flex items-center gap-2 ${active ? 'text-pink-600' : done ? 'text-green-600' : 'text-gray-300'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${
                done ? 'bg-green-600 border-green-600 text-white'
                : active ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-gray-200 text-gray-300 bg-white'
            }`}>
                {done ? <CheckCircle size={14} /> : step}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">{label}</span>
        </div>
    );
}

function StepDivider({ done }) {
    return <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${done ? 'bg-green-300' : 'bg-gray-100'}`} />;
}

export default function Auditoria() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const puedeCriarCatalogos = hasPermission('supervisor', 'WRITE') || hasPermission('admin', 'WRITE');
    const fileInputRef = useRef(null);
    const [minutas, setMinutas] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [modalEntidad, setModalEntidad] = useState(false);

    const [form, setForm] = useState({
        minutaEstandarId: '',
        tercero_id: '',
        file: null,
    });

    // Minuta seleccionada (objeto completo para preview)
    const minutaSeleccionada = minutas.find(m => m.id === form.minutaEstandarId) || null;
    const entidadSeleccionada = entidades.find(e => String(e.id) === String(form.tercero_id)) || null;

    // Progreso del formulario para el indicador de pasos
    const paso1Ok = !!form.minutaEstandarId;
    const paso2Ok = !!form.tercero_id;
    const paso3Ok = !!form.file;
    const pasoActual = !paso1Ok ? 1 : !paso2Ok ? 2 : !paso3Ok ? 3 : 4;

    const cargarEntidades = async () => {
        const { data: e } = await apiService.get('/core/entidades');
        setEntidades(e);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [{ data: m }, { data: e }] = await Promise.all([
                    apiService.get('/contratos/minutas'),
                    apiService.get('/core/entidades'),
                ]);
                setMinutas(m);
                setEntidades(e);
            } catch {
                toast.error('Error al cargar datos');
            } finally {
                setLoadingData(false);
            }
        };
        load();
    }, []);

    const handleEntidadCreada = async (nombre) => {
        await cargarEntidades();
        // Seleccionar automáticamente la entidad recién creada
        const { data: actualizadas } = await apiService.get('/core/entidades');
        setEntidades(actualizadas);
        const nueva = actualizadas.find(e => e.nombre === nombre);
        if (nueva) setForm(f => ({ ...f, tercero_id: String(nueva.id) }));
    };

    const handleFile = (file) => {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'doc', 'docx'].includes(ext)) {
            return toast.error('Solo se aceptan archivos PDF o DOCX');
        }
        if (file.size > 10 * 1024 * 1024) {
            return toast.error('El archivo no puede superar 10 MB');
        }
        setForm(f => ({ ...f, file }));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.minutaEstandarId || !form.tercero_id || !form.file) {
            return toast.error('Completa los tres pasos antes de continuar');
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('minutaEstandarId', form.minutaEstandarId);
            fd.append('file', form.file);

            const { data: comparacion } = await apiService.post('/contratos/auditorias/comparar', fd);

            const { data: auditoria } = await apiService.post('/contratos/auditorias', {
                minuta_estandar_id: form.minutaEstandarId,
                tercero_id: parseInt(form.tercero_id),
                prompt_generado: comparacion.prompt,
                contenido_tercero_texto: comparacion.contenido_tercero_texto,
            });

            toast.success('Auditoría iniciada correctamente');
            navigate(`/contratos/auditoria/${auditoria.id}`);
        } catch {
            toast.error('Error al iniciar la auditoría');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Back */}
            <button
                onClick={() => navigate('/contratos')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-pink-600 mb-6 transition-colors"
            >
                <ArrowLeft size={16} /> Volver al Dashboard
            </button>

            {/* Título */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-800">Nueva Auditoría Contractual</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Compara el contrato de un tercero contra tu minuta estándar y genera un informe de riesgo legal.
                </p>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <StepIndicator step={1} label="Minuta" active={pasoActual === 1} done={paso1Ok} />
                <StepDivider done={paso1Ok} />
                <StepIndicator step={2} label="Tercero" active={pasoActual === 2} done={paso2Ok} />
                <StepDivider done={paso2Ok} />
                <StepIndicator step={3} label="Documento" active={pasoActual === 3} done={paso3Ok} />
                <StepDivider done={paso3Ok} />
                <StepIndicator step={4} label="Listo" active={pasoActual === 4} done={false} />
            </div>

            {loadingData ? (
                <div className="flex items-center justify-center py-20 gap-3">
                    <Loader2 size={22} className="animate-spin text-pink-600" />
                    <span className="text-sm text-gray-400">Cargando datos...</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── Paso 1: Minuta ── */}
                    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${paso1Ok ? 'border-green-200' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${paso1Ok ? 'bg-green-600 text-white' : 'bg-pink-600 text-white'}`}>
                                {paso1Ok ? <CheckCircle size={13} /> : '1'}
                            </div>
                            <Label icon={<ClipboardList size={12} />} required>Minuta estándar de referencia</Label>
                        </div>

                        <SearchableSelect
                            options={minutas.map(m => ({
                                value: m.id,
                                label: m.titulo,
                                sub: m.tipo_contrato,
                            }))}
                            value={form.minutaEstandarId}
                            onChange={v => setForm(f => ({ ...f, minutaEstandarId: v }))}
                            placeholder="Selecciona la minuta de referencia..."
                            noResultsText="No hay minutas con ese nombre"
                        />

                        {minutaSeleccionada && (
                            <div className="mt-3 flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                <CheckCircle size={15} className="text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-green-800">{minutaSeleccionada.titulo}</p>
                                    {minutaSeleccionada.descripcion && (
                                        <p className="text-[11px] text-green-600 mt-0.5 line-clamp-1">{minutaSeleccionada.descripcion}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Paso 2: Tercero ── */}
                    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${paso2Ok ? 'border-green-200' : paso1Ok ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${paso2Ok ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {paso2Ok ? <CheckCircle size={13} /> : '2'}
                                </div>
                                <Label icon={<Building2 size={12} />} required>Entidad tercera</Label>
                            </div>
                            {puedeCriarCatalogos && (
                                <button
                                    type="button"
                                    onClick={() => setModalEntidad(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-colors border border-pink-200 hover:border-pink-300"
                                >
                                    <Plus size={13} /> Nueva entidad
                                </button>
                            )}
                        </div>

                        <SearchableSelect
                            options={entidades.map(e => ({
                                value: e.id,
                                label: e.nombre,
                            }))}
                            value={form.tercero_id}
                            onChange={v => setForm(f => ({ ...f, tercero_id: v }))}
                            placeholder="Selecciona la entidad contratante..."
                            disabled={!paso1Ok}
                            noResultsText="No hay entidades con ese nombre"
                        />

                        {entidadSeleccionada && (
                            <div className="mt-3 flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                <CheckCircle size={15} className="text-green-600 shrink-0" />
                                <p className="text-xs font-bold text-green-800">{entidadSeleccionada.nombre}</p>
                            </div>
                        )}
                    </div>

                    {/* ── Paso 3: Documento ── */}
                    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${paso3Ok ? 'border-green-200' : paso2Ok ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${paso3Ok ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {paso3Ok ? <CheckCircle size={13} /> : '3'}
                            </div>
                            <Label icon={<FileText size={12} />} required>Contrato del tercero</Label>
                        </div>

                        {!form.file ? (
                            <div
                                onDragOver={e => { e.preventDefault(); if (paso2Ok) setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={paso2Ok ? handleDrop : undefined}
                                onClick={() => paso2Ok && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                    !paso2Ok ? 'cursor-not-allowed border-gray-100'
                                    : isDragging ? 'border-pink-400 bg-pink-50 cursor-copy'
                                    : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50 cursor-pointer'
                                }`}
                            >
                                <Upload size={28} className={`mx-auto mb-3 ${isDragging ? 'text-pink-500' : 'text-gray-300'}`} />
                                <p className="text-sm font-bold text-gray-500">
                                    {isDragging ? 'Suelta el archivo aquí' : 'Arrastra el archivo aquí'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionarlo</p>
                                <p className="text-[11px] text-gray-300 mt-3">PDF, DOC o DOCX · Máx. 10 MB</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={e => handleFile(e.target.files[0])}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <File size={22} className="text-green-700" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-green-800 text-sm truncate">{form.file.name}</p>
                                    <p className="text-[11px] text-green-600 mt-0.5">
                                        {(form.file.size / 1024).toFixed(0)} KB · {form.file.name.split('.').pop().toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, file: null }))}
                                    className="p-1.5 rounded-lg hover:bg-green-200 text-green-600 transition-colors shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Aviso de procesamiento ── */}
                    {pasoActual === 4 && (
                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700">
                                El sistema extraerá el texto del documento, calculará las diferencias con la minuta y generará el prompt de análisis. Serás redirigido automáticamente al detalle de la auditoría.
                            </p>
                        </div>
                    )}

                    {/* ── Submit ── */}
                    <button
                        type="submit"
                        disabled={loading || pasoActual < 4}
                        className="w-full flex items-center justify-center gap-2 bg-pink-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Procesando documento...</>
                        ) : (
                            <><ChevronRight size={18} /> Iniciar Auditoría</>
                        )}
                    </button>
                </form>
            )}

            <ModalNuevaEntidad
                open={modalEntidad}
                onClose={() => setModalEntidad(false)}
                onCreated={handleEntidadCreada}
            />
        </div>
    );
}
