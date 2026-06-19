import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';
import { BookOpen, FileText, Calendar, Trash2, Eye, Download, X, Tag } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Memoria() {
  const [docs, setDocs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docTitulo, setDocTitulo]   = useState('');
  const [docCategoria, setDocCategoria] = useState('');
  const [exportingId, setExportingId] = useState(null);

  useEffect(() => { fetchMemoria(); }, []);

  const fetchMemoria = async () => {
    try {
      const { data } = await apiService.get('/tutelas/memoria');
      setDocs(Array.isArray(data) ? data : []);
    } catch { toast.error('Error cargando memoria legal'); setDocs([]); }
    finally  { setLoading(false); }
  };

  const handleView = async (doc) => {
    try {
      const { data } = await apiService.get(`/tutelas/documento-referencia/${doc.documento_id}`);
      const texto = data.chunks
        ? data.chunks.map(c => c.contenido).join('\n\n')
        : (data.texto_completo || '');
      setDocContent(texto);
      setDocTitulo(doc.titulo_referencia);
      setDocCategoria(doc.categoria);
      setSelectedDoc(doc.documento_id);
    } catch { toast.error('Error al cargar el contenido'); }
  };

  const handleExportPDF = async (doc) => {
    setExportingId(doc.documento_id);
    try {
      const { data } = await apiService.get(`/tutelas/documento-referencia/${doc.documento_id}`);
      const texto = data.chunks
        ? data.chunks.map(c => c.contenido).join('\n\n')
        : (data.texto_completo || '');

      const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W    = pdf.internal.pageSize.width;
      const H    = pdf.internal.pageSize.height;
      const margin = 18;
      const usable = W - margin * 2;

      // Cabecera azul
      pdf.setFillColor(0, 46, 109);
      pdf.rect(0, 0, W, 32, 'F');
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Memoria Legal — Documento de Conocimiento', margin, 13);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Categoría: ${doc.categoria || 'General'}  ·  Generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 22);

      // Título del documento
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 46, 109);
      const tituloLines = pdf.splitTextToSize(doc.titulo_referencia, usable);
      pdf.text(tituloLines, margin, 44);

      let y = 44 + tituloLines.length * 6 + 6;
      pdf.setDrawColor(0, 46, 109);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, W - margin, y);
      y += 8;

      // Cuerpo
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(30, 30, 30);

      const paragraphs = texto.split('\n').filter(l => l.trim() !== '');
      for (const para of paragraphs) {
        const isHeader = para.trim() === para.trim().toUpperCase() && para.trim().length > 4;
        if (isHeader) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
        } else {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
        }
        const lines = pdf.splitTextToSize(para, usable);
        if (y + lines.length * 5 > H - 16) {
          pdf.addPage();
          y = 18;
        }
        pdf.text(lines, margin, y);
        y += lines.length * 5.2 + (isHeader ? 4 : 3);
      }

      // Pie de página en cada hoja
      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.text(`Página ${i} de ${total}`, W / 2, H - 6, { align: 'center' });
        pdf.text('Memoria Legal — Uso Interno', margin, H - 6);
      }

      const filename = `memoria_${doc.titulo_referencia.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);
      toast.success('PDF exportado correctamente');
    } catch { toast.error('Error al generar el PDF'); }
    finally  { setExportingId(null); }
  };

  const handleDelete = async (documento_id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este documento de la base de conocimiento?')) return;
    try {
      await apiService.delete(`/tutelas/memoria/${documento_id}`);
      toast.success('Documento eliminado');
      fetchMemoria();
    } catch { toast.error('Error al eliminar'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-11 h-11 bg-[#002E6D] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Memoria Institucional</h1>
          <p className="text-sm text-gray-400 mt-0.5">{docs.length} documento{docs.length !== 1 ? 's' : ''} en la base de conocimiento legal</p>
        </div>
      </div>

      {/* Grid de documentos */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <BookOpen size={22} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No hay documentos en la memoria legal.<br/>Usa la sección Entrenar para agregar conocimiento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {docs.map(doc => (
            <div key={doc.documento_id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide bg-blue-50 text-[#002E6D] border border-blue-100">
                    <Tag size={10} />{doc.categoria || 'General'}
                  </span>
                  <FileText size={16} className="text-gray-300 shrink-0 mt-0.5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-800 leading-snug mb-3 line-clamp-3">{doc.titulo_referencia}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>{new Date(doc.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {doc.es_exitosa && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">Exitosa</span>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => handleView(doc)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 transition-colors"
                >
                  <Eye size={13} /> Ver
                </button>
                <button
                  onClick={() => handleExportPDF(doc)}
                  disabled={exportingId === doc.documento_id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#002E6D] border border-blue-100 transition-colors disabled:opacity-60"
                >
                  {exportingId === doc.documento_id
                    ? <div className="w-3 h-3 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
                    : <Download size={13} />
                  }
                  PDF
                </button>
                <button
                  onClick={() => handleDelete(doc.documento_id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal visor */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-8 py-5 border-b border-gray-100">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#002E6D] bg-blue-50 px-2 py-0.5 rounded-full">{docCategoria}</span>
                <h2 className="text-sm font-semibold text-gray-800 mt-1.5 leading-snug">{docTitulo}</h2>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="font-serif text-sm text-gray-800 leading-relaxed whitespace-pre-wrap text-justify">{docContent}</div>
            </div>
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setSelectedDoc(null)} className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
              <button
                onClick={() => handleExportPDF(docs.find(d => d.documento_id === selectedDoc))}
                disabled={exportingId === selectedDoc}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-[#002E6D] text-white rounded-xl hover:bg-[#001d4a] transition-colors disabled:opacity-60"
              >
                <Download size={14} /> Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
