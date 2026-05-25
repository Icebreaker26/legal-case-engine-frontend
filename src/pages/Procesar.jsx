import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, User, Clock, ChevronRight, Bookmark, X, Maximize2 } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

export default function Procesar() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [abogados, setAbogados] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Metadatos administrativos
  const [metadata, setMetadata] = useState({
    responsable_id: '',
    prioridad: 'Media',
    area_responsable: '',
    dias_termino: 2
  });

  // Estado para el modal de documento completo
  const [modalOpen, setModalOpen] = useState(false);
  const [documentoCompleto, setDocumentoCompleto] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docTitulo, setDocTitulo] = useState('');

  useEffect(() => {
    fetchAbogados();
    fetchAreas();
  }, []);

  const fetchAbogados = async () => {
    try {
      const response = await apiService.get('/admin/abogados-activos');
      setAbogados(response.data);
    } catch (err) {
      toast.error(`Error cargando lista: ${err.response?.status || err.message}`);
    }
  };

  const fetchAreas = async () => {
    try {
      const { data } = await apiService.get('/admin/areas');
      setAreas(data);
    } catch (err) {
      toast.error('Error cargando áreas');
    }
  };

  const handleVerDocumentoCompleto = async (sug) => {
    if (!sug.documento_id) {
        toast.error('Esta sugerencia no tiene referencia al documento original');
        return;
    }

    setLoadingDoc(true);
    setDocTitulo(sug.titulo_referencia);
    setModalOpen(true);
    try {
        const data = await tutelaService.obtenerDocumentoReferencia(sug.documento_id);
        setDocumentoCompleto(data.texto_completo);
    } catch (error) {
        toast.error('No se pudo recuperar el documento completo');
        setModalOpen(false);
    } finally {
        setLoadingDoc(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Por favor, sube un archivo PDF válido');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Debes seleccionar un archivo');

    setLoading(true);
    try {
      const data = await tutelaService.procesar(file, metadata);
      setResultado(data);
      toast.success('Tutela procesada localmente con éxito');
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar el documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in relative">
      
      {/* Modal de Documento Completo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">{docTitulo}</h3>
                        <p className="text-xs text-gray-500 font-medium">Documento Completo de Referencia</p>
                    </div>
                    <button 
                        onClick={() => {
                            setModalOpen(false);
                            setDocumentoCompleto('');
                        }}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-serif text-gray-700 leading-relaxed whitespace-pre-wrap bg-white">
                    {loadingDoc ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-[#002E6D] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm italic text-gray-400">Reconstruyendo documento desde la memoria local...</p>
                        </div>
                    ) : (
                        documentoCompleto || 'No se pudo cargar el contenido.'
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(documentoCompleto);
                            toast.success('Documento completo copiado');
                        }}
                        className="px-6 py-2 bg-[#002E6D] text-white rounded-lg font-bold text-sm hover:bg-[#001d4a] transition-all flex items-center gap-2"
                    >
                        Copiar Todo el Documento
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#002E6D] mb-2">Procesar Nueva Acción Exitosa</h1>
        <p className="text-gray-600">Carga el documento legal y asigna la gestión administrativa.</p>
      </div>

      {!resultado ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Carga de Archivo */}
          <div className="lg:col-span-1">
            <div className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white hover:border-[#002E6D]'}
            `}>
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".pdf" 
                onChange={handleFileChange} 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className={`p-4 rounded-full mb-4 ${file ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-[#002E6D]'}`}>
                  <Upload size={32} />
                </div>
                <span className="text-sm font-bold text-gray-800 mb-1">
                  {file ? file.name : 'Seleccionar PDF de Tutela'}
                </span>
                <span className="text-xs text-gray-500">Máximo 10MB</span>
              </label>
            </div>
            
            {file && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100 flex items-center gap-3">
                <FileText className="text-red-500" size={20} />
                <div className="text-xs overflow-hidden">
                  <p className="font-bold text-gray-700 truncate">{file.name}</p>
                  <p className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Metadatos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Responsable Asignado</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <select 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={metadata.responsable_id}
                    onChange={(e) => setMetadata({...metadata, responsable_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccione un abogado...</option>
                    {abogados.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Prioridad</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={metadata.prioridad}
                  onChange={(e) => setMetadata({...metadata, prioridad: e.target.value})}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta (Urgente)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Área Responsable</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={metadata.area_responsable}
                  onChange={(e) => setMetadata({...metadata, area_responsable: e.target.value})}
                  required
                >
                  <option value="">Seleccione un área...</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.nombre}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  Días de Término <Clock size={14} className="text-gray-400" />
                </label>
                <input 
                  type="number"
                  min="1"
                  max="15"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={metadata.dias_termino}
                  onChange={(e) => setMetadata({...metadata, dias_termino: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className={`
                w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3
                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#002E6D] hover:bg-[#001d4a]'}
              `}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando localmente...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Registrar y Buscar Sugerencias
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* RESULTADO: Sugerencias Semánticas */
        <div className="space-y-8 animate-slide-up">
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-green-800">Tutela Registrada con Éxito</h3>
                {resultado.gestion && <p className="text-sm text-green-700">Vencimiento estimado: {resultado.gestion.vencimiento_estimado}</p>}
              </div>
            </div>
            <button 
              onClick={() => setResultado(null)}
              className="text-sm font-bold text-green-800 hover:underline"
            >
              Cargar otra tutela
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Bookmark className="text-[#002E6D]" size={20} />
              <h2 className="text-xl font-bold text-gray-800">Sugerencias de Contestación (Éxito Histórico)</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {resultado.sugerencias && resultado.sugerencias.length > 0 ? (
                resultado.sugerencias.map((sug, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#002E6D]">{sug.categoria}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <AlertCircle size={12} /> Argumento validado
                      </span>
                    </div>
                    <div className="p-6">
                      <h4 className="font-bold text-gray-800 mb-3">{sug.titulo_referencia || 'Contestación sugerida'}</h4>
                      <p className="text-base text-gray-600 italic mb-6">
                        "{sug.contenido_legal}"
                      </p>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(sug.contenido_legal);
                            toast.success('Contenido copiado al portapapeles');
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-[#002E6D] hover:text-[#001d4a]"
                        >
                          Copiar argumentos para borrador <ChevronRight size={16} />
                        </button>
                        {sug.documento_id && (
                            <button 
                              onClick={() => handleVerDocumentoCompleto(sug)}
                              className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#002E6D] transition-colors ml-auto"
                            >
                              <Maximize2 size={16} /> Ver Contexto Completo
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 p-12 text-center rounded-xl">
                  <p className="text-gray-500 italic">No se encontraron precedentes similares en la base de conocimiento local.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}