import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import { toast } from 'react-hot-toast';
import { Trash2, RotateCcw, Eye, X, FileText, Scale } from 'lucide-react';

export default function Papelera() {
  const [items, setItems]       = useState({ tutelas: [], memoria: [] });
  const [loading, setLoading]   = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent]   = useState('');
  const [loadingDoc, setLoadingDoc]   = useState(false);
  const [tab, setTab] = useState('tutelas');

  useEffect(() => { fetchPapelera(); }, []);

  const fetchPapelera = async () => {
    try {
      const { data } = await apiService.get('/tutelas/papelera');
      setItems(data);
    } catch { toast.error('Error cargando la papelera'); }
    finally  { setLoading(false); }
  };

  const handleView = async (item, tipo) => {
    setLoadingDoc(true);
    setSelectedDoc(tipo === 'tutela' ? `Tutela: ${item.radicado}` : item.titulo_referencia);
    setDocContent('');
    try {
      if (tipo === 'memoria') {
        const { data } = await apiService.get(`/tutelas/documento-referencia/${item.documento_id}`);
        setDocContent(data.texto_completo);
      } else {
        setDocContent(item.contenido_original || 'Sin contenido original disponible.');
      }
    } catch { toast.error('Error al cargar contenido'); }
    finally  { setLoadingDoc(false); }
  };

  const handleRestaurar = async (id, tipo) => {
    try {
      await apiService.post('/tutelas/restaurar', { id, tipo });
      toast.success('Restaurado correctamente');
      fetchPapelera();
    } catch { toast.error('Error al restaurar'); }
  };

  const total = items.tutelas.length + items.memoria.length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Papelera</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total === 0 ? 'No hay elementos eliminados.' : `${total} elemento${total > 1 ? 's' : ''} eliminado${total > 1 ? 's' : ''} — puedes restaurarlos en cualquier momento.`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100">
        {[
          { id: 'tutelas', label: `Peticiones`, count: items.tutelas.length },
          { id: 'memoria', label: `Documentos de conocimiento`, count: items.memoria.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-[#002E6D] text-[#002E6D]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.id ? 'bg-[#002E6D] text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lista tutelas */}
      {tab === 'tutelas' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {items.tutelas.length === 0 ? (
            <EmptyState label="No hay tutelas eliminadas." />
          ) : items.tutelas.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-4 px-6 py-4 ${i < items.tutelas.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <Scale size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.radicado}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{t.accionante}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleView(t, 'tutela')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye size={13} /> Ver
                </button>
                <button
                  onClick={() => handleRestaurar(t.id, 'tutela')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#002E6D] border border-[#002E6D]/20 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RotateCcw size={13} /> Restaurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista memoria */}
      {tab === 'memoria' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {items.memoria.length === 0 ? (
            <EmptyState label="No hay documentos de conocimiento eliminados." />
          ) : items.memoria.map((m, i) => (
            <div key={m.documento_id} className={`flex items-center gap-4 px-6 py-4 ${i < items.memoria.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{m.titulo_referencia}</p>
                {m.categoria && <p className="text-xs text-gray-400 mt-0.5">{m.categoria}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleView(m, 'memoria')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye size={13} /> Ver
                </button>
                <button
                  onClick={() => handleRestaurar(m.documento_id, 'memoria')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#002E6D] border border-[#002E6D]/20 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <RotateCcw size={13} /> Restaurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal visor */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800 truncate pr-4">{selectedDoc}</h2>
              <button onClick={() => setSelectedDoc(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {loadingDoc ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-serif text-sm text-gray-800 leading-relaxed">{docContent}</pre>
              )}
            </div>
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-6 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
        <Trash2 size={18} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
