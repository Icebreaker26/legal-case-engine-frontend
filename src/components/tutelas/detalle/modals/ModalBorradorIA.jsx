import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { tutelaService } from '../../../../services/tutelaService';

export default function ModalBorradorIA({
  isOpen,
  onClose,
  id,
  isLockedByMe,
  unlock,
  aiDraftContent,
  setAiDraftContent,
  sugerencias
}) {
  const [instruccionesRefinar, setInstruccionesRefinar] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  if (!isOpen) return null;

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

  const handleClose = async () => {
      if (isLockedByMe) await unlock();
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-12 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scale-in border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#002E6D] rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#002E6D] uppercase tracking-tight">Borrador de Contestación IA</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Generado con IA Avanzada + Precedentes Internos</p>
                    </div>
                </div>
                <button onClick={handleClose} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all group">
                    <X size={28} className="group-hover:rotate-90 transition-transform" />
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-white">
                {/* Área de Edición */}
                <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
                    <div className="bg-gray-50/50 px-8 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            Editor de Borrador
                            {!isLockedByMe && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px]">Solo Lectura (Bloqueado)</span>}
                        </span>
                        {isLockedByMe && (
                            <button 
                                onClick={handleGuardarBorradorManual}
                                className="text-[#002E6D] text-[10px] font-black uppercase hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Guardar Cambios Manuales
                            </button>
                        )}
                    </div>
                    <textarea 
                        className="flex-1 p-8 md:p-12 font-serif text-gray-800 leading-relaxed text-lg outline-none resize-none selection:bg-blue-100 bg-transparent"
                        value={aiDraftContent}
                        onChange={(e) => setAiDraftContent(e.target.value)}
                        placeholder="El borrador aparecerá aquí..."
                        disabled={!isLockedByMe}
                    />
                </div>

                {/* Panel de Refinamiento */}
                <div className="w-full lg:w-96 bg-gray-50 p-8 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h4 className="text-xs font-black text-[#002E6D] uppercase tracking-widest mb-4">Refinar con IA</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                            Indica cambios específicos a la IA. Ej: <br/><i className="text-gray-400">"Hazlo más corto", "Enfócate en el derecho a la salud", "Usa un tono más formal".</i>
                        </p>
                        <textarea 
                            className="w-full h-32 p-4 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#002E6D] transition-shadow resize-none bg-white shadow-inner"
                            placeholder="Escribe tus instrucciones de refinamiento..."
                            value={instruccionesRefinar}
                            onChange={(e) => setInstruccionesRefinar(e.target.value)}
                            disabled={!isLockedByMe}
                        />
                        <button 
                            onClick={handleRefinarIA}
                            disabled={loadingAi || !instruccionesRefinar.trim() || !isLockedByMe}
                            className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black disabled:bg-gray-300 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:active:scale-100"
                        >
                            {loadingAi ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Ejecutar Refinamiento'}
                        </button>
                    </div>

                    <div className="mt-auto border-t border-gray-200 pt-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Precedentes Usados en la Generación</h4>
                        <div className="space-y-3">
                            {sugerencias.length === 0 && <p className="text-[10px] text-gray-400 italic">No se usaron precedentes específicos.</p>}
                            {sugerencias.slice(0, 3).map((s, i) => (
                                <div key={i} className="p-3 bg-white border border-gray-100 shadow-sm rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-relaxed">{s.titulo_referencia}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-3xl flex flex-col sm:flex-row justify-between items-center gap-4 px-8 md:px-12">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-sm leading-relaxed text-center sm:text-left">
                    Este documento es un borrador sugerido. Debe ser revisado exhaustivamente por un profesional jurídico antes de ser radicado.
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleClose} className="flex-1 sm:flex-none px-8 py-3 text-gray-500 font-bold text-xs hover:text-gray-700 bg-white border border-gray-200 rounded-xl transition-colors uppercase tracking-widest text-center">
                        Cerrar
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(aiDraftContent); toast.success('Copiado al portapapeles'); }} className="flex-1 sm:flex-none px-10 py-3 bg-[#002E6D] text-white rounded-xl font-black text-xs hover:bg-[#001d4a] transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest">
                        Copiar Borrador
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
