import { useMemo } from 'react';
import { X, Shield, CheckCircle2, Circle, Zap, User, Mail, Trash2 } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

// Todos los permisos del sistema organizados por módulo
const MODULOS_CONFIG = [
  {
    key: 'tutelas',
    label: 'Derechos de Petición',
    color: 'text-blue-400',
    accent: 'border-blue-800 bg-blue-950/20',
    acciones: [
      { accion: 'READ',   label: 'Ver peticiones' },
      { accion: 'WRITE',  label: 'Crear / editar' },
      { accion: 'DELETE', label: 'Archivar' },
    ],
  },
  {
    key: 'comunicaciones',
    label: 'Comunicaciones',
    color: 'text-amber-400',
    accent: 'border-amber-800 bg-amber-950/20',
    acciones: [
      { accion: 'READ_COM',   label: 'Ver comunicaciones' },
      { accion: 'WRITE_COM',  label: 'Crear / editar' },
      { accion: 'DELETE_COM', label: 'Archivar' },
      { accion: 'MANAGE_COM', label: 'Gestionar entidades/grupos' },
    ],
  },
  {
    key: 'pagos',
    label: 'Pagos',
    color: 'text-sky-400',
    accent: 'border-sky-800 bg-sky-950/20',
    acciones: [
      { accion: 'READ_PAGO',   label: 'Ver pagos' },
      { accion: 'WRITE_PAGO',  label: 'Crear / editar' },
      { accion: 'DELETE_PAGO', label: 'Archivar' },
    ],
  },
  {
    key: 'conformidades',
    label: 'Conformidades',
    color: 'text-emerald-400',
    accent: 'border-emerald-800 bg-emerald-950/20',
    acciones: [
      { accion: 'READ',   label: 'Ver conformidades' },
      { accion: 'WRITE',  label: 'Crear / editar' },
      { accion: 'DELETE', label: 'Archivar' },
    ],
  },
  {
    key: 'contratos',
    label: 'Contratos',
    color: 'text-pink-400',
    accent: 'border-pink-800 bg-pink-950/20',
    acciones: [
      { accion: 'READ',   label: 'Ver contratos y minutas' },
      { accion: 'WRITE',  label: 'Crear / editar' },
      { accion: 'DELETE', label: 'Archivar' },
    ],
  },
  {
    key: 'ambiental',
    label: 'Derecho Ambiental',
    color: 'text-green-400',
    accent: 'border-green-800 bg-green-950/20',
    acciones: [
      { accion: 'READ',   label: 'Ver expedientes' },
      { accion: 'WRITE',  label: 'Crear / analizar' },
      { accion: 'DELETE', label: 'Archivar' },
    ],
  },
  {
    key: 'rendimiento',
    label: 'Rendimiento',
    color: 'text-violet-400',
    accent: 'border-violet-800 bg-violet-950/20',
    acciones: [
      { accion: 'READ',         label: 'Ver dashboard propio' },
      { accion: 'WRITE',        label: 'Registrar acciones' },
      { accion: 'DELETE',       label: 'Eliminar acciones' },
      { accion: 'MANAGE_TEAMS', label: 'Gestionar equipos' },
      { accion: 'READ_ALL',     label: 'Ver todos los equipos' },
    ],
  },
  {
    key: 'supervisor',
    label: 'Supervisor (Catálogos)',
    color: 'text-orange-400',
    accent: 'border-orange-800 bg-orange-950/20',
    acciones: [
      { accion: 'READ',   label: 'Ver catálogos' },
      { accion: 'WRITE',  label: 'Crear / editar catálogos' },
      { accion: 'DELETE', label: 'Archivar catálogos' },
    ],
  },
  {
    key: 'admin',
    label: 'Administración',
    color: 'text-red-400',
    accent: 'border-red-800 bg-red-950/20',
    acciones: [
      { accion: 'READ',  label: 'Ver usuarios y áreas' },
      { accion: 'WRITE', label: 'Editar usuarios y áreas' },
    ],
  },
];

// Labels legibles para los presets
const PRESET_LABELS = {
  juridico:                'Jurídico',
  profesional_rendimiento: 'Profesional Rendimiento',
  manager_rendimiento:     'Manager Rendimiento',
  comunicaciones_operativo:'Comunicaciones Operativo',
  comunicaciones_admin:    'Comunicaciones Admin',
  pagos_operativo:         'Pagos Operativo',
  pagos_admin:             'Pagos Admin',
  conformidades_operativo: 'Conformidades Operativo',
  conformidades_admin:     'Conformidades Admin',
  contratos_operativo:     'Contratos Operativo',
  ambiental_operativo:     'Ambiental Operativo',
  supervisor:              'Supervisor',
  admin_total:             'Administrador Total',
};

