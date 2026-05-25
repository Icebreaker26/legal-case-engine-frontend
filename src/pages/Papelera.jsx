import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';
import { Trash2, RefreshCw, Eye, X } from 'lucide-react';

export default function Papelera() {
  const [items, setItems] = useState({ tutelas: [], memoria: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');

  useEffect(() => {
    fetchPapelera();
  }, []);

  const fetchPapelera = async () => {
    try {
      const { data } = await apiService.get('/tutelas/papelera');
      setItems(data);
    } catch (err) {
      toast.error('Error cargando la papelera');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (item, tipo) => {
    try {
      if (tipo === 'memoria') {
        const { data } = await apiService.get(`/tutelas/documento-referencia/${item.documento_id}`);
        setDocContent(data.texto_completo);
        setSelectedDoc(item.titulo_referencia);
      } else if (tipo === 'tutela') {
        setDocContent(item.contenido_original || 'Sin contenido original disponible.');
        setSelectedDoc(`Tutela: ${item.radicado}`);
      }
    } catch (err) {
      toast.error('Error al cargar contenido');
    }
  };

  const handleRestaurar = async (id, tipo) => {
    try {
      await apiService.post('/tutelas/restaurar', { id, tipo });
      toast.success('Restaurado correctamente');
      fetchPapelera();
    } catch (err) {
      toast.error('Error al restaurar');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando papelera...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-8 flex items-center gap-2">
        <Trash2 /> Papelera de Reciclaje
      </h1>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white p-12 rounded-sm shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-8 border-b pb-4 text-gray-800 uppercase tracking-wide">{selectedDoc}</h2>
            <div className="font-serif text-gray-900 leading-relaxed text-justify">
              <pre className="whitespace-pre-wrap font-serif text-base">{docContent}</pre>
            </div>
            <button onClick={() => setSelectedDoc(null)} className="mt-8 w-full bg-gray-800 text-white py-3 rounded-none font-bold uppercase tracking-widest text-sm transition">Cerrar</button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Tutelas Eliminadas</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {items.tutelas.length === 0 ? <p className="p-6 text-gray-500">Vacío</p> : items.tutelas.map(t => (
              <div key={t.id} className="p-4 border-b flex justify-between items-center">
                <span>{t.radicado} - {t.accionante}</span>
                <div className="flex gap-4">
                    <button onClick={() => handleView(t, 'tutela')} className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm font-bold">
                        <Eye size={14}/> Ver
                    </button>
                    <button onClick={() => handleRestaurar(t.id, 'tutela')} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold">
                        <RefreshCw size={14}/> Restaurar
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Documentos de Conocimiento Eliminados</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {items.memoria.length === 0 ? <p className="p-6 text-gray-500">Vacío</p> : items.memoria.map(m => (
              <div key={m.documento_id} className="p-4 border-b flex justify-between items-center">
                <span>{m.titulo_referencia}</span>
                <div className="flex gap-4">
                    <button onClick={() => handleView(m, 'memoria')} className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm font-bold">
                        <Eye size={14}/> Ver
                    </button>
                    <button onClick={() => handleRestaurar(m.documento_id, 'memoria')} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold">
                        <RefreshCw size={14}/> Restaurar
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
