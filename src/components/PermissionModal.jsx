import { X } from 'lucide-react';

export default function PermissionModal({ user, permissions, onClose, onAsignar, onRevocar, presets }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-[#050A05] border-2 border-[#1A441A] w-full max-w-2xl rounded-none shadow-2xl font-mono text-[#33FF33]">
        <div className="bg-[#0A140A] p-4 flex justify-between items-center border-b border-[#1A441A]">
          <h2 className="text-[#33FF33] font-bold uppercase tracking-widest text-sm">[ GESTIÓN DE PERMISOS: {user.nombre} ]</h2>
          <button onClick={onClose} className="text-[#1A441A] hover:text-[#33FF33]"><X size={24} /></button>
        </div>
        
        <div className="p-4 text-[#33FF33] text-xs">
          <div className="mb-4">
            <label className="block text-[#1A441A] mb-1 uppercase tracking-widest">Asignar Rol (Preset):</label>
            <select 
                className="bg-[#050A05] border border-[#1A441A] text-[#33FF33] w-full rounded-none p-2 outline-none"
                onChange={(e) => {
                    const rol = e.target.value;
                    if (rol && presets[rol]) {
                        presets[rol].forEach(p => onAsignar(user.id, p.modulo, p.accion));
                    }
                }}
                defaultValue=""
            >
                <option value="" disabled className="bg-[#050A05]">-- Seleccionar Rol --</option>
                {Object.keys(presets).map(rol => (
                    <option key={rol} value={rol} className="bg-[#050A05]">{rol.toUpperCase()}</option>
                ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[#1A441A] mb-1 uppercase tracking-widest">Permisos Actuales:</label>
            <div className="flex flex-wrap gap-2">
                {(permissions[user.id] || []).map((p, idx) => (
                    <div key={idx} className="flex items-center bg-[#0A140A] px-2 py-1 rounded-none border border-[#1A441A]">
                        <span className="font-mono text-[10px]">{p.modulo}:{p.accion}</span>
                        <button onClick={() => onRevocar(user.id, p.modulo, p.accion)} className="text-red-500 hover:text-red-300 ml-2 font-bold">x</button>
                    </div>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-[#1A441A] mb-1 uppercase tracking-widest">Asignación Granular:</label>
            <div className="flex flex-wrap gap-2">
                {['tutelas:READ', 'tutelas:WRITE', 'tutelas:DELETE', 'admin:READ', 'comunicaciones:READ_COM', 'comunicaciones:WRITE_COM', 'comunicaciones:DELETE_COM'].map(perm => (
                    <button 
                        key={perm}
                        onClick={() => {
                            const [modulo, accion] = perm.split(':');
                            if (modulo && accion) onAsignar(user.id, modulo, accion);
                        }}
                        className="bg-[#0A140A] hover:bg-[#1A441A] text-[#33FF33] px-3 py-1 rounded-none text-[10px] border border-[#1A441A] uppercase font-bold"
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
