import SignalMeter from './SignalMeter';

export default function MilitaryProfileCard({ user }) {
  if (!user) return null;

  return (
    <div className="border-2 border-[#1A441A] bg-[#0A140A] p-6 mb-6 font-mono text-[#33FF33] shadow-[0_0_10px_rgba(51,255,51,0.1)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-widest border-b border-[#1A441A] mb-4 pb-2">
            [ IDENTIFICACIÓN DE OPERADOR ]
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-[#1A441A] uppercase">Nombre:</span> {user.nombre}</p>
            <p><span className="text-[#1A441A] uppercase">Rol:</span> {user.rol || 'N/A'}</p>
            <p><span className="text-[#1A441A] uppercase">Especialidad:</span> {user.especialidad || 'N/A'}</p>
            <p><span className="text-[#1A441A] uppercase">ID_SISTEMA:</span> {user.id}</p>
          </div>
        </div>
        <div className="flex items-center justify-center md:justify-end">
          <SignalMeter />
        </div>
      </div>
    </div>
  );
}
