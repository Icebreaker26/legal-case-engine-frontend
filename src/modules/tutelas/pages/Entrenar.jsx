import { useState, useEffect, useRef } from 'react';
import { Database, Upload, CheckCircle, FileText, X, ChevronRight, Info } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import SearchableSelect from '../../../components/SearchableSelect';

export default function Entrenar() {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const inputRef = useRef(null);

  const [formData, setFormData] = useState({
    categoria: '',
    titulo_referencia: '',
    contenido_legal: '',
    es_exitosa: true,
  });

  useEffect(() => {
    apiService.get('/core/categorias').then(r => setCategorias(r.data)).catch(() => toast.error('Error cargando categorías'));
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else toast.error('Solo se aceptan archivos PDF');
  };
  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (f?.type === 'application/pdf') setFile(f);
    else toast.error('Solo se aceptan archivos PDF');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoria) return toast.error('Selecciona una categoría');
    if (!file && !formData.contenido_legal.trim()) return toast.error('Debes subir un archivo o escribir el contenido legal');

    setLoading(true);
    try {
      const data = new FormData();
      data.append('categoria', formData.categoria);
      data.append('titulo_referencia', formData.titulo_referencia);
      data.append('es_exitosa', formData.es_exitosa);
      if (file) data.append('documento', file);
      else data.append('contenido_legal', formData.contenido_legal);

      await tutelaService.entrenarLocal(data);
      toast.success('Conocimiento guardado exitosamente');
      setDone(true);
    } catch {
      toast.error('Error al guardar el conocimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null); setDone(false);
    setFormData({ categoria: '', titulo_referencia: '', contenido_legal: '', es_exitosa: true });
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto py-24 flex flex-col items-center text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mb-6">
          <CheckCircle size={30} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Conocimiento guardado</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          El contenido fue vectorizado e indexado en la memoria local del sistema.
        </p>
        <div className="flex gap-3">
          <button onClick={handleReset} className="px-6 py-2.5 bg-[#002E6D] text-white text-sm font-semibold rounded-lg hover:bg-[#001d4a] transition-colors">
            Agregar otro
          </button>
          <a href="/" className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Ir a la bandeja
          </a>
        </div>
      </div>
    );
  }

  const fieldLabel = 'block text-sm font-medium text-gray-700 mb-1.5';
  const fieldInput = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#002E6D]/15 focus:border-[#002E6D] transition-colors bg-white';

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-fade-in">

      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <div className="w-11 h-11 bg-[#002E6D] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <Database size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Alimentar memoria local</h1>
          <p className="text-sm text-gray-500 mt-1">Agrega argumentos y contestaciones exitosas para fortalecer el motor de búsqueda semántica.</p>
        </div>
      </div>

      {/* Aviso privacidad */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-8">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          Todo el contenido se procesa localmente con vectores de 384 dimensiones.{' '}
          <span className="font-semibold">Ningún dato legal sale de la infraestructura corporativa.</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Categoría y título */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 rounded-t-2xl">
            <p className="text-sm font-semibold text-gray-800">Identificación del documento</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={fieldLabel}>Categoría jurídica <span className="text-red-400">*</span></label>
              <SearchableSelect
                variant="white"
                options={categorias}
                value={formData.categoria}
                onChange={nombre => setFormData({ ...formData, categoria: nombre })}
                placeholder="Seleccionar categoría..."
              />
            </div>
            <div>
              <label className={fieldLabel}>Título de referencia <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="Ej: Contestación Radicado 2024-001"
                className={fieldInput}
                value={formData.titulo_referencia}
                onChange={e => setFormData({ ...formData, titulo_referencia: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Contenido legal</p>
            <p className="text-xs text-gray-400 mt-0.5">Sube un PDF o escribe el argumento directamente.</p>
          </div>
          <div className="p-6 space-y-5">

            {/* Drop zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl transition-all duration-200 ${
                dragging ? 'border-[#002E6D] bg-blue-50/50' :
                file     ? 'border-gray-200 bg-gray-50/60'  :
                           'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/40'
              }`}
            >
              {!file ? (
                <label htmlFor="pdf-train" className="flex items-center gap-4 px-6 py-5 cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${dragging ? 'bg-[#002E6D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {dragging ? 'Suelta el archivo aquí' : 'Arrastra un PDF o haz clic para seleccionar'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Solo archivos PDF · Máximo 10 MB</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}
              <input ref={inputRef} id="pdf-train" type="file" className="hidden" accept=".pdf" onChange={onFileChange} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">o escribe directamente</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Textarea */}
            <textarea
              rows={7}
              placeholder="Pega aquí los párrafos o argumentos legales que quieres que el sistema aprenda..."
              className={`${fieldInput} resize-none font-serif leading-relaxed ${file ? 'opacity-40 cursor-not-allowed' : ''}`}
              value={formData.contenido_legal}
              disabled={!!file}
              onChange={e => setFormData({ ...formData, contenido_legal: e.target.value })}
            />
            {file && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <Info size={12} /> El texto será extraído automáticamente del PDF seleccionado.
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || (!file && !formData.contenido_legal.trim())}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              loading || (!file && !formData.contenido_legal.trim())
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#002E6D] text-white hover:bg-[#001d4a] shadow-sm hover:shadow-md'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vectorizando...
              </>
            ) : (
              <>
                Guardar en memoria
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
