import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDetalleTutela } from '../hooks/useDetalleTutela';
import { tutelaService } from '../services/tutelaService';
import toast from 'react-hot-toast';

import DetalleHeader from '../components/tutelas/detalle/DetalleHeader';
import MainTabs from '../components/tutelas/detalle/MainTabs';

// Modals
import ModalDocumentoCompleto from '../components/tutelas/detalle/modals/ModalDocumentoCompleto';
import ModalEliminarTutela from '../components/tutelas/detalle/modals/ModalEliminarTutela';
import ModalBorradorIA from '../components/tutelas/detalle/modals/ModalBorradorIA';
import { ModalCrearRequerimiento, ModalVerOficio, ModalResponderReq } from '../components/tutelas/detalle/modals/ModalRequerimientos';

export default function DetalleTutela() {
  const {
    id,
    navigate,
    lockInfo,
    isLockedByMe,
    lock,
    unlock,
    tutela,
    sugerencias,
    historial,
    requerimientos,
    areasDinamicas,
    allAbogados,
    argumentos,
    aiConfig,
    aiDraftContent,
    setTutela,
    setRequerimientos,
    setArgumentos,
    setAiDraftContent,
    addHistorialLog,
    fetchData,
    loading,
    loadingSugerencias,
    updating,
    setUpdating,
    handleUpdateStatus,
    handleDelete
  } = useDetalleTutela();

  // Modals UI State
  const [modalDocOpen, setModalDocOpen] = useState(false);
  const [documentoCompleto, setDocumentoCompleto] = useState('');
  const [docTitulo, setDocTitulo] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [aiDraftModalOpen, setAiDraftModalOpen] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [viewOficio, setViewOficio] = useState(null);
  const [respReqModal, setRespReqModal] = useState(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Cargando expediente...</p>
      </div>
    );
  }

  if (!tutela) return null;

  // Handlers locales para UI
  const handleVerDocumentoCompleto = async (sug) => {
    if (!sug.documento_id) {
        toast.error('Esta sugerencia no tiene referencia al documento original');
        return;
    }
    setLoadingDoc(true);
    setDocTitulo(sug.titulo_referencia);
    setModalDocOpen(true);
    try {
        const data = await tutelaService.obtenerDocumentoReferencia(sug.documento_id);
        setDocumentoCompleto(data.texto_completo);
    } catch (error) {
        toast.error('No se pudo recuperar el documento completo');
        setModalDocOpen(false);
    } finally {
        setLoadingDoc(false);
    }
  };

  const handleGenerarIA = async () => {
    if (aiDraftContent) {
        if (!isLockedByMe) {
            const success = await lock();
            if (!success) return;
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
      const success = await lock();
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

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in relative">
      
      {/* Hero Header — absorbe info que estaba en la sidebar */}
      <DetalleHeader 
        tutela={tutela} 
        updating={updating} 
        navigate={navigate} 
        handleUpdateStatus={handleUpdateStatus}
        id={id}
        allAbogados={allAbogados}
        areasDinamicas={areasDinamicas}
        setUpdating={setUpdating}
        setTutela={setTutela}
        fetchData={fetchData}
      />

      {/* Pestañas a ancho completo — sin sidebar */}
      <MainTabs 
        id={id}
        tutela={tutela}
        historial={historial}
        aiDraftContent={aiDraftContent}
        setAiDraftContent={setAiDraftContent}
        isLockedByMe={isLockedByMe}
        lock={lock}
        unlock={unlock}
        aiConfig={aiConfig}
        argumentos={argumentos}
        setArgumentos={setArgumentos}
        sugerencias={sugerencias}
        loadingSugerencias={loadingSugerencias}
        handleVerDocumentoCompleto={handleVerDocumentoCompleto}
        // Props migrados de SidebarInfo
        updating={updating}
        setUpdating={setUpdating}
        addHistorialLog={addHistorialLog}
        loadingAi={loadingAi}
        handleGenerarIA={handleGenerarIA}
        requerimientos={requerimientos}
        setRequerimientos={setRequerimientos}
        areasDinamicas={areasDinamicas}
        openReqModal={() => setReqModalOpen(true)}
        openRespReqModal={setRespReqModal}
        setViewOficio={setViewOficio}
        fetchData={fetchData}
      />
      
      <div className="mt-16 pt-8 border-t border-red-100 flex justify-center">
        <button 
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-widest border border-red-200 hover:border-red-300 px-8 py-3 rounded-xl transition-all hover:bg-red-50"
        >
            Eliminar expediente
        </button>
      </div>

      {/* Modals Inyectados */}
      <ModalDocumentoCompleto 
        isOpen={modalDocOpen} 
        onClose={() => { setModalDocOpen(false); setDocumentoCompleto(''); }} 
        docTitulo={docTitulo} 
        documentoCompleto={documentoCompleto} 
        loadingDoc={loadingDoc} 
      />

      <ModalEliminarTutela 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onDelete={handleDelete} 
        radicado={tutela.radicado} 
        updating={updating} 
      />

      <ModalBorradorIA 
        isOpen={aiDraftModalOpen} 
        onClose={() => setAiDraftModalOpen(false)} 
        id={id} 
        isLockedByMe={isLockedByMe} 
        unlock={unlock} 
        aiDraftContent={aiDraftContent} 
        setAiDraftContent={setAiDraftContent} 
        sugerencias={sugerencias} 
      />

      <ModalCrearRequerimiento 
        isOpen={reqModalOpen} 
        onClose={() => setReqModalOpen(false)} 
        id={id} 
        areasDinamicas={areasDinamicas} 
        setRequerimientos={setRequerimientos} 
        addHistorialLog={addHistorialLog} 
      />

      <ModalVerOficio 
        isOpen={!!viewOficio} 
        onClose={() => setViewOficio(null)} 
        viewOficio={viewOficio} 
        tutela={tutela} 
      />

      <ModalResponderReq 
        isOpen={!!respReqModal} 
        onClose={() => {
            setRespReqModal(null);
            fetchData();
        }} 
        respReqModal={respReqModal} 
        setRequerimientos={setRequerimientos} 
        addHistorialLog={addHistorialLog} 
      />

    </div>
  );
}
