import { useState } from 'react';
import { ArrowLeft, Edit, X, User, Clock, ShieldCheck, FileText, Building, ExternalLink, Save, Download, Gavel } from 'lucide-react';

const DERECHOS_VULNERADOS = [
  'Acceso al servicio público de energía',
  'Servidumbre de energía',
  'Derecho de petición',
  'Facturación / Cobros indebidos',
  'Corte o suspensión del servicio',
  'Daños por instalaciones eléctricas',
  'Medio ambiente / Impacto ambiental',
  'Propiedad / Predial',
  'Seguridad / Accidente eléctrico',
  'Contrato de condiciones uniformes',
  'Otro',
];
import { tutelaService } from '../../services/tutelaService';
import toast from 'react-hot-toast';

export default function DetalleHeader({
  tutela,
  updating,
  navigate,
  handleUpdateStatus,
  onExportPDF,
  // Props migrados de SidebarInfo
  id,
  allAbogados,
  areasDinamicas,
  setUpdating,
  setTutela,
  fetchData
}) {
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [checklist, setChecklist] = useState({ contestacion: false, requerimientos: false, notificacion: false });
  const [resultadoFallo, setResultadoFallo] = useState('');

  // Editing state (migrado de SidebarInfo)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const onStatusClick = (nuevoEstado) => {
    if (nuevoEstado === tutela.estado) return;

    if (nuevoEstado === 'Respondida') {
      setTargetStatus(nuevoEstado);
      setChecklistModalOpen(true);
      return;
    }

    handleUpdateStatus(nuevoEstado);
  };

  const proceedUpdateStatus = async () => {
    const success = await handleUpdateStatus(
      targetStatus,
      null,
      `Estado cambiado a: ${targetStatus} (Checklist de integridad verificado)`,
      resultadoFallo ? { resultado_fallo: resultadoFallo } : {}
    );

    if (success) {
      setChecklistModalOpen(false);
      setChecklist({ contestacion: false, requerimientos: false, notificacion: false });
      setResultadoFallo('');
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditForm({ 
        radicado: tutela.radicado,
        accionante: tutela.accionante,
        sharepoint_link: tutela.sharepoint_link || '',
        derecho_vulnerado: tutela.derecho_vulnerado || '',
        resultado_fallo: tutela.resultado_fallo || '',
        grupo_id: tutela.grupo_id || '',
        responsable_id: tutela.responsable_uuid || '',
        prioridad: tutela.prioridad,
        dias_termino: tutela.dias_termino,
        responsables_ids: tutela.responsables_ids || []
    });
  };

  const saveEditing = async () => {
    try {
        const payload = {
            ...editForm,
            responsable_uuid: editForm.responsable_id,
            resultado_fallo: editForm.resultado_fallo || null
        };
        await tutelaService.actualizarDatos(id, payload);
        toast.success('Datos actualizados');
        setIsEditing(false);
        fetchData();
    } catch (err) { 
        toast.error('Error al actualizar'); 
    }
  };

  // Computed
  const diasRestantes = tutela.fecha_vencimiento 
    ? Math.ceil((new Date(tutela.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const urgente = diasRestantes !== null && diasRestantes <= 3;

  const responsableNombre = tutela.responsables_nombres?.length > 0 
    ? tutela.responsables_nombres.join(', ') 
    : (allAbogados.find(a => a.id === tutela.responsable_uuid)?.nombre || 'Sin asignar');

  return (
    <>
      {/* Top Bar: Back + Status Toggle */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-[#002E6D] font-medium transition-colors">
          <ArrowLeft size={20} /> Volver a la Bandeja
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-200 bg-white hover:bg-blue-50 hover:text-[#002E6D] hover:border-[#002E6D] rounded-xl transition-colors"
            title="Exportar expediente como PDF"
          >
            <Download size={14} /> Exportar PDF
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 shadow-inner">
          {['Pendiente', 'En Proceso', 'Respondida'].map((estado) => (
            <button 
              key={estado} 
              disabled={updating} 
              onClick={() => onStatusClick(estado)} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tutela.estado === estado 
                ? 'bg-white text-[#002E6D] shadow-sm ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {estado}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
        {/* Priority accent bar */}
        <div className={`h-1 w-full ${tutela.prioridad === 'Alta' ? 'bg-gradient-to-r from-red-500 to-orange-400' : tutela.prioridad === 'Media' ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-gradient-to-r from-blue-400 to-cyan-300'}`} />
        
        <div className="p-6">
          {isEditing ? (
            /* ——— Modo Edición Inline ——— */
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <Edit size={14} className="text-[#002E6D]" /> Editando Expediente
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                    <X size={14} /> Cancelar
                  </button>
                  <button onClick={saveEditing} className="px-4 py-2 bg-[#002E6D] text-white rounded-lg text-xs font-bold hover:bg-[#001d4a] transition-colors flex items-center gap-1.5">
                    <Save size={14} /> Guardar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <input className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.radicado} onChange={e => setEditForm({...editForm, radicado: e.target.value})} placeholder="Radicado" />
                <input className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.accionante} onChange={e => setEditForm({...editForm, accionante: e.target.value})} placeholder="Accionante" />
                <input className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.sharepoint_link} onChange={e => setEditForm({...editForm, sharepoint_link: e.target.value})} placeholder="Link de SharePoint" />
                <select className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.derecho_vulnerado} onChange={e => setEditForm({...editForm, derecho_vulnerado: e.target.value})}>
                  <option value="">Seleccionar Derecho Vulnerado</option>
                  {DERECHOS_VULNERADOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.resultado_fallo || ''} onChange={e => setEditForm({...editForm, resultado_fallo: e.target.value})}>
                  <option value="">Resultado del Fallo (opcional)</option>
                  <option value="Favorable">Favorable</option>
                  <option value="Desfavorable">Desfavorable</option>
                  <option value="En apelación">En apelación</option>
                </select>
                <select className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.grupo_id} onChange={e => setEditForm({...editForm, grupo_id: e.target.value})}>
                  <option value="">Seleccionar Grupo</option>
                  {areasDinamicas.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
                <select className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.prioridad} onChange={e => setEditForm({...editForm, prioridad: e.target.value})}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
                <input type="number" className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.dias_termino} onChange={e => setEditForm({...editForm, dias_termino: e.target.value})} placeholder="Días término" />
                <select className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#002E6D]" value={editForm.responsable_id} onChange={e => setEditForm({...editForm, responsable_id: e.target.value})}>
                    <option value="">Seleccionar Responsable...</option>
                    {allAbogados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
            </div>
          ) : (
            /* ——— Modo Vista Normal ——— */
            <div className="animate-fade-in">
              {/* Row 1: Radicado + Accionante + Priority Badge + Edit */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight break-all">{tutela.radicado}</h1>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                      tutela.prioridad === 'Alta' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : tutela.prioridad === 'Media'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {tutela.prioridad}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">{tutela.accionante}</p>
                  {tutela.sharepoint_link && (
                    <a 
                      href={tutela.sharepoint_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-50 text-[#002E6D] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink size={12} /> Carpeta SharePoint
                    </a>
                  )}
                </div>
                <button onClick={startEditing} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#002E6D] hover:bg-blue-50 rounded-xl transition-colors shrink-0" title="Editar expediente">
                  <Edit size={16}/>
                </button>
              </div>

              {/* Row 2: Metadata chips — distribución horizontal */}
              <div className={`grid grid-cols-2 md:grid-cols-3 ${tutela.resultado_fallo ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4 pt-5 border-t border-gray-100`}>
                <MetaChip icon={<User size={15} />} label="Responsable" value={responsableNombre} />
                <MetaChip icon={<FileText size={15} />} label="Derecho" value={tutela.derecho_vulnerado || 'General'} />
                <MetaChip
                  icon={<Clock size={15} />}
                  label="Vencimiento"
                  value={new Date(tutela.fecha_vencimiento).toLocaleDateString()}
                  accent={urgente ? 'red' : null}
                  badge={diasRestantes !== null ? `${diasRestantes}d` : null}
                />
                <MetaChip icon={<ShieldCheck size={15} />} label="Estado" value={tutela.estado} />
                <MetaChip icon={<Building size={15} />} label="Grupo" value={tutela.grupo_nombre || 'Sin grupo'} />
                {tutela.resultado_fallo && (
                  <MetaChip
                    icon={<Gavel size={15} />}
                    label="Fallo"
                    value={tutela.resultado_fallo}
                    accent={tutela.resultado_fallo === 'Favorable' ? 'green' : tutela.resultado_fallo === 'Desfavorable' ? 'red' : null}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner: invitar a registrar resultado del fallo */}
      {tutela.estado === 'Respondida' && !tutela.resultado_fallo && (
        <div className="flex items-center justify-between gap-4 mb-6 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <Gavel size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              ¿Ya conoces el fallo del juzgado? Registra el resultado para enriquecer los análisis.
            </p>
          </div>
          <button
            onClick={startEditing}
            className="shrink-0 px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-300 bg-white rounded-lg hover:bg-amber-100 transition-colors"
          >
            Registrar resultado
          </button>
        </div>
      )}

      {/* Checklist Modal */}
      {checklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Checklist de Cierre</h2>
            <p className="text-xs text-gray-500 mb-6">Verifica lo siguiente antes de marcar como respondida:</p>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <input type="checkbox" className="w-4 h-4 rounded text-[#002E6D] focus:ring-[#002E6D]" checked={checklist.contestacion} onChange={(e) => setChecklist({...checklist, contestacion: e.target.checked})} />
                Contestación radicada en juzgado
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <input type="checkbox" className="w-4 h-4 rounded text-[#002E6D] focus:ring-[#002E6D]" checked={checklist.requerimientos} onChange={(e) => setChecklist({...checklist, requerimientos: e.target.checked})} />
                Requerimientos cerrados
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <input type="checkbox" className="w-4 h-4 rounded text-[#002E6D] focus:ring-[#002E6D]" checked={checklist.notificacion} onChange={(e) => setChecklist({...checklist, notificacion: e.target.checked})} />
                Notificación a partes confirmada
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setChecklistModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
              <button
                onClick={proceedUpdateStatus}
                disabled={!checklist.contestacion || !checklist.requerimientos || !checklist.notificacion || updating}
                className="flex-1 bg-[#002E6D] hover:bg-[#001d4a] disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Chip compacto para metadatos horizontales */
function MetaChip({ icon, label, value, accent, badge }) {
  const iconCls =
    accent === 'red'   ? 'bg-red-50 text-red-500 group-hover:bg-red-100' :
    accent === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
                         'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-[#002E6D]';
  const textCls =
    accent === 'red'   ? 'text-red-600' :
    accent === 'green' ? 'text-green-700' :
                         'text-gray-800';
  return (
    <div className="flex items-center gap-3 group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${iconCls}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`font-semibold text-xs truncate ${textCls}`}>
          {value}
          {badge && (
            <span className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black ${
              accent === 'red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {badge}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
