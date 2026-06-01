import { X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PasswordDisplayModal({ password, nombre, onClose }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast.success('Contraseña copiada al portapapeles');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-[#050A05] border-2 border-[#1A441A] w-full max-w-sm rounded-none shadow-2xl font-mono text-[#33FF33]">
        <div className="bg-[#0A140A] p-4 flex justify-between items-center border-b border-[#1A441A]">
          <h2 className="text-[#33FF33] font-bold uppercase tracking-widest text-sm">[ NUEVA CREDENCIAL ]</h2>
          <button onClick={onClose} className="text-[#1A441A] hover:text-[#33FF33]"><X size={20} /></button>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-xs text-slate-400 mb-4">Contraseña generada para <strong className="text-white">{nombre}</strong>:</p>
          <div className="bg-[#0A140A] border border-[#1A441A] p-4 mb-6 font-bold text-lg tracking-widest text-white flex items-center justify-center gap-3">
            {password}
            <button onClick={copyToClipboard} className="text-[#1A441A] hover:text-[#33FF33]">
                <Copy size={18} />
            </button>
          </div>
          <p className="text-[10px] text-amber-500 uppercase">Asegúrate de copiarla, no volverá a mostrarse.</p>
        </div>
      </div>
    </div>
  );
}
