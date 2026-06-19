import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Clock, ChevronRight, Scale } from 'lucide-react';
import { tutelaService } from '../services/tutelaService';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import SearchableSelect from '../../../components/SearchableSelect';

const DERECHOS_VULNERADOS = [
  'Acceso al servicio público de energía',
  'Servidumbre de energía',
  'Derecho de petición',
  'Facturación / Cobros indebidos',
  'Corte o suspensión del servicio',
  'Daños por instalaciones eléctricas',
  'Medio ambiente / Impacto ambiental',
  'Propiedad / Predial',
  'Seguridad / Accidente eléctrico',
  'Contrato de condiciones uniformes',
  'Otro',
];

const PRIORIDADES = [
  { value: 'Baja',  label: 'Baja',  dot: 'bg-blue-400' },
  { value: 'Media', label: 'Media', dot: 'bg-amber-400' },
  { value: 'Alta',  label: 'Alta',  dot: 'bg-red-500'  },
];

export default function Procesar() {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [abogados, setAbogados] = useState([]);
  const [grupos, setGrupos]     = useState([]);
  const inputRef                = useRef(null);

  const [metadata, setMetadata] = useState({
    responsable_id: '',
    prioridad: 'Media',
    grupo_id: '',
    dias_termino: 2,
    derecho_vulnerado: '',
  });

  useEffect(() => {
    apiService.get('/core/usuarios-activos').then(r => setAbogados(r.data)).catch(() => toast.error('Error cargando abogados'));
    apiService.get('/core/grupos').then(r => setGrupos(r.data)).catch(() => toast.error('Error cargando grupos'));
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
    if (!file) return toast.error('Debes seleccionar un archivo PDF');
    setLoading(true);
    try {
      await tutelaService.procesar(file, metadata);
      setDone(true);
      toast.success('Tutela registrada exitosamente');
    } catch {
      toast.error('Error al procesar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null); setDone(false);
    setMetadata({ responsable_id: '', prioridad: 'Media', grupo_id: '', dias_termino: 2, derecho_vulnerado: '' });
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto py-24 flex flex-col items-center text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mb-6">
          <CheckCircle size={30} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Tutela procesada</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          El documento fue registrado y los precedentes legales fueron indexados correctamente.
        </p>
        <div className="flex gap-3">
          <a href="/" className="px-6 py-2.5 bg-[#002E6D] text-white text-sm font-semibold rounded-lg hover:bg-[#001d4a] transition-colors">
            Ir a la bandeja
          </a>
          <button onClick={handleReset} className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Procesar otra
          </button>
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
          <Scale size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">Registrar nueva tutela</h1>
          <p className="text-sm text-gray-500 mt-1">Carga el documento judicial y asigna la gestión administrativa.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl transition-all duration-200 ${
            dragging ? 'border-[#002E6D] bg-blue-50/50' :
            file     ? 'border-gray-200 bg-gray-50/60'  :
                       'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/40'
          }`}
        >
          {!file ? (
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center py-14 cursor-pointer gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                dragging ? 'bg-[#002E6D] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {dragging ? 'Suelta el archivo aquí' : 'Arrastra el PDF o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">Solo archivos PDF · Máximo 10 MB</p>
              </div>
              <span className="px-4 py-2 bg-[#002E6D] text-white text-xs font-semibold rounded-lg hover:bg-[#001d4a] transition-colors">
                Seleccionar archivo
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-4 px-6 py-5">
              <div className="w-11 h-11 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input ref={inputRef} id="file-upload" type="file" className="hidden" accept=".pdf" onChange={onFileChange} />
        </div>

        {/* Panel de configuración */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 rounded-t-2xl">
            <p className="text-sm font-semibold text-gray-800">Configuración de gestión</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Prioridad */}
            <div className="md:col-span-2">
              <label className={fieldLabel}>Nivel de prioridad</label>
              <div className="flex gap-3">
                {PRIORIDADES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setMetadata({ ...metadata, prioridad: p.value })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                      metadata.prioridad === p.value
                        ? 'border-[#002E6D] bg-[#002E6D] text-white shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${metadata.prioridad === p.value ? 'bg-white/70' : p.dot}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsable */}
            <div>
              <label className={fieldLabel}>Responsable</label>
              <SearchableSelect
                variant="white"
                options={abogados}
                value={metadata.responsable_id}
                onChange={id => setMetadata({ ...metadata, responsable_id: id })}
                placeholder="Seleccionar abogado..."
              />
            </div>

            {/* Grupo */}
            <div>
              <label className={fieldLabel}>Área / Grupo</label>
              <SearchableSelect
                variant="white"
                options={grupos}
                value={metadata.grupo_id}
                onChange={id => setMetadata({ ...metadata, grupo_id: id })}
                placeholder="Seleccionar área..."
              />
            </div>

            {/* Derecho vulnerado */}
            <div className="md:col-span-2">
              <label className={fieldLabel}>Derecho vulnerado <span className="text-gray-400 font-normal">(opcional — se extrae del PDF)</span></label>
              <select
                value={metadata.derecho_vulnerado}
                onChange={e => setMetadata({ ...metadata, derecho_vulnerado: e.target.value })}
                className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#002E6D]/15 focus:border-[#002E6D]"
              >
                <option value="">Dejar que el sistema lo detecte del PDF</option>
                {DERECHOS_VULNERADOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Días */}
            <div className="md:col-span-2">
              <label className={fieldLabel}><Clock size={13} className="inline mr-1 mb-0.5 text-gray-400" />Días de término legal</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 10].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setMetadata({ ...metadata, dias_termino: d })}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-all ${
                      metadata.dias_termino === d
                        ? 'bg-[#002E6D] border-[#002E6D] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
                <div className="ml-2 flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={metadata.dias_termino}
                    onChange={e => setMetadata({ ...metadata, dias_termino: parseInt(e.target.value) || 1 })}
                    className="w-16 text-center py-2 px-2 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#002E6D]/15 focus:border-[#002E6D]"
                  />
                  <span className="text-xs text-gray-400">días</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !file}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              loading || !file
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#002E6D] text-white hover:bg-[#001d4a] shadow-sm hover:shadow-md'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Registrar tutela
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
