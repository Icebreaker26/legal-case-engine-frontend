import { X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ModalDocumentoCompleto({
  isOpen,
  onClose,
  docTitulo,
  documentoCompleto,
  loadingDoc
}) {
  if (!isOpen) return null;

  // documentoCompleto ahora puede ser string (legado) o el objeto {titulo, chunks, ...}
  const esNuevoFormato = documentoCompleto && typeof documentoCompleto === 'object' && documentoCompleto.chunks;

  const textoParaCopiar = esNuevoFormato
    ? documentoCompleto.chunks.map(c => c.contenido).join('\n\n')
    : (documentoCompleto || '');

  const titulo     = esNuevoFormato ? documentoCompleto.titulo    : docTitulo;
  const categoria  = esNuevoFormato ? documentoCompleto.categoria : null;
  const totalChunks = esNuevoFormato ? documentoCompleto.total_chunks : null;

  const renderLegado = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (t.length > 5 && t === t.toUpperCase() && !/^\d/.test(t))
        return <p key={i} className="font-bold text-gray-900 mt-6 mb-2">{line}</p>;
      if (t.endsWith(':'))
        return <p key={i} className="font-semibold text-gray-800 mt-4">{line}</p>;
      return <p key={i} className="mb-3">{line || <br />}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/80">
          <div>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{titulo}</h3>
            <div className="flex items-center gap-3 mt-1">
              {categoria && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#002E6D] text-white px-2 py-0.5 rounded">
                  {categoria}
                </span>
              )}
              {totalChunks && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <BookOpen size={10} /> {totalChunks} {totalChunks === 1 ? 'fragmento' : 'fragmentos'}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
          {loadingDoc ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="w-12 h-12 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cargando documento...</p>
            </div>
          ) : esNuevoFormato ? (
            <div className="space-y-3">
              {documentoCompleto.chunks.map((chunk, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-5 border text-sm leading-relaxed font-serif text-justify transition-all ${
                    chunk.es_match
                      ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-200'
                      : 'bg-gray-50 border-gray-100 text-gray-600'
                  }`}
                >
                  {chunk.es_match && (
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-2 py-0.5 rounded mb-3">
                      Fragmento relevante
                    </span>
                  )}
                  <p className={chunk.es_match ? 'text-gray-900' : 'text-gray-500'}>
                    {chunk.contenido}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-serif text-gray-700 leading-relaxed text-justify">
              {renderLegado(textoParaCopiar || 'No se pudo cargar el contenido.')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex justify-end">
          <button
            onClick={() => { navigator.clipboard.writeText(textoParaCopiar); toast.success('Copiado'); }}
            className="px-8 py-3 bg-[#002E6D] text-white rounded-xl font-bold text-sm hover:bg-[#001d4a] transition-all shadow-md active:scale-95 uppercase tracking-wider"
          >
            Copiar Todo
          </button>
        </div>
      </div>
    </div>
  );
}
