import { useState } from 'react';
import { X, FileText, BookOpen, Download } from 'lucide-react';
import { generarBorradorPDF } from '../../../utils/generarBorradorPDF';
import toast from 'react-hot-toast';
import { tutelaService } from '../../../services/tutelaService';

export default function ModalBorradorIA({
  isOpen,
  onClose,
  id,
  tutela,
  isLockedByMe,
  unlock,
  aiDraftContent,
  setAiDraftContent,
  sugerencias
}) {
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleGuardar = async () => {
    if (!aiDraftContent?.trim()) return toast.error('El borrador no puede estar vacío.');
    setSaving(true);
    try {
      await tutelaService.guardarBorrador(id, aiDraftContent);
      toast.success('Borrador guardado correctamente.');
    } catch {
      toast.error('Error al guardar el borrador.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (isLockedByMe) await unlock();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-12 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#002E6D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#002E6D] uppercase tracking-tight">Borrador de Contestación</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Edición manual · Precedentes internos disponibles</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all group">
            <X size={28} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-white">

          {/* Editor */}
          <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
            <div className="bg-gray-50/50 px-8 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Editor de Borrador
                {!isLockedByMe && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px]">Solo Lectura — Adquiere el bloqueo para editar</span>
                )}
              </span>
              {isLockedByMe && (
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="text-[#002E6D] text-[10px] font-black uppercase hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>
            <textarea
              className="flex-1 p-8 md:p-12 font-serif text-gray-800 leading-relaxed text-lg outline-none resize-none selection:bg-blue-100 bg-transparent"
              value={aiDraftContent}
              onChange={(e) => setAiDraftContent(e.target.value)}
              placeholder="Redacta aquí el borrador de contestación..."
              disabled={!isLockedByMe}
            />
          </div>

          {/* Panel de precedentes */}
          <div className="w-full lg:w-80 bg-gray-50 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#002E6D]" />
              <h4 className="text-xs font-black text-[#002E6D] uppercase tracking-widest">Precedentes Relevantes</h4>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Casos internos similares encontrados por el sistema. Úsalos como referencia al redactar.
            </p>

            {sugerencias?.length === 0 && (
              <p className="text-[10px] text-gray-400 italic">No se encontraron precedentes para esta tutela.</p>
            )}

            <div className="space-y-3">
              {sugerencias?.slice(0, 5).map((s, i) => (
                <div key={i} className="p-3 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <p className="text-[10px] font-bold text-gray-800 leading-relaxed line-clamp-3">{s.titulo_referencia}</p>
                  {s.categoria && (
                    <span className="inline-block mt-1 text-[8px] font-bold uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                      {s.categoria}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-3xl flex flex-col sm:flex-row justify-between items-center gap-4 px-8 md:px-12">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-sm leading-relaxed text-center sm:text-left">
            Borrador sujeto a revisión jurídica antes de ser radicado.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none px-8 py-3 text-gray-500 font-bold text-xs hover:text-gray-700 bg-white border border-gray-200 rounded-xl transition-colors uppercase tracking-widest"
            >
              Cerrar
            </button>
            <button
              onClick={() => generarBorradorPDF({ tutela, contenido: aiDraftContent })}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 border border-[#002E6D] text-[#002E6D] rounded-xl font-black text-xs hover:bg-blue-50 transition-all uppercase tracking-widest"
            >
              <Download size={14} /> Exportar PDF
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(aiDraftContent); toast.success('Copiado al portapapeles'); }}
              className="flex-1 sm:flex-none px-10 py-3 bg-[#002E6D] text-white rounded-xl font-black text-xs hover:bg-[#001d4a] transition-all shadow-lg active:scale-95 uppercase tracking-widest"
            >
              Copiar Borrador
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
