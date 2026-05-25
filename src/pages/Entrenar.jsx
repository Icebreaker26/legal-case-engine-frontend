import { useState, useEffect } from 'react';
import { Database, Upload, CheckCircle, Info, Bookmark, ShieldCheck } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

export default function Entrenar() {
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
      const { data } = await apiService.get('/tutelas/categorias');
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

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#002E6D] mb-2 flex items-center gap-3">
          <Database size={32} /> Alimentar Memoria Local
        </h1>
        <p className="text-gray-600">Fortalece el motor de búsqueda semántica con argumentos y contestaciones exitosas.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-8 flex gap-4 items-start">
        <ShieldCheck className="text-[#002E6D] shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-[#002E6D] mb-1">Privacidad Garantizada</h4>
          <p className="text-sm text-blue-800">
            Todo el contenido cargado se procesa localmente mediante vectores de 384 dimensiones. 
            <strong> Ningún dato legal sale de la infraestructura de Enel.</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Categoría Jurídica</label>
              <select 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                required
              >
                <option value="">Seleccione una categoría...</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Título de Referencia</label>
              <input 
                type="text"
                placeholder="Ej: Contestación Radicado 2024-001..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.titulo_referencia}
                onChange={(e) => setFormData({...formData, titulo_referencia: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4">Método de Carga</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`
                border-2 border-dashed p-6 rounded-xl text-center cursor-pointer transition-all
                ${file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-[#002E6D]'}
              `}>
                <input type="file" id="pdf-train" className="hidden" accept=".pdf" onChange={handleFileChange} />
                <label htmlFor="pdf-train" className="cursor-pointer">
                  <Upload size={24} className={`mx-auto mb-2 ${file ? 'text-green-600' : 'text-gray-400'}`} />
                  <p className="text-xs font-bold text-gray-700">{file ? file.name : 'Subir Contestación (PDF)'}</p>
                </label>
              </div>

              <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                <p className="text-xs text-center text-gray-500 italic">
                  O escribe el argumento legal directamente abajo.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              Contenido Legal / Argumento <Bookmark size={14} className="text-gray-400" />
            </label>
            <textarea 
              rows="6"
              placeholder="Pega aquí los párrafos o argumentos legales que quieres que el sistema aprenda..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-serif"
              value={formData.contenido_legal}
              disabled={!!file}
              onChange={(e) => setFormData({...formData, contenido_legal: e.target.value})}
            ></textarea>
            {file && <p className="text-xs text-orange-600 mt-2 italic flex items-center gap-1">
              <Info size={12} /> Se extraerá el texto del archivo PDF seleccionado.
            </p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (!file && !formData.contenido_legal)}
          className={`
            w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#002E6D] hover:bg-[#001d4a]'}
          `}
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