export default function PermissionModal({ user, permissions, onClose, onAsignar, onRevocar, presets }) {
  if (!user) return null;

  const permsActuales = permissions[user.id] || [];

  const tienePermiso = (modulo, accion) =>
    permsActuales.some((p) => p.modulo === modulo && p.accion === accion);

  const togglePermiso = (modulo, accion) => {
    if (tienePermiso(modulo, accion)) {
      onRevocar(user.id, modulo, accion);
    } else {
      onAsignar(user.id, modulo, accion);
    }
  };

  const aplicarPreset = async (presetKey) => {
    if (!presets[presetKey]) return;
    try {
      await apiService.post('/permisos/asignar-masivo', {
        usuario_uuid: user.id,
        permisos: presets[presetKey],
      });
      toast.success(`Preset "${PRESET_LABELS[presetKey] || presetKey}" aplicado`);
      onAsignar(user.id, null, null);
    } catch {
      toast.error('Error al aplicar preset');
    }
  };

  const revocarTodo = async () => {
    if (!confirm(`¿Revocar TODOS los permisos de ${user.nombre}?`)) return;
    try {
      await Promise.all(
        permsActuales.map((p) =>
          apiService.delete('/permisos/revocar', { data: { usuario_uuid: user.id, modulo: p.modulo, accion: p.accion } })
        )
      );
      toast.success('Todos los permisos revocados');
      onAsignar(user.id, null, null);
    } catch {
      toast.error('Error al revocar permisos');
    }
  };

  const totalPermisos = permsActuales.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      {/* Drawer lateral */}
      <div
        className="relative h-full w-full max-w-xl bg-[#050A05] border-l-2 border-[#1A441A] shadow-2xl font-mono flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#1A441A] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-[#33FF33]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#1A441A]">Permisos del usuario</span>
            </div>
            <h2 className="text-white font-bold text-lg">{user.nombre}</h2>
            <p className="text-[#1A441A] text-[10px] mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#1A441A] border border-[#1A441A] px-2 py-1">
              {totalPermisos} permiso{totalPermisos !== 1 ? 's' : ''} activo{totalPermisos !== 1 ? 's' : ''}
            </span>
            <button onClick={onClose} className="text-[#1A441A] hover:text-[#33FF33] transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Presets ── */}
          <div className="p-6 border-b border-[#1A441A]">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} className="text-[#33FF33]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#33FF33]">Aplicar preset</span>
              <span className="text-[10px] text-[#1A441A] ml-1">— agrega permisos sin quitar los actuales</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(presets).map((key) => (
                <button
                  key={key}
                  onClick={() => aplicarPreset(key)}
                  className="text-left px-3 py-2.5 border border-[#1A441A] hover:border-[#33FF33] hover:bg-[#0A140A] transition-colors group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#33FF33] group-hover:text-white transition-colors block">
                    {PRESET_LABELS[key] || key}
                  </span>
                  <span className="text-[10px] text-[#1A441A] mt-0.5 block">
                    {presets[key].length} permiso{presets[key].length !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Permisos por módulo ── */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User size={13} className="text-[#33FF33]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#33FF33]">Permisos granulares</span>
            </div>

            {MODULOS_CONFIG.map((mod) => {
              const permsDelModulo = mod.acciones.filter((a) => tienePermiso(mod.key, a.accion));
              const tieneAlguno = permsDelModulo.length > 0;

              return (
                <div key={mod.key} className={`border ${tieneAlguno ? mod.accent : 'border-[#1A441A] bg-transparent'} transition-colors`}>
                  {/* Cabecera del módulo */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A441A]/40">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${tieneAlguno ? mod.color : 'text-[#1A441A]'}`}>
                      {mod.label}
                    </span>
                    {tieneAlguno && (
                      <span className="text-[10px] text-[#1A441A]">
                        {permsDelModulo.length}/{mod.acciones.length}
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="px-4 py-3 space-y-2">
                    {mod.acciones.map((a) => {
                      const activo = tienePermiso(mod.key, a.accion);
                      return (
                        <button
                          key={a.accion}
                          onClick={() => togglePermiso(mod.key, a.accion)}
                          className="w-full flex items-center gap-3 group text-left"
                        >
                          {activo
                            ? <CheckCircle2 size={15} className={`${mod.color} shrink-0`} />
                            : <Circle size={15} className="text-[#1A441A] group-hover:text-[#33FF33]/40 shrink-0 transition-colors" />
                          }
                          <span className={`text-xs transition-colors ${activo ? 'text-slate-200' : 'text-[#1A441A] group-hover:text-slate-400'}`}>
                            {a.label}
                          </span>
                          <span className={`ml-auto text-[10px] transition-colors ${activo ? 'text-[#1A441A]' : 'text-[#0A200A]'}`}>
                            {a.accion}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: revocar todo */}
        {totalPermisos > 0 && (
          <div className="shrink-0 px-6 py-4 border-t border-[#1A441A]">
            <button
              onClick={revocarTodo}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-900 text-red-600 hover:bg-red-950/30 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <Trash2 size={13} /> Revocar todos los permisos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
