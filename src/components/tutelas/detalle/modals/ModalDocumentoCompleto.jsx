import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ModalDocumentoCompleto({ 
  isOpen, 
  onClose, 
  docTitulo, 
  documentoCompleto, 
  loadingDoc 
}) {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{docTitulo}</h3>
                    <p className="text-xs text-[#002E6D] font-black uppercase tracking-widest mt-1">Documento Completo de Referencia</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 md:p-12 font-serif text-gray-700 leading-relaxed text-justify bg-white selection:bg-blue-100">
                {loadingDoc ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="w-12 h-12 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Reconstruyendo documento desde la memoria local...</p>
                    </div>
                ) : (
                    renderFormattedText(documentoCompleto || 'No se pudo cargar el contenido.')
                )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex justify-end">
                <button 
                  onClick={() => { navigator.clipboard.writeText(documentoCompleto); toast.success('Copiado'); }} 
                  className="px-8 py-3 bg-[#002E6D] text-white rounded-xl font-bold text-sm hover:bg-[#001d4a] transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2 uppercase tracking-wider"
                >
                    Copiar Todo el Documento
                </button>
            </div>
        </div>
    </div>
  );
}
