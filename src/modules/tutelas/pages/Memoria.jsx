import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import { toast } from 'react-hot-toast';
import {
  BookOpen, FileText, Calendar, Trash2, Eye, Download, X, Tag,
  Sparkles, Copy, Check, Loader2, ChevronDown, ChevronUp, Brain, Search,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const RESULTADO_STYLE = {
  favorable:    'bg-green-50 text-green-700 border-green-100',
  desfavorable: 'bg-red-50 text-red-700 border-red-100',
  referencia:   'bg-gray-50 text-gray-600 border-gray-100',
};

export default function Memoria() {
  const [docs, setDocs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('documentos');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent]   = useState('');
  const [docTitulo, setDocTitulo]     = useState('');
  const [docCategoria, setDocCategoria] = useState('');
  const [exportingId, setExportingId] = useState(null);
  const [comprensionState, setComprensionState] = useState({});
  const [busquedaDocs, setBusquedaDocs]         = useState('');
  const [busquedaAnalisis, setBusquedaAnalisis] = useState('');

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

      pdf.setFillColor(0, 46, 109);
      pdf.rect(0, 0, W, 32, 'F');
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
      pdf.text('Memoria Legal — Documento de Conocimiento', margin, 13);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text(`Categoría: ${doc.categoria || 'General'}  ·  ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 22);

      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 46, 109);
      const tituloLines = pdf.splitTextToSize(doc.titulo_referencia, usable);
      pdf.text(tituloLines, margin, 44);

      let y = 44 + tituloLines.length * 6 + 6;
      pdf.setDrawColor(0, 46, 109); pdf.setLineWidth(0.3);
      pdf.line(margin, y, W - margin, y); y += 8;

      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor(30, 30, 30);
      for (const para of texto.split('\n').filter(l => l.trim())) {
        const isHeader = para.trim() === para.trim().toUpperCase() && para.trim().length > 4;
        pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
        pdf.setFontSize(isHeader ? 10 : 9.5);
        const lines = pdf.splitTextToSize(para, usable);
        if (y + lines.length * 5 > H - 16) { pdf.addPage(); y = 18; }
        pdf.text(lines, margin, y);
        y += lines.length * 5.2 + (isHeader ? 4 : 3);
      }

      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(160, 160, 160);
        pdf.text(`Página ${i} de ${total}`, W / 2, H - 6, { align: 'center' });
        pdf.text('Memoria Legal — Uso Interno', margin, H - 6);
      }
      pdf.save(`memoria_${doc.titulo_referencia.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success('PDF exportado correctamente');
    } catch { toast.error('Error al generar el PDF'); }
    finally  { setExportingId(null); }
  };

  const handleExportPDFConAnalisis = async (doc) => {
    setExportingId(`analisis-${doc.documento_id}`);
    try {
      const { data } = await apiService.get(`/tutelas/documento-referencia/${doc.documento_id}`);
      const texto = data.chunks
        ? data.chunks.map(c => c.contenido).join('\n\n')
        : (data.texto_completo || '');
      const c = doc.comprension_doc || {};

      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W      = pdf.internal.pageSize.width;
      const H      = pdf.internal.pageSize.height;
      const margin = 18;
      const usable = W - margin * 2;

      // ── Cabecera ──────────────────────────────────────────────────────────
      pdf.setFillColor(0, 46, 109);
      pdf.rect(0, 0, W, 32, 'F');
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
      pdf.text('Memoria Legal — Documento + Análisis Semántico', margin, 13);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text(`Categoría: ${doc.categoria || 'General'}  ·  ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, 22);

      // ── Título ────────────────────────────────────────────────────────────
      pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 46, 109);
      const tituloLines = pdf.splitTextToSize(doc.titulo_referencia, usable);
      pdf.text(tituloLines, margin, 44);
      let y = 44 + tituloLines.length * 6 + 4;
      pdf.setDrawColor(0, 46, 109); pdf.setLineWidth(0.3);
      pdf.line(margin, y, W - margin, y); y += 8;

      // ── Bloque de análisis semántico ──────────────────────────────────────
      if (c.que_resuelve) {
        pdf.setFillColor(245, 243, 255);           // fondo morado claro
        pdf.roundedRect(margin, y, usable, 6, 2, 2, 'F');
        pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(109, 40, 217);
        pdf.text('ANÁLISIS SEMÁNTICO — RAG+', margin + 3, y + 4.2);
        y += 10;

        const filas = [
          ['Qué resuelve',          c.que_resuelve || '—'],
          ['Tipo de caso',          c.tipo_caso    || '—'],
          ['Resultado',             c.resultado    || '—'],
          ['Derechos involucrados', (c.derechos_involucrados || []).join(', ') || '—'],
        ];
        for (const [label, valor] of filas) {
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(80, 80, 80);
          pdf.text(`${label}:`, margin, y);
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 30, 30);
          const vLines = pdf.splitTextToSize(valor, usable - 48);
          pdf.text(vLines, margin + 48, y);
          y += vLines.length * 4.8 + 2;
          if (y > H - 20) { pdf.addPage(); y = 16; }
        }
        y += 4;
        pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2);
        pdf.line(margin, y, W - margin, y); y += 8;
      }

      // ── Contenido legal completo ───────────────────────────────────────────
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 46, 109);
      pdf.text('DOCUMENTO LEGAL COMPLETO', margin, y); y += 7;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor(30, 30, 30);

      for (const para of texto.split('\n').filter(l => l.trim())) {
        const isHeader = para.trim() === para.trim().toUpperCase() && para.trim().length > 4;
        pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
        pdf.setFontSize(isHeader ? 10 : 9.5);
        const lines = pdf.splitTextToSize(para, usable);
        if (y + lines.length * 5 > H - 16) { pdf.addPage(); y = 18; }
        pdf.text(lines, margin, y);
        y += lines.length * 5.2 + (isHeader ? 4 : 3);
      }

      // ── Pie de página ──────────────────────────────────────────────────────
      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(160, 160, 160);
        pdf.text(`Página ${i} de ${total}`, W / 2, H - 6, { align: 'center' });
        pdf.text('Memoria Legal — Uso Interno', margin, H - 6);
      }

      pdf.save(`memoria_analisis_${doc.titulo_referencia.slice(0, 35).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success('PDF con análisis exportado');
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

  // ── Comprensión ────────────────────────────────────────────────────────────
  const setCs = (docId, patch) =>
    setComprensionState(prev => ({ ...prev, [docId]: { ...prev[docId], ...patch } }));

  const handleAbrirComprension = async (doc) => {
    const cs = comprensionState[doc.documento_id] || {};
    if (cs.open) { setCs(doc.documento_id, { open: false }); return; }
    setCs(doc.documento_id, { open: true });
    if (!cs.prompt) {
      try {
        const { data } = await apiService.get(`/tutelas/memoria/${doc.documento_id}/prompt-comprension`);
        setCs(doc.documento_id, { prompt: data.prompt });
      } catch { toast.error('Error al generar el prompt'); }
    }
  };

  const handleCopiarPromptDoc = (docId) => {
    navigator.clipboard.writeText(comprensionState[docId]?.prompt || '');
    setCs(docId, { copiado: true });
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCs(docId, { copiado: false }), 2000);
  };

  const handleGuardarComprensionDoc = async (doc) => {
    const json = comprensionState[doc.documento_id]?.json || '';
    if (!json.trim()) return toast.error('Pega el JSON del LLM primero.');
    setCs(doc.documento_id, { saving: true });
    try {
      const { data } = await apiService.post(`/tutelas/memoria/${doc.documento_id}/comprension`, { json_comprension: json });
      setDocs(prev => prev.map(d =>
        d.documento_id === doc.documento_id
          ? { ...d, tiene_comprension: true, comprension_doc: data.comprension }
          : d
      ));
      setCs(doc.documento_id, { open: false, json: '', prompt: '' });
      toast.success('Comprensión guardada — RAG semántico activo');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'JSON inválido.');
    } finally {
      setCs(doc.documento_id, { saving: false });
    }
  };

  // ── Derivados ──────────────────────────────────────────────────────────────
  const docsFiltrados = busquedaDocs.trim()
    ? docs.filter(d => {
        const q = busquedaDocs.toLowerCase();
        return (
          d.titulo_referencia?.toLowerCase().includes(q) ||
          d.categoria?.toLowerCase().includes(q)
        );
      })
    : docs;

  const docsConAnalisis = docs.filter(d => d.tiene_comprension);

  const docsAnalisisFiltrados = busquedaAnalisis.trim()
    ? docsConAnalisis.filter(doc => {
        const q = busquedaAnalisis.toLowerCase();
        const c = doc.comprension_doc || {};
        return (
          (c.que_resuelve     || '').toLowerCase().includes(q) ||
          (c.tipo_caso        || '').toLowerCase().includes(q) ||
          (c.resultado        || '').toLowerCase().includes(q) ||
          (c.derechos_involucrados || []).some(d => d.toLowerCase().includes(q)) ||
          (doc.titulo_referencia  || '').toLowerCase().includes(q) ||
          (doc.categoria          || '').toLowerCase().includes(q)
        );
      })
    : docsConAnalisis;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 bg-[#002E6D] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Memoria Institucional</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {docs.length} documento{docs.length !== 1 ? 's' : ''} en la base de conocimiento
            {docsConAnalisis.length > 0 && <> · <span className="text-purple-600 font-semibold">{docsConAnalisis.length} con RAG semántico</span></>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: 'documentos', label: `Documentos (${docs.length})`, icon: <FileText size={14} /> },
          { key: 'analisis',   label: `Análisis semántico (${docsConAnalisis.length})`, icon: <Brain size={14} /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === t.key
                ? 'bg-white text-[#002E6D] shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TAB: DOCUMENTOS                        */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'documentos' && (
        docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <BookOpen size={22} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No hay documentos en la memoria legal.</p>
          </div>
        ) : (
          <>
            {/* Barra de búsqueda */}
            <div className="flex items-center gap-3 mb-1">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por título o categoría..."
                  value={busquedaDocs}
                  onChange={e => setBusquedaDocs(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#002E6D]/20 focus:border-[#002E6D] transition-all"
                />
                {busquedaDocs && (
                  <button
                    onClick={() => setBusquedaDocs('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              {busquedaDocs && (
                <span className="text-xs text-gray-400 shrink-0 font-medium">
                  {docsFiltrados.length} resultado{docsFiltrados.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {docsFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <Search size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400 font-semibold">Sin resultados para "{busquedaDocs}"</p>
                <button onClick={() => setBusquedaDocs('')} className="text-xs text-[#002E6D] hover:underline">Limpiar búsqueda</button>
              </div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {docsFiltrados.map(doc => {
              const cs = comprensionState[doc.documento_id] || {};
              return (
                <div key={doc.documento_id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide bg-blue-50 text-[#002E6D] border border-blue-100">
                        <Tag size={10} />{doc.categoria || 'General'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.tiene_comprension && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 uppercase">RAG+</span>
                        )}
                        <FileText size={15} className="text-gray-300" />
                      </div>
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

                  {/* Panel comprensión expandible */}
                  {cs.open && (
                    <div className="mx-4 mb-3 border border-purple-100 rounded-xl bg-purple-50/40 p-4 space-y-3">
                      {cs.prompt ? (
                        <>
                          <div>
                            <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1.5">Prompt — cópialo al LLM</p>
                            <div className="bg-white border border-purple-100 rounded-lg p-3 max-h-24 overflow-y-auto">
                              <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">{cs.prompt}</pre>
                            </div>
                            <button
                              onClick={() => handleCopiarPromptDoc(doc.documento_id)}
                              className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-purple-700 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              {cs.copiado ? <><Check size={11} className="text-green-600" /> Copiado</> : <><Copy size={11} /> Copiar</>}
                            </button>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1.5">Pega el JSON del LLM</p>
                            <textarea
                              className="w-full h-24 p-2 border border-purple-200 rounded-lg text-[10px] font-mono outline-none focus:ring-2 focus:ring-purple-400 bg-white resize-none"
                              value={cs.json || ''}
                              onChange={e => setCs(doc.documento_id, { json: e.target.value })}
                              placeholder={'{\n  "que_resuelve": "...",\n  "tipo_caso": "...",\n  ...\n}'}
                            />
                            <button
                              onClick={() => handleGuardarComprensionDoc(doc)}
                              disabled={cs.saving || !cs.json?.trim()}
                              className="mt-1.5 w-full py-2 bg-purple-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              {cs.saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                              Guardar → activar RAG semántico
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center py-3">
                          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          <span className="ml-2 text-[10px] text-purple-500">Generando prompt...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="px-4 pb-4 flex gap-2">
                    <button onClick={() => handleView(doc)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 transition-colors">
                      <Eye size={13} /> Ver
                    </button>
                    <button
                      onClick={() => handleExportPDF(doc)}
                      disabled={!!exportingId}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#002E6D] border border-blue-100 transition-colors disabled:opacity-60"
                      title="Exportar solo el documento"
                    >
                      {exportingId === doc.documento_id
                        ? <div className="w-3 h-3 border-2 border-[#002E6D] border-t-transparent rounded-full animate-spin" />
                        : <Download size={13} />}
                      PDF
                    </button>
                    {doc.tiene_comprension && (
                      <button
                        onClick={() => handleExportPDFConAnalisis(doc)}
                        disabled={!!exportingId}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 transition-colors disabled:opacity-60"
                        title="Exportar documento + análisis semántico"
                      >
                        {exportingId === `analisis-${doc.documento_id}`
                          ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          : <Download size={13} />}
                        PDF+
                      </button>
                    )}
                    <button
                      onClick={() => handleAbrirComprension(doc)}
                      title={doc.tiene_comprension ? 'Actualizar comprensión' : 'Analizar para RAG semántico'}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        doc.tiene_comprension
                          ? 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-100'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-100'
                      }`}
                    >
                      <Sparkles size={13} />
                      {cs.open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    <button onClick={() => handleDelete(doc.documento_id)} className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </>
        )
      )}

      {/* ═══════════════════════════════════════ */}
      {/* TAB: ANÁLISIS SEMÁNTICO                */}
      {/* ═══════════════════════════════════════ */}
      {activeTab === 'analisis' && (
        docsConAnalisis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Brain size={22} className="text-purple-300" />
            </div>
            <p className="text-sm text-gray-500 font-semibold">Ningún documento tiene análisis semántico aún.</p>
            <p className="text-xs text-gray-400">Usa el botón ✦ en la pestaña Documentos para analizar cada uno.</p>
          </div>
        ) : (
          <>
            {/* Buscador */}
            <div className="relative mb-6 max-w-lg">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={busquedaAnalisis}
                onChange={e => setBusquedaAnalisis(e.target.value)}
                placeholder="Buscar por tema, tipo de caso, derecho, resultado..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-white transition-all"
              />
              {busquedaAnalisis && (
                <button
                  onClick={() => setBusquedaAnalisis('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {docsAnalisisFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <Search size={28} className="text-gray-300" />
                <p className="text-sm text-gray-400 font-semibold">Sin resultados para "{busquedaAnalisis}"</p>
                <button onClick={() => setBusquedaAnalisis('')} className="text-xs text-purple-600 hover:underline mt-1">Limpiar búsqueda</button>
              </div>
            ) : (
              <>
                {busquedaAnalisis && (
                  <p className="text-xs text-gray-400 mb-4">{docsAnalisisFiltrados.length} resultado{docsAnalisisFiltrados.length !== 1 ? 's' : ''} para "{busquedaAnalisis}"</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {docsAnalisisFiltrados.map(doc => {
              const c = doc.comprension_doc || {};
              const resultadoStyle = RESULTADO_STYLE[c.resultado] || RESULTADO_STYLE.referencia;
              return (
                <div key={doc.documento_id} className="bg-white border border-purple-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 space-y-4">
                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#002E6D] border border-blue-100 uppercase tracking-wide">
                        <Tag size={9} />{doc.categoria || 'General'}
                      </span>
                      {c.resultado && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${resultadoStyle}`}>
                          {c.resultado}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100 uppercase shrink-0">RAG+</span>
                  </div>

                  {/* Título del documento */}
                  <p className="text-xs text-gray-500 leading-snug line-clamp-2">{doc.titulo_referencia}</p>

                  {/* Que resuelve */}
                  {c.que_resuelve && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">Qué resuelve</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.que_resuelve}</p>
                    </div>
                  )}

                  {/* Tipo de caso */}
                  {c.tipo_caso && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo de caso</p>
                      <p className="text-xs text-gray-600">{c.tipo_caso}</p>
                    </div>
                  )}

                  {/* Derechos involucrados */}
                  {c.derechos_involucrados?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Derechos / figuras jurídicas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.derechos_involucrados.map((d, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportPDFConAnalisis(doc)}
                        disabled={!!exportingId}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-purple-700 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        title="Exportar documento + análisis"
                      >
                        {exportingId === `analisis-${doc.documento_id}`
                          ? <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          : <Download size={11} />}
                        Exportar PDF+
                      </button>
                      <button
                        onClick={() => handleView(doc)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#002E6D] hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={11} /> Ver completo
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
              </div>
            </>
          )}
        </>
        )
      )}

      {/* Modal visor de contenido completo */}
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
