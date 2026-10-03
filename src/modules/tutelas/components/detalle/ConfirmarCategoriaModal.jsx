import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

/**
 * Gate de confirmación de categoría (#108 backend / #44 frontend): antes de
 * promover una respuesta o un argumento a la memoria legal, el backend exige
 * categoria_confirmada=true — sin este modal, el abogado nunca se entera de
 * que la promoción quedó pendiente (actualizarDatos responde 200 con
 * promocion_pendiente=true, no un error) o por qué falla (promoverArgumento
 * responde 400 con el motivo).
 *
 * `editable=true` permite corregir la categoría antes de confirmar (caso
 * PATCH /:id/datos, que sí acepta derecho_vulnerado en el body). `editable=false`
 * solo confirma la categoría actual de la tutela (caso de promoverArgumento,
 * que no acepta una categoría distinta a la de la tutela — para corregirla
 * hay que editar la tutela primero, fuera de este modal).
 */
export default function ConfirmarCategoriaModal({ open, ...props }) {
  // Montar un componente nuevo en cada apertura (en vez de un useEffect que
  // resincronice `valor` con `categoria`) — así el estado del select siempre
  // arranca fresco con la categoría actual, sin setState síncrono en un
  // efecto (react-hooks/set-state-in-effect).
  if (!open) return null;
  return <ConfirmarCategoriaModalContenido {...props} />;
}

function ConfirmarCategoriaModalContenido({
  categoria,
  motivo,
  editable = false,
  opciones = [],
  loading = false,
  onConfirm,
  onClose,
}) {
  const [valor, setValor] = useState(categoria || '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert size={20} className="text-amber-600" /> Confirmar categoría
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {motivo || 'Esto se va a guardar como precedente en la memoria legal — confirmá o corregí la categoría antes de promoverlo.'}
        </p>

        {editable ? (
          <select
            className="border border-gray-200 bg-gray-50 p-2.5 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-[#002E6D] mb-6"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          >
            <option value="">Seleccionar Derecho Vulnerado</option>
            {opciones.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Categoría</p>
            <p className="text-sm font-semibold text-gray-800">{categoria || 'General'}</p>
          </div>
        )}
        {!editable && (
          <p className="text-xs text-gray-400 mb-6">
            ¿No es correcta? Cancelá y corregí el Derecho Vulnerado desde el encabezado del expediente antes de promover.
          </p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl text-sm font-bold transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(editable ? valor : categoria)}
            disabled={loading || (editable && !valor)}
            className="flex-1 bg-[#002E6D] hover:bg-[#001d4a] disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            {loading ? 'Promoviendo…' : 'Confirmar y promover'}
          </button>
        </div>
      </div>
    </div>
  );
}
