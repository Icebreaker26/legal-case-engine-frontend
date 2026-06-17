import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Clock, User, X } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import SearchableSelect from '../modules/conformidades/components/SearchableSelect';

export default function Procesar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark-pro';

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [abogados, setAbogados] = useState([]);
  const [grupos, setGrupos] = useState([]);
  
  const [metadata, setMetadata] = useState({
    responsable_id: '',
    prioridad: 'Media',
    grupo_id: '',
    dias_termino: 2
  });

  useEffect(() => {
    fetchAbogados();
    fetchGrupos();
  }, []);

  const fetchAbogados = async () => {
    try {
      const response = await apiService.get('/admin/abogados-activos');
      setAbogados(response.data);
    } catch (err) {
      toast.error(`Error cargando abogados: ${err.response?.status || err.message}`);
    }
  };

  const fetchGrupos = async () => {
    try {
      const { data } = await apiService.get('/core/grupos');
      setGrupos(data);
    } catch (err) {
      toast.error('Error cargando grupos');
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
      await tutelaService.procesar(file, metadata);
      toast.success('Tutela procesada exitosamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar el documento');
    } finally {
      setLoading(false);
    }
  };

  const cardClass = isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-gray-600';
  const inputClass = `w-full p-3 border rounded-lg text-sm outline-none transition-colors ${isDark ? 'bg-[#020617] border-slate-700 text-white focus:border-sky-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'}`;
  const labelClass = `block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`;

  return (
    <div className={`max-w-5xl mx-auto pb-12 animate-fade-in ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Procesar Nueva Acción Exitosa</h1>
        <p className={mutedTextClass}>Carga el documento legal y asigna la gestión administrativa.</p>
      </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-900/10' : (isDark ? 'border-slate-700 bg-[#0F172A]' : 'border-gray-300 bg-white')}`}>
              <input type="file" id="file-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className={`p-4 rounded-full mb-4 ${file ? 'bg-emerald-900/20 text-emerald-500' : 'bg-blue-900/20 text-blue-500'}`}>
                  <Upload size={32} />
                </div>
                <span className={`text-sm font-bold mb-1 ${textClass}`}>
                  {file ? file.name : 'Seleccionar PDF de Tutela'}
                </span>
                <span className={mutedTextClass}>Máximo 10MB</span>
              </label>
            </div>
            {file && (
              <div className={`mt-4 p-4 rounded-lg border flex items-center gap-3 ${cardClass}`}>
                <FileText className="text-red-500" size={20} />
                <div className="text-xs overflow-hidden">
                  <p className={`font-bold truncate ${textClass}`}>{file.name}</p>
                  <p className={mutedTextClass}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 ${cardClass}`}>
              <div>
                <label className={labelClass}>Responsable Asignado</label>
                <SearchableSelect 
                    variant="white"
                    options={abogados} 
                    value={metadata.responsable_id} 
                    onChange={id => setMetadata({...metadata, responsable_id: id})} 
                    placeholder="Seleccionar..." 
                />
              </div>

              <div>
                <label className={labelClass}>Grupo (Área)</label>
                <SearchableSelect 
                    variant="white"
                    options={grupos} 
                    value={metadata.grupo_id} 
                    onChange={id => setMetadata({...metadata, grupo_id: id})} 
                    placeholder="Seleccionar..." 
                />
              </div>

              <div>
                <label className={labelClass}>Prioridad</label>
                <select className={inputClass} value={metadata.prioridad} onChange={(e) => setMetadata({...metadata, prioridad: e.target.value})}>
                  {['Baja', 'Media', 'Alta'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Días de Término <Clock size={14} className="inline ml-1" /></label>
                <input type="number" min="1" max="15" className={inputClass} value={metadata.dias_termino} onChange={e => setMetadata({...metadata, dias_termino: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading || !file} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}>
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Procesando...</> : <><CheckCircle size={20} /> Registrar y Buscar Sugerencias</>}
            </button>
          </div>
        </form>
    </div>
  );
}
