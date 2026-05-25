import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  ShieldCheck,
  FileText,
  ChevronRight,
  Bookmark,
  CheckCircle,
  AlertCircle,
  History,
  Send,
  Building,
  X,
  Maximize2,
  Trash2,
  Edit
} from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import toast from 'react-hot-toast';

export default function DetalleTutela() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutela, setTutela] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSugerencias, setLoadingSugerencias] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Estado para el modal de documento completo
  const [modalOpen, setModalOpen] = useState(false);
  const [documentoCompleto, setDocumentoCompleto] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docTitulo, setDocTitulo] = useState('');
  
  // Estados para edición y eliminación
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ radicado: '', accionante: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const renderFormattedText = (text) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (/^\d+\./.test(trimmedLine)) {
        return <p key={index} className="font-bold text-gray-900 mt-6 mb-2">{line}</p>;
      }
      if (trimmedLine.length > 5 && trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.match(/^\d/)) {
        return <p key={index} className="font-bold text-gray-900 mt-6 mb-2">{line}</p>;
      }
      if (trimmedLine.endsWith(':')) {
        return <p key={index} className="font-semibold text-gray-800 mt-4">{line}</p>;
      }
      return <p key={index} className="mb-4">{line || <br />}</p>;
    });
  };

  // Estado para la nueva acción
  const [nuevaAccion, setNuevaAccion] = useState({
    accion: '',
    area_involucrada: '',
    responsable_nombre: 'Alejandro Marín',
    dias_seguimiento: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const allTutelas = await tutelaService.listar();
      const found = allTutelas.find(t => t.id === id);
      
      if (!found) {
        toast.error('Tutela no encontrada');
        navigate('/');
        return;
      }
      
      setTutela(found);
      
      const [sugs, logs] = await Promise.all([
        tutelaService.obtenerSugerencias(id).catch(() => []),
        tutelaService.obtenerHistorial(id).catch(() => [])
      ]);

      setSugerencias(sugs);
      setHistorial(logs);

    } catch (error) {
      toast.error('Error al cargar la información');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingSugerencias(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateDatos = async () => {
    try {
        await tutelaService.actualizarDatos(id, editForm);
        toast.success('Datos actualizados');
        setIsEditing(false);
        setTutela({...tutela, ...editForm});
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const handleVerDocumentoCompleto = async (sug) => {
    if (!sug.documento_id) {
        toast.error('Esta sugerencia no tiene referencia al documento original');
        return;
    }

    setLoadingDoc(true);
    setDocTitulo(sug.titulo_referencia);
    setModalOpen(true);
    try {
        const data = await tutelaService.obtenerDocumentoReferencia(sug.documento_id);
        setDocumentoCompleto(data.texto_completo);
    } catch (error) {
        toast.error('No se pudo recuperar el documento completo');
        setModalOpen(false);
    } finally {
        setLoadingDoc(false);
    }
  };

  const handleDelete = async (confirmRadicado) => {
    if (confirmRadicado !== tutela.radicado) {
      toast.error('El radicado no coincide');
      return;
    }
    setUpdating(true);
    try {
      await tutelaService.eliminar(id);
      toast.success('Tutela eliminada correctamente');
      navigate('/');
    } catch (error) {
      toast.error('Error al eliminar la tutela');
    } finally {
      setUpdating(false);
      setDeleteModalOpen(false);
    }
  };

  const handleUpdateStatus = async (nuevoEstado) => {
    if (nuevoEstado === tutela.estado) return;
    setUpdating(true);
    try {
      await tutelaService.actualizar(id, { estado: nuevoEstado });
      
      const log = await tutelaService.agregarAccion(id, {
        accion: `Estado cambiado a: ${nuevoEstado}`,
        area_involucrada: 'Jurídica',
        responsable_nombre: nuevaAccion.responsable_nombre
      });

      setTutela({ ...tutela, estado: nuevoEstado });
      setHistorial([log, ...historial]);
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch (error) {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!nuevaAccion.accion.trim()) return;

    setUpdating(true);
    try {
      let fecha_seguimiento = null;
      if (nuevaAccion.dias_seguimiento) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(nuevaAccion.dias_seguimiento));
        fecha_seguimiento = date.toISOString().split('T')[0];
      }

      const log = await tutelaService.agregarAccion(id, {
        ...nuevaAccion,
        fecha_seguimiento
      });

      setHistorial([log, ...historial]);
      setNuevaAccion({ ...nuevaAccion, accion: '', area_involucrada: '', dias_seguimiento: '' });
      toast.success('Gestión registrada correctamente');
    } catch (error) {
      toast.error('Error al registrar la acción');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Cargando expediente...</div>;
  if (!tutela) return null;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in relative">
      
      {/* Modals */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{docTitulo}</h3>
                        <p className="text-xs text-gray-500 font-medium">Documento Completo de Referencia</p>
                    </div>
                    <button onClick={() => { setModalOpen(false); setDocumentoCompleto(''); }} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-serif text-gray-700 leading-relaxed text-justify bg-white">
                    {loadingDoc ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm italic text-gray-400">Reconstruyendo documento desde la memoria local...</p>
                        </div>
                    ) : (
                        renderFormattedText(documentoCompleto || 'No se pudo cargar el contenido.')
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button onClick={() => { navigator.clipboard.writeText(documentoCompleto); toast.success('Copiado'); }} className="px-6 py-2 bg-[#002E6D] text-white rounded-lg font-bold text-sm hover:bg-[#001d4a] transition-all flex items-center gap-2">
                        Copiar Todo el Documento
                    </button>
                </div>
            </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-red-600 mb-4">¿Eliminar esta tutela?</h2>
            <p className="text-sm text-gray-600 mb-4">Esta acción marcará la tutela como eliminada. Para confirmar, escribe el número de radicado: <strong>{tutela.radicado}</strong></p>
            <input type="text" className="w-full border border-gray-300 p-2 rounded mb-4 font-mono text-sm" value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder="Escribe el radicado aquí" />
            <div className="flex gap-2">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm font-bold">Cancelar</button>
              <button onClick={() => handleDelete(confirmInput)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-bold" disabled={updating}>Confirmar Eliminación</button>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-[#002E6D] font-medium transition-colors">
          <ArrowLeft size={20} /> Volver a la Bandeja
        </button>
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {['Pendiente', 'En Proceso', 'Respondida'].map((estado) => (
            <button key={estado} disabled={updating} onClick={() => handleUpdateStatus(estado)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tutela.estado === estado ? 'bg-white text-[#002E6D] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {estado}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${tutela.prioridad === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              Prioridad {tutela.prioridad}
            </div>
            
            <div className="flex items-center gap-4 mb-4">
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                        <input className="border p-2 rounded text-sm w-full" value={editForm.radicado} onChange={e => setEditForm({...editForm, radicado: e.target.value})} placeholder="Radicado" />
                        <input className="border p-2 rounded text-sm w-full" value={editForm.accionante} onChange={e => setEditForm({...editForm, accionante: e.target.value})} placeholder="Accionante" />
                        <button onClick={handleUpdateDatos} className="bg-green-600 text-white px-3 py-2 rounded text-sm w-full font-bold">Guardar</button>
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">{tutela.radicado}</h2>
                            <p className="text-gray-500 text-sm mb-2">{tutela.accionante}</p>
                        </div>
                        <button onClick={() => { setIsEditing(true); setEditForm({ radicado: tutela.radicado, accionante: tutela.accionante }); }} className="text-gray-400 hover:text-blue-600"><Edit size={16}/></button>
                    </>
                )}
            </div>
            
            <div className="space-y-4">
              <InfoItem icon={<User size={16}/>} label="Responsable" value={tutela.responsable_nombre || 'Sin asignar'} />
              <InfoItem icon={<FileText size={16}/>} label="Derecho" value={tutela.derecho_vulnerado || 'General'} />
              <InfoItem icon={<Clock size={16}/>} label="Vencimiento" value={new Date(tutela.fecha_vencimiento).toLocaleDateString()} />
              <InfoItem icon={<ShieldCheck size={16}/>} label="Estado" value={tutela.estado} />
              <InfoItem icon={<Building size={16}/>} label="Área" value={tutela.area_responsable || 'General'} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <History size={18} className="text-[#002E6D]" /> Registrar Gestión
            </h3>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text"
                  placeholder="Área (ej: Comercial)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={nuevaAccion.area_involucrada}
                  onChange={(e) => setNuevaAccion({...nuevaAccion, area_involucrada: e.target.value})}
                />
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="number"
                    placeholder="Días alerta"
                    title="Días para volver a revisar esta gestión"
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={nuevaAccion.dias_seguimiento}
                    onChange={(e) => setNuevaAccion({...nuevaAccion, dias_seguimiento: e.target.value})}
                  />
                </div>
              </div>
              <textarea 
                rows="3"
                placeholder="Describe la acción realizada..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={nuevaAccion.accion}
                onChange={(e) => setNuevaAccion({...nuevaAccion, accion: e.target.value})}
                required
              ></textarea>
              <button 
                type="submit"
                disabled={updating}
                className="w-full py-2 bg-[#002E6D] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#001d4a] transition-colors"
              >
                <Send size={14} /> Registrar en Trazabilidad
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <History size={18} className="text-gray-400" /> Trazabilidad del Caso
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {historial.length === 0 ? (
                  <p className="text-sm text-gray-400 italic pl-8">No hay registros de gestión aún.</p>
                ) : historial.map((log) => (
                  <div key={log.id} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-7 h-7 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-[#002E6D] uppercase">
                        {log.area_involucrada || 'Gestión'} • {log.responsable_nombre}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="relative">
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {log.accion}
                      </p>
                      {log.fecha_seguimiento && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-md border border-orange-100">
                          <AlertCircle size={10} />
                          REVISAR EL: {new Date(log.fecha_seguimiento).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <FileText size={16} className="text-gray-400" /> Texto del Documento
              </h3>
            </div>
            <div className="p-4">
              <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600 font-serif whitespace-pre-wrap max-h-40 overflow-y-auto">
                {tutela.contenido_original}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bookmark size={20} className="text-[#002E6D]" />
              <h3 className="text-lg font-bold text-gray-800">Sugerencias Sugeridas (IA Local)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingSugerencias ? (
                <div className="col-span-2 p-8 text-center text-gray-400 text-sm italic">Buscando precedentes...</div>
              ) : sugerencias.length > 0 ? (
                sugerencias.map((sug, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-bold text-[#002E6D] uppercase tracking-wider block mb-2">{sug.categoria}</span>
                    <h4 className="font-bold text-gray-800 text-sm mb-2">{sug.titulo_referencia}</h4>
                    <p className="text-sm text-gray-500 italic mb-4">"{sug.contenido_legal}"</p>
                    <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(sug.contenido_legal);
                            toast.success('Copiado');
                          }}
                          className="text-[#002E6D] text-[11px] font-bold flex items-center gap-1 hover:underline"
                        >
                          Copiar Argumento <ChevronRight size={12} />
                        </button>
                        {sug.documento_id && (
                            <button 
                              onClick={() => handleVerDocumentoCompleto(sug)}
                              className="text-gray-500 text-[11px] font-bold flex items-center gap-1 hover:text-[#002E6D] transition-colors ml-auto"
                            >
                              <Maximize2 size={12} /> Ver Contexto Completo
                            </button>
                        )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-gray-50 border border-dashed border-gray-300 p-8 text-center rounded-xl">
                  <p className="text-xs text-gray-400">Sin precedentes similares en la memoria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-16 pt-8 border-t border-red-100 flex justify-center">
        <button 
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-widest border border-red-200 hover:border-red-300 px-6 py-3 rounded-lg transition-all"
        >
            <Trash2 size={16} /> Eliminar expediente
        </button>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
