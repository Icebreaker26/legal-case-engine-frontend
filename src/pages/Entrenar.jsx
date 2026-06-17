import { useState, useEffect } from 'react';
import { Database, Upload, CheckCircle, Info, Bookmark, ShieldCheck } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import SearchableSelect from '../modules/conformidades/components/SearchableSelect';

export default function Entrenar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark-pro';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoria: '',
    titulo_referencia: '',
    contenido_legal: '',
    es_exitosa: true
  });
  const [file, setFile] = useState(null);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data } = await apiService.get('/core/categorias');
      setCategorias(data);
    } catch (err) {
      toast.error('Error cargando categorías');
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
    if (!formData.categoria) return toast.error('Selecciona una categoría');
    if (!file && !formData.contenido_legal) {
      return toast.error('Debes subir un archivo o escribir el contenido legal');
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('categoria', formData.categoria);
      data.append('titulo_referencia', formData.titulo_referencia);
      data.append('es_exitosa', formData.es_exitosa);
      
      if (file) {
        data.append('documento', file);
      } else {
        data.append('contenido_legal', formData.contenido_legal);
      }

      await tutelaService.entrenarLocal(data);
      toast.success('Conocimiento guardado exitosamente');
      
      setFormData({
        categoria: '',
        titulo_referencia: '',
        contenido_legal: '',
        es_exitosa: true
      });
      setFile(null);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el conocimiento');
    } finally {
      setLoading(false);
    }
  };

  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-600';
  const inputClass = `w-full p-3 border rounded-lg text-sm outline-none transition-colors ${isDark ? 'bg-[#020617] border-slate-700 text-white focus:border-sky-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'}`;
  const labelClass = `block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;

  return (
    <div className={`max-w-4xl mx-auto pb-12 animate-fade-in ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${textClass}`}>
          <Database size={32} className="text-sky-500" /> Alimentar Memoria Local
        </h1>
        <p className={mutedTextClass}>Fortalece el motor de búsqueda semántica con argumentos y contestaciones exitosas.</p>
      </div>

      <div className={`border p-6 rounded-xl mb-8 flex gap-4 items-start ${isDark ? 'bg-sky-900/10 border-sky-900' : 'bg-blue-50 border-blue-100'}`}>
        <ShieldCheck className="text-sky-500 shrink-0" size={24} />
        <div>
          <h4 className={`font-bold mb-1 ${textClass}`}>Privacidad Garantizada</h4>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-blue-800'}`}>
            Todo el contenido cargado se procesa localmente mediante vectores de 384 dimensiones. 
            <strong> Ningún dato legal sale de la infraestructura corporativa.</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-8 rounded-xl border shadow-sm space-y-6 ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Categoría Jurídica</label>
              <SearchableSelect 
                  variant="white"
                  options={categorias} 
                  value={formData.categoria} 
                  onChange={nombre => setFormData({...formData, categoria: nombre})} 
                  placeholder="Seleccione una categoría..." 
              />
            </div>
            
            <div>
              <label className={labelClass}>Título de Referencia</label>
              <input 
                type="text"
                placeholder="Ej: Contestación Radicado 2024-001..."
                className={inputClass}
                value={formData.titulo_referencia}
                onChange={(e) => setFormData({...formData, titulo_referencia: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Método de Carga</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`border-2 border-dashed p-6 rounded-xl text-center cursor-pointer transition-all ${file ? 'border-emerald-500 bg-emerald-900/10' : (isDark ? 'border-slate-700 bg-[#020617]' : 'border-gray-200 bg-white')}`}>
                <input type="file" id="pdf-train" className="hidden" accept=".pdf" onChange={handleFileChange} />
                <label htmlFor="pdf-train" className="cursor-pointer">
                  <Upload size={24} className={`mx-auto mb-2 ${file ? 'text-emerald-500' : 'text-slate-500'}`} />
                  <p className={`text-xs font-bold ${textClass}`}>{file ? file.name : 'Subir Contestación (PDF)'}</p>
                </label>
              </div>

              <div className={`p-6 border rounded-xl flex items-center justify-center ${isDark ? 'bg-[#020617] border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs text-center italic ${mutedTextClass}`}>
                  O escribe el argumento legal directamente abajo.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${textClass}`}>
              Contenido Legal / Argumento <Bookmark size={14} className={mutedTextClass} />
            </label>
            <textarea 
              rows="6"
              placeholder="Pega aquí los párrafos o argumentos legales que quieres que el sistema aprenda..."
              className={inputClass + ' font-serif'}
              value={formData.contenido_legal}
              disabled={!!file}
              onChange={(e) => setFormData({...formData, contenido_legal: e.target.value})}
            ></textarea>
            {file && <p className="text-xs text-orange-500 mt-2 italic flex items-center gap-1">
              <Info size={12} /> Se extraerá el texto del archivo PDF seleccionado.
            </p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (!file && !formData.contenido_legal)}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Vectorizando localmente...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Guardar en Memoria de Éxito
            </>
          )}
        </button>
      </form>
    </div>
  );
}
