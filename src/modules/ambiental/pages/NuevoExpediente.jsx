import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../services/apiService';
import { Upload, ChevronLeft, Loader, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const TIPOS = ['expediente', 'auto', 'resolución', 'concepto', 'otros'];

export default function NuevoExpediente() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    titulo: '',
    tipo_instrumento: 'auto',
    numero_expediente: '',
    fecha_documento: '',
  });

  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [duplicadoPendiente, setDuplicadoPendiente] = useState(null); // { duplicado, payload }

  const guardarExpediente = async (payload) => {
    const { data } = await apiService.post('/ambiental/expedientes', payload);
    navigate(`/ambiental/expediente/${data.id}`);
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim()) return toast.error('El título es obligatorio.');
    setGuardando(true);
    try {
      let extraCampos = {};

      if (archivo) {
        const fd = new FormData();
        fd.append('file', archivo);
        if (form.fecha_documento) fd.append('fecha_documento', form.fecha_documento);
        const { data } = await apiService.post('/ambiental/expedientes/procesar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        extraCampos.contenido_texto = data.contenido_texto;
        if (data.file_hash)      extraCampos.file_hash      = data.file_hash;
        if (data.contenido_hash) extraCampos.contenido_hash = data.contenido_hash;

        if (data.duplicado) {
          setDuplicadoPendiente({ duplicado: data.duplicado, payload: { ...form, ...extraCampos } });
          return;
        }
      }

      await guardarExpediente({ ...form, ...extraCampos });
    } catch {
      toast.error('Error al guardar el expediente');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarDuplicado = async () => {
    setGuardando(true);
    try {
      await guardarExpediente(duplicadoPendiente.payload);
    } catch {
      toast.error('Error al guardar el expediente');
    } finally {
      setGuardando(false);
      setDuplicadoPendiente(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Modal duplicado */}
      {duplicadoPendiente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-800 text-base">Documento ya registrado</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Este archivo ya fue subido en el expediente:
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  "{duplicadoPendiente.duplicado.titulo}"
                  {duplicadoPendiente.duplicado.numero_expediente && ` — ${duplicadoPendiente.duplicado.numero_expediente}`}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">¿Deseas registrarlo de todas formas como un expediente separado?</p>
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => { setDuplicadoPendiente(null); setGuardando(false); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => navigate(`/ambiental/expediente/${duplicadoPendiente.duplicado.id}`)}
                className="px-4 py-2 rounded-xl border border-green-600 text-sm font-bold text-green-700 hover:bg-green-50"
              >
                Ver expediente existente
              </button>
              <button
                onClick={confirmarDuplicado}
                disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50"
              >
                {guardando && <Loader size={14} className="animate-spin" />}
                Registrar de todas formas
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/ambiental')} className="text-gray-400 hover:text-green-700 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Nuevo Expediente Ambiental</h1>
          <p className="text-sm text-gray-500">Registra el instrumento y sube el documento</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Título <span className="text-red-500">*</span></label>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Ej: Resolución 1234 — Plan de Manejo Ambiental"
            value={form.titulo}
            onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de instrumento <span className="text-red-500">*</span></label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600 capitalize"
              value={form.tipo_instrumento}
              onChange={e => setForm(p => ({ ...p, tipo_instrumento: e.target.value }))}
            >
              {TIPOS.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Número de expediente</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Ej: EXP-2026-001"
              value={form.numero_expediente}
              onChange={e => setForm(p => ({ ...p, numero_expediente: e.target.value }))}
            />
          </div>
        </div>

        <div className="w-48">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha del documento</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600"
            value={form.fecha_documento}
            onChange={e => setForm(p => ({ ...p, fecha_documento: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Documento (opcional)</h2>
        <div
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            archivo ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
          }`}
        >
          <Upload size={28} className={`mx-auto mb-2 ${archivo ? 'text-green-600' : 'text-gray-300'}`} />
          {archivo ? (
            <p className="text-sm font-semibold text-green-700">{archivo.name}</p>
          ) : (
            <p className="text-sm text-gray-400">Haz clic para seleccionar un archivo PDF, DOCX o TXT</p>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => {
            const file = e.target.files[0] || null;
            setArchivo(file);
            if (file && !form.titulo.trim()) {
              const nombre = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
              setForm(p => ({ ...p, titulo: nombre }));
            }
          }} />
        </div>
        {archivo && (
          <p className="text-xs text-gray-400">El texto se extraerá automáticamente al guardar. Podrás generar el prompt desde la vista del expediente.</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/ambiental')} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando || !form.titulo.trim()}
          className="flex items-center gap-2 bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50 transition-colors"
        >
          {guardando ? <Loader size={16} className="animate-spin" /> : null}
          {guardando ? (archivo ? 'Extrayendo texto...' : 'Guardando...') : 'Guardar expediente'}
        </button>
      </div>
    </div>
  );
}
