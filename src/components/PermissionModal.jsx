import { X } from 'lucide-react';

export default function PermissionModal({ user, permissions, onClose, onAsignar, onRevocar, presets }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-black border border-green-900 w-full max-w-md rounded-lg shadow-2xl font-mono">
        <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-green-900">
          <h2 className="text-green-400 font-bold uppercase tracking-wider text-xs">Gestión de Permisos: {user.nombre}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
        
        <div className="p-4 text-green-500 text-xs">
          <div className="mb-4">
            <label className="block text-gray-500 mb-1 uppercase">Asignar Rol (Preset):</label>
            <select 
                className="bg-black border border-green-700 text-white w-full rounded p-2"
                onChange={(e) => {
                    const rol = e.target.value;
                    if (rol && presets[rol]) {
                        presets[rol].forEach(p => onAsignar(user.id, p.modulo, p.accion));
                    }
                }}
                defaultValue=""
            >
                <option value="" disabled>-- Seleccionar Rol --</option>
                <option value="juridico">Jurídico</option>
                <option value="admin">Admin</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-500 mb-1 uppercase">Permisos Actuales:</label>
            <div className="flex flex-wrap gap-1">
                {(permissions[user.id] || []).map((p, idx) => (
                    <div key={idx} className="flex items-center bg-gray-950 px-2 py-1 rounded border border-green-900">
                        <span>{p.modulo}:{p.accion}</span>
                        <button onClick={() => onRevocar(user.id, p.modulo, p.accion)} className="text-red-500 hover:text-red-300 ml-2">x</button>
                    </div>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-500 mb-1 uppercase">Asignación Granular:</label>
            <div className="flex flex-wrap gap-1">
                {['tutelas:READ', 'tutelas:WRITE', 'tutelas:DELETE', 'admin:READ'].map(perm => (
                    <button 
                        key={perm}
                        onClick={() => {
                            const [modulo, accion] = perm.split(':');
                            if (modulo && accion) onAsignar(user.id, modulo, accion);
                        }}
                        className="bg-gray-800 hover:bg-green-800 text-green-400 px-2 py-1 rounded text-[10px] border border-green-900"
                    >
                        + {perm}
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
