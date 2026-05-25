import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';
import { BookOpen, FileText, Calendar, Trash2, Eye } from 'lucide-react';

export default function Memoria() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');

  const renderFormattedText = (text) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      // Detectar encabezados numerados (ej: "1. RESPUESTA")
      if (/^\d+\./.test(trimmedLine)) {
        return <p key={index} className="font-bold text-gray-900 mt-6 mb-2">{line}</p>;
      }
      // Detectar líneas completamente en mayúsculas como encabezados
      if (trimmedLine.length > 5 && trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.match(/^\d/)) {
        return <p key={index} className="font-bold text-gray-900 mt-6 mb-2">{line}</p>;
      }
      // Detectar líneas clave (ej: "Referencia:")
      if (trimmedLine.endsWith(':')) {
        return <p key={index} className="font-semibold text-gray-800 mt-4">{line}</p>;
      }
      // Párrafos normales
      return <p key={index} className="mb-4">{line || <br />}</p>;
    });
  };

  useEffect(() => {
    fetchMemoria();
  }, []);

  const fetchMemoria = async () => {
    try {
      const { data } = await apiService.get('/tutelas/memoria');
      setDocs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Error cargando memoria legal');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (documento_id) => {
    try {
      const { data } = await apiService.get(`/tutelas/documento-referencia/${documento_id}`);
      setDocContent(data.texto_completo);
      setSelectedDoc(documento_id);
    } catch (err) {
      toast.error('Error al cargar el contenido');
    }
  };

  const handleDelete = async (documento_id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este documento de la base de conocimiento?')) return;
    try {
      await apiService.delete(`/tutelas/memoria/${documento_id}`);
      toast.success('Documento eliminado');
      fetchMemoria();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando base de conocimiento...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-blue-600" />
          Memoria Institucional (RAG)
        </h1>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white p-12 rounded-sm shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-8 border-b pb-4 text-gray-800 uppercase tracking-wide">Contenido del Documento</h2>
            <div className="font-serif text-gray-900 leading-relaxed text-justify">
              {renderFormattedText(docContent)}
            </div>
            <button onClick={() => setSelectedDoc(null)} className="mt-8 w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-none font-bold uppercase tracking-widest text-sm transition">
              Cerrar Documento
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docs.map((doc) => (
          <div key={doc.documento_id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded uppercase">{doc.categoria}</span>
              <FileText className="text-gray-400" size={20} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 flex-1">{doc.titulo_referencia}</h3>
            <div className="flex items-center text-sm text-gray-500 gap-2 mb-4">
              <Calendar size={14} />
              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleView(doc.documento_id)} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2 rounded text-sm font-medium transition">
                <Eye size={16} /> Ver
              </button>
              <button onClick={() => handleDelete(doc.documento_id)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded text-sm font-medium transition">
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
