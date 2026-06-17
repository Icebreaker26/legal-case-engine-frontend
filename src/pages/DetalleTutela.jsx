import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLock } from '../hooks/useLock';
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
  Edit,
  ExternalLink,
  Link as LinkIcon,
  Mail,
  FileCheck,
  Download,
  Plus
} from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

export default function DetalleTutela() {
  const { theme } = useTheme();
  const isDark = theme === 'dark-pro';
  const { id } = useParams();
  const { lockInfo, isLockedByMe, lock, unlock } = useLock(id);
  const navigate = useNavigate();
  const [tutela, setTutela] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [areasDinamicas, setAreasDinamicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSugerencias, setLoadingSugerencias] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [aiConfig, setAiConfig] = useState({ ai_draft_enabled: false });
  const [loadingAi, setLoadingAi] = useState(false);

  // Estado para Requerimientos Internos
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [nuevoReq, setNuevoReq] = useState({ area_destino: '', descripcion: '' });
  const [viewOficio, setViewOficio] = useState(null);
  const [respReqModal, setRespReqModal] = useState(null); // Almacena el reqId al que se responde
  const [textoRespuesta, setTextoRespuesta] = useState('');

  // Estado para el modal de documento completo
  const [modalOpen, setModalOpen] = useState(false);
  const [documentoCompleto, setDocumentoCompleto] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docTitulo, setDocTitulo] = useState('');
  
  // Estado para el modal de Borrador IA
  const [aiDraftModalOpen, setAiDraftModalOpen] = useState(false);
  const [aiDraftContent, setAiDraftContent] = useState('');
  const [instruccionesRefinar, setInstruccionesRefinar] = useState('');
  const [allAbogados, setAllAbogados] = useState([]);
  const [selectedAbogados, setSelectedAbogados] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para validación de calidad
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklist, setChecklist] = useState({ contestacion: false, requerimientos: false, notificacion: false });
  const [targetStatus, setTargetStatus] = useState('');

  // Estados para edición y eliminación
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
      radicado: '', 
      accionante: '', 
      sharepoint_link: '', 
      derecho_vulnerado: '', 
      grupo_id: '', 
      responsable_id: '', 
      prioridad: 'Media', 
      dias_termino: 2,
      responsables_ids: [] 
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const renderFormattedText = (text) => {
    if (!text) return null;
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
      setAiDraftContent(found.contestacion_generada || '');
      setSelectedAbogados(found.responsables_ids || []);
      
      const [sugs, logs, config, reqs, areas, abogados] = await Promise.all([
        tutelaService.obtenerSugerencias(id).catch(() => []),
        tutelaService.obtenerHistorial(id).catch(() => []),
        tutelaService.obtenerConfiguracion().catch(() => ({ ai_draft_enabled: false })),
        tutelaService.listarRequerimientos(id).catch(() => []),
        tutelaService.listarAreas().catch(() => []),
        apiService.get('/admin/abogados-activos').catch(() => ({ data: [] }))
      ]);

      setSugerencias(sugs);
      setHistorial(logs);
      setAiConfig(config);
      setRequerimientos(reqs);
      setAreasDinamicas(areas.filter(a => a.activo));
      setAllAbogados(abogados.data || []);

    } catch (error) {
      toast.error('Error al cargar la información');
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingSugerencias(false);
    }
  }, [id, navigate]);

  const handleUpdateResponsables = async (abogados_ids) => {
    setUpdating(true);
    try {
        await tutelaService.gestionarResponsables(id, abogados_ids);
        setSelectedAbogados(abogados_ids);
        toast.success('Responsables actualizados');
        fetchData();
    } catch (err) { toast.error('Error al actualizar responsables'); }
    finally { setUpdating(false); }
  };

  const handleCrearReq = async (e) => {
    e.preventDefault();
    if (!nuevoReq.area_destino || !nuevoReq.descripcion.trim()) return;

    setUpdating(true);
    try {
        const created = await tutelaService.crearRequerimiento(id, nuevoReq);
        setRequerimientos([created, ...requerimientos]);
        setReqModalOpen(false);
        setNuevoReq({ area_destino: '', descripcion: '' });
        toast.success('Solicitud enviada correctamente');
        
        // Registrar en trazabilidad automáticamente
        await tutelaService.agregarAccion(id, {
            accion: `Se generó requerimiento interno para el área de ${nuevoReq.area_destino}`,
            area_involucrada: 'Jurídica',
            responsable_nombre: 'Sistema'
        });
        fetchData(); // Recargar historial
    } catch (err) { toast.error('Error al enviar solicitud'); }
    finally { setUpdating(false); }
  };

  const handleActualizarEstadoReq = async (reqId, estado) => {
    try {
        await tutelaService.actualizarEstadoRequerimiento(reqId, estado);
        setRequerimientos(requerimientos.map(r => r.id === reqId ? { ...r, estado } : r));
        toast.success('Estado actualizado');
    } catch (err) { toast.error('Error al actualizar'); }
  };

  const handleDownloadOficio = (req) => {
    const element = document.createElement("a");
    const file = new Blob([req.oficio_generado], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Requerimiento_${req.area_destino}_${tutela.radicado}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const handleRegistrarRespuesta = async (e) => {
    e.preventDefault();
    if (!textoRespuesta.trim()) return;

    setUpdating(true);
    try {
        const timestamp = new Date().toLocaleString();
        const nuevaLinea = `\n[${timestamp}]: ${textoRespuesta}`;
        await tutelaService.actualizarEstadoRequerimiento(respReqModal, 'Respondido', textoRespuesta);
        
        setRequerimientos(requerimientos.map(r => 
            r.id === respReqModal 
            ? { ...r, estado: 'Respondido', respuesta_texto: (r.respuesta_texto || '') + nuevaLinea } 
            : r
        ));
        
        setRespReqModal(null);
        setTextoRespuesta('');
        toast.success('Respuesta agregada al historial');
        fetchData(); // Recargar para ver el nuevo log en la línea de tiempo
    } catch (err) { toast.error('Error al registrar respuesta'); }
    finally { setUpdating(false); }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerarIA = async () => {
    // Si ya hay contenido, solo abrimos el modal e intentamos bloquear
    if (aiDraftContent) {
        if (!isLockedByMe) {
            const success = await lock();
            if (!success) return; // Si no pudo bloquear, no abre
        }
        setAiDraftModalOpen(true);
        return;
    }

    if (!aiConfig.ai_draft_enabled) {
      toast.error('Esta función ha sido desactivada por un administrador.');
      return;
    }

    setLoadingAi(true);
    try {
      const result = await tutelaService.generarBorradorIA(id);
      setAiDraftContent(result.borrador_completo);
      const success = await lock(); // Intentar bloquear al generar
      if (!success) return; 
      
      setAiDraftModalOpen(true);
      toast.success(result.status === 'cached' ? 'Cargando borrador guardado' : 'Borrador generado con éxito');
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('La IA está desactivada globalmente.');
      } else {
        toast.error('Error al generar el borrador por IA.');
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCloseAiDraft = async () => {
      if (isLockedByMe) await unlock();
      setAiDraftModalOpen(false);
  };

  const handleGuardarBorradorManual = async () => {
    setLoadingAi(true);
    try {
        await tutelaService.refinarBorradorIA(id, { borradorManual: aiDraftContent });
        toast.success('Borrador guardado localmente');
    } catch (error) {
        toast.error('Error al guardar');
    } finally {
        setLoadingAi(false);
    }
  };

  const handleRefinarIA = async () => {
    if (!instruccionesRefinar.trim()) return;
    setLoadingAi(true);
    try {
        const result = await tutelaService.refinarBorradorIA(id, { 
            instrucciones: instruccionesRefinar,
            borradorManual: aiDraftContent 
        });
        setAiDraftContent(result.borrador_completo);
        setInstruccionesRefinar('');
        toast.success('Borrador refinado con éxito');
    } catch (error) {
        toast.error('Error al refinar con IA');
    } finally {
        setLoadingAi(false);
    }
  };

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

    if (nuevoEstado === 'Respondida') {
      setTargetStatus(nuevoEstado);
      setChecklistModalOpen(true);
      return;
    }

    proceedUpdateStatus(nuevoEstado);
  };

  const proceedUpdateStatus = async (nuevoEstado) => {
    setUpdating(true);
    try {
      await tutelaService.actualizar(id, { estado: nuevoEstado });
      
      const log = await tutelaService.agregarAccion(id, {
        accion: `Estado cambiado a: ${nuevoEstado}${nuevoEstado === 'Respondida' ? ' (Checklist de integridad verificado)' : ''}`,
        area_involucrada: 'Jurídica',
        responsable_nombre: nuevaAccion.responsable_nombre
      });

      setTutela({ ...tutela, estado: nuevoEstado });
      setHistorial([log, ...historial]);
      toast.success(`Estado actualizado a ${nuevoEstado}`);
      setChecklistModalOpen(false);
      setChecklist({ contestacion: false, requerimientos: false, notificacion: false });
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
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${tutela.prioridad === 'Alta' ? (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') : (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')}`}>
              Prioridad {tutela.prioridad}
            </div>
            
            <div className="flex items-center gap-4 mb-4">
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                        <input className="border p-2 rounded text-sm w-full" value={editForm.radicado} onChange={e => setEditForm({...editForm, radicado: e.target.value})} placeholder="Radicado" />
                        <input className="border p-2 rounded text-sm w-full" value={editForm.accionante} onChange={e => setEditForm({...editForm, accionante: e.target.value})} placeholder="Accionante" />
                        <input className="border p-2 rounded text-sm w-full" value={editForm.sharepoint_link} onChange={e => setEditForm({...editForm, sharepoint_link: e.target.value})} placeholder="Link de SharePoint" />
                        <input className="border p-2 rounded text-sm w-full" value={editForm.derecho_vulnerado} onChange={e => setEditForm({...editForm, derecho_vulnerado: e.target.value})} placeholder="Derecho Vulnerado" />

                        <div className="grid grid-cols-2 gap-2">
                           <select className="border p-2 rounded text-sm" value={editForm.grupo_id} onChange={e => setEditForm({...editForm, grupo_id: e.target.value})}>
                             <option value="">Seleccionar Grupo</option>
                             {areasDinamicas.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                           </select>
                           <select className="border p-2 rounded text-sm" value={editForm.prioridad} onChange={e => setEditForm({...editForm, prioridad: e.target.value})}>
                             <option value="Baja">Baja</option>
                             <option value="Media">Media</option>
                             <option value="Alta">Alta</option>
                           </select>
                        </div>
                        <input type="number" className="border p-2 rounded text-sm w-full" value={editForm.dias_termino} onChange={e => setEditForm({...editForm, dias_termino: e.target.value})} placeholder="Días término" />

                        <div className="mt-2">
                            <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Responsable Principal:</label>
                            <select className="border p-2 rounded text-sm w-full" value={editForm.responsable_id} onChange={e => setEditForm({...editForm, responsable_id: e.target.value})}>
                                <option value="">Seleccionar Responsable...</option>
                                {allAbogados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                            </select>
                        </div>

                        <button onClick={async () => { 
                            // Mapeo para enviar al backend
                            const payload = {
                                ...editForm,
                                responsable_uuid: editForm.responsable_id // Mapeo solicitado por backend
                            };
                            await tutelaService.actualizarDatos(id, payload);
                            toast.success('Datos actualizados');
                            setIsEditing(false);
                            fetchData();
                        }} className="bg-green-600 text-white px-3 py-2 rounded text-sm w-full font-bold mt-2">Guardar</button>
                    </div>
                ) : (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">{tutela.radicado}</h2>
                            <p className="text-gray-500 text-sm mb-2">{tutela.accionante}</p>
                            {tutela.sharepoint_link && (
                                <a 
                                  href={tutela.sharepoint_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-[#002E6D] text-[10px] font-black uppercase tracking-widest hover:underline"
                                >
                                  <ExternalLink size={12} /> Carpeta SharePoint
                                </a>
                            )}
                        </div>
                        <button onClick={() => { 
                            setIsEditing(true); 
                            setEditForm({ 
                                radicado: tutela.radicado, 
                                accionante: tutela.accionante, 
                                sharepoint_link: tutela.sharepoint_link || '',
                                derecho_vulnerado: tutela.derecho_vulnerado || '',
                                grupo_id: tutela.grupo_id || '',
                                responsable_id: tutela.responsable_uuid || '',
                                prioridad: tutela.prioridad,
                                dias_termino: tutela.dias_termino,
                                responsables_ids: tutela.responsables_ids || []
                            }); 
                        }} className="text-gray-400 hover:text-blue-600"><Edit size={16}/></button>
                    </>
                )
                }
            </div>
            
            <div className="space-y-4">
              <InfoItem icon={<User size={16}/>} label="Responsables" value={tutela.responsables_nombres?.length > 0 ? tutela.responsables_nombres.join(', ') : (allAbogados.find(a => a.id === tutela.responsable_uuid)?.nombre || 'Sin asignar')} />
              <InfoItem icon={<FileText size={16}/>} label="Derecho" value={tutela.derecho_vulnerado || 'General'} />
              <InfoItem icon={<Clock size={16}/>} label="Vencimiento" value={new Date(tutela.fecha_vencimiento).toLocaleDateString()} />
              <InfoItem icon={<ShieldCheck size={16}/>} label="Estado" value={tutela.estado} />
              <InfoItem icon={<Building size={16}/>} label="Área" value={tutela.grupo_nombre || 'General'} />
              {tutela.sharepoint_link && <InfoItem icon={<LinkIcon size={16}/>} label="Documentación" value="SharePoint Vinculado" />}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#002E6D]" /> Asistencia IA
            </h3>
            <button 
              onClick={handleGenerarIA}
              disabled={loadingAi}
              className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                aiConfig.ai_draft_enabled 
                ? 'bg-gradient-to-r from-[#002E6D] to-blue-800 text-white hover:shadow-lg' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loadingAi ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Redactando...
                </>
              ) : (
                <>
                  <Send size={14} /> Generar Contestación (IA)
                </>
              )}
            </button>
            {!aiConfig.ai_draft_enabled && (
              <p className="text-[10px] text-red-400 mt-2 text-center font-medium italic">
                La redacción IA está desactivada por administración.
              </p>
            )}
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

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Mail size={18} className="text-[#002E6D]" /> Solicitudes Internas
                </h3>
                <button 
                    onClick={() => setReqModalOpen(true)}
                    className="p-1.5 bg-blue-50 text-[#002E6D] rounded-lg hover:bg-blue-100 transition-colors"
                    title="Nueva solicitud de pruebas"
                >
                    <Plus size={16} />
                </button>
            </div>
            
            <div className="space-y-3">
                {requerimientos.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic text-center py-2">No hay requerimientos activos.</p>
                ) : requerimientos.map(req => (
                    <div key={req.id} className="bg-gray-50 border border-gray-100 p-3 rounded-xl">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-[#002E6D] uppercase">{req.area_destino}</span>
                            <div className="flex gap-1">
                                <button onClick={() => setViewOficio(req)} className="text-gray-400 hover:text-blue-600"><Maximize2 size={12}/></button>
                                <button onClick={() => handleDownloadOficio(req)} className="text-gray-400 hover:text-blue-600"><Download size={12}/></button>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-600 line-clamp-2 mb-2">{req.descripcion}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] text-gray-400 uppercase font-bold">{new Date(req.fecha_solicitud).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                                {req.estado !== 'Respondido' && (
                                    <button 
                                        onClick={() => setRespReqModal(req.id)}
                                        className="text-[8px] font-black uppercase text-blue-600 hover:underline"
                                    >
                                        Registrar Respuesta
                                    </button>
                                )}
                                <select 
                                    value={req.estado} 
                                    onChange={(e) => handleActualizarEstadoReq(req.id, e.target.value)}
                                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-none outline-none cursor-pointer ${
                                        req.estado === 'Respondido' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Respondido">Recibido</option>
                                    <option value="Vencido">Vencido</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
                      <div className="flex flex-col h-auto w-full text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-wrap break-words">
                        {log.accion}
                      </div>
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

          {(aiConfig.legal_notes || []).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-[#002E6D]" />
                <h3 className="text-lg font-bold text-gray-800">Argumentos Fijos / Notas Legales</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiConfig.legal_notes.map((nota) => (
                  <div key={nota.id} className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg text-[#002E6D] shadow-sm">
                            <Bookmark size={16} />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#002E6D] text-sm mb-1 uppercase tracking-tight">{nota.titulo}</h4>
                            <p className="text-xs text-blue-900/70 leading-relaxed">{nota.contenido}</p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                <div key={sug.documento_id ? `${sug.documento_id}-${idx}` : idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Modal para Borrador IA */}
      {aiDraftModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-12">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scale-in border border-gray-100">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#002E6D] rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#002E6D] uppercase tracking-tight">Borrador de Contestación IA</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Generado con GPT-4o + Precedentes Internos</p>
                        </div>
                    </div>
                    <button onClick={handleCloseAiDraft} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all group">
                        <X size={28} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white">
                    {/* Área de Edición */}
                    <div className="flex-1 flex flex-col border-r border-gray-100">
                        <div className="bg-gray-50 px-8 py-2 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Editor de Borrador</span>
                            <button 
                                onClick={handleGuardarBorradorManual}
                                className="text-[#002E6D] text-[10px] font-black uppercase hover:underline"
                            >
                                [ Guardar Cambios Manuales ]
                            </button>
                        </div>
                        <textarea 
                            className="flex-1 p-12 font-serif text-gray-800 leading-relaxed text-lg outline-none resize-none selection:bg-blue-100"
                            value={aiDraftContent}
                            onChange={(e) => setAiDraftContent(e.target.value)}
                            placeholder="El borrador aparecerá aquí..."
                            disabled={!isLockedByMe}
                        />
                    </div>

                    {/* Panel de Refinamiento */}
                    <div className="w-full md:w-80 bg-gray-50 p-8 flex flex-col gap-6">
                        <div>
                            <h4 className="text-xs font-black text-[#002E6D] uppercase tracking-widest mb-4">Refinar con IA</h4>
                            <p className="text-[10px] text-gray-500 leading-tight mb-4">
                                Indica cambios específicos. Ej: "Hazlo más corto", "Enfócate en el derecho a la salud", "Usa un tono más formal".
                            </p>
                            <textarea 
                                className="w-full h-32 p-4 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#002E6D] transition-all"
                                placeholder="Escribe tus instrucciones..."
                                value={instruccionesRefinar}
                                onChange={(e) => setInstruccionesRefinar(e.target.value)}
                            />
                            <button 
                                onClick={handleRefinarIA}
                                disabled={loadingAi || !instruccionesRefinar.trim()}
                                className="w-full mt-4 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2"
                            >
                                {loadingAi ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Ejecutar Refinamiento'}
                            </button>
                        </div>

                        <div className="mt-auto border-t border-gray-200 pt-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Precedentes Usados</h4>
                            <div className="space-y-2">
                                {sugerencias.slice(0, 2).map((s, i) => (
                                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
                                        <p className="text-[9px] font-bold text-gray-800 truncate">{s.titulo_referencia}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-between items-center px-12">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-xs">
                        Este documento es un borrador sugerido. Debe ser revisado por un profesional jurídico antes de ser radicado.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => setAiDraftModalOpen(false)} className="px-8 py-3 text-gray-500 font-bold text-sm hover:text-gray-700 transition-colors uppercase tracking-widest">
                            Cerrar
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(aiDraftContent); toast.success('Copiado al portapapeles'); }} className="px-10 py-3 bg-[#002E6D] text-white rounded-xl font-black text-sm hover:bg-[#001d4a] hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3 uppercase tracking-widest">
                            Copiar Borrador
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modal para Crear Requerimiento */}
      {reqModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Mail className="text-[#002E6D]" size={20} /> Solicitar Pruebas / Info
                    </h3>
                    <button onClick={() => setReqModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleCrearReq} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">Área Destino</label>
                        <select 
                            required
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={nuevoReq.area_destino}
                            onChange={e => setNuevoReq({...nuevoReq, area_destino: e.target.value})}
                        >
                            <option value="">Selecciona un área...</option>
                            {areasDinamicas.map(area => (
                                <option key={area.id} value={area.nombre}>{area.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">¿Qué información necesitas?</label>
                        <textarea 
                            required
                            rows="4"
                            placeholder="Ej: Reporte de inspección del poste #456 del día..."
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={nuevoReq.descripcion}
                            onChange={e => setNuevoReq({...nuevoReq, descripcion: e.target.value})}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={updating}
                        className="w-full py-3 bg-[#002E6D] text-white rounded-xl font-bold text-sm hover:bg-[#001d4a] transition-all flex items-center justify-center gap-2"
                    >
                        {updating ? 'Generando Oficio...' : 'Generar y Registrar Requerimiento'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Modal para Ver Oficio Generado */}
      {viewOficio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Oficio de Requerimiento</h3>
                        <p className="text-xs text-gray-500">Dirigido a: {viewOficio.area_destino}</p>
                    </div>
                    <button onClick={() => setViewOficio(null)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 font-mono text-xs text-gray-700 whitespace-pre-wrap bg-white overflow-y-auto max-h-[60vh]">
                    <div className="mb-8 pb-8 border-b border-gray-100">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Oficio Original Enviado</h4>
                        {viewOficio.oficio_generado}
                    </div>
                    
                    {viewOficio.estado === 'Respondido' && (
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <h4 className="text-[10px] font-black text-green-700 uppercase mb-4 tracking-widest flex items-center gap-2">
                                <FileCheck size={14} /> Respuesta Técnica Recibida
                            </h4>
                            <div className="font-sans text-sm text-gray-800 leading-relaxed italic whitespace-pre-wrap break-words break-all">
                                {viewOficio.respuesta_texto || 'Respuesta registrada en el historial del caso.'}
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3 px-8">
                    <button onClick={() => { navigator.clipboard.writeText(viewOficio.oficio_generado); toast.success('Copiado'); }} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-300 transition-all">
                        Copiar Texto
                    </button>
                    <button onClick={() => handleDownloadOficio(viewOficio)} className="px-6 py-2 bg-[#002E6D] text-white rounded-lg font-bold text-xs hover:bg-[#001d4a] transition-all flex items-center gap-2">
                        <Download size={14} /> Descargar .txt
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal para Registrar Respuesta de Requerimiento */}
      {respReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[170] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileCheck className="text-green-600" size={20} /> Registrar Respuesta Recibida
                    </h3>
                    <button onClick={() => setRespReqModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleRegistrarRespuesta} className="space-y-4">
                    <p className="text-xs text-gray-500 mb-4">
                        Pega aquí la información técnica o respuesta enviada por el área para que quede en el historial oficial del caso.
                    </p>
                    <textarea 
                        required
                        rows="6"
                        placeholder="Escribe o pega la respuesta del área aquí..."
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
                        value={textoRespuesta}
                        onChange={e => setTextoRespuesta(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={updating}
                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                        {updating ? 'Guardando...' : 'Cerrar Requerimiento y Loguear'}
                    </button>
                </form>
            </div>
        </div>
      )}
      {/* Modal de Checklist de Calidad */}
      {checklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[180] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-scale-in">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <CheckCircle className="text-blue-600" size={20} /> Validación de Calidad
                </h3>
                <div className="space-y-4 mb-8">
                    {[{key: 'contestacion', label: '¿Contestación final adjunta?'}, {key: 'requerimientos', label: '¿Requerimientos respondidos?'}, {key: 'notificacion', label: '¿Prueba de envío cargada?'}].map(item => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={checklist[item.key]}
                                onChange={() => setChecklist({...checklist, [item.key]: !checklist[item.key]})}
                                className="w-5 h-5 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700 font-medium group-hover:text-blue-700">{item.label}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setChecklistModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm hover:text-gray-700 uppercase tracking-widest">Cancelar</button>
                    <button 
                        onClick={() => proceedUpdateStatus(targetStatus)}
                        disabled={!checklist.contestacion || !checklist.requerimientos || !checklist.notificacion}
                        className="flex-1 py-3 bg-[#002E6D] text-white rounded-xl font-bold text-sm hover:bg-[#001d4a] disabled:bg-gray-300 transition-all uppercase tracking-widest"
                    >
                        Confirmar Cierre
                    </button>
                </div>
            </div>
        </div>
      )}
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
