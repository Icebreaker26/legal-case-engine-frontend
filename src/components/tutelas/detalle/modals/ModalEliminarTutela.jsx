import { useState } from 'react';

export default function ModalEliminarTutela({ 
  isOpen, 
  onClose, 
  onDelete, 
  radicado, 
  updating 
}) {
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onDelete(confirmInput);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-scale-in border border-red-100">
        <h2 className="text-xl font-black text-red-600 mb-4 uppercase tracking-tight">¿Eliminar expediente?</h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Esta acción marcará la tutela como eliminada y no aparecerá en la bandeja. Para confirmar, escribe el radicado: <br/><strong className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs mt-2 inline-block font-mono">{radicado}</strong>
        </p>
        <input 
          type="text" 
          className="w-full border-2 border-red-100 bg-red-50/30 p-3 rounded-xl mb-6 font-mono text-sm outline-none focus:border-red-400 focus:bg-white transition-all text-center" 
          value={confirmInput} 
          onChange={(e) => setConfirmInput(e.target.value)} 
          placeholder="Escribe el radicado aquí" 
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
          <button 
            onClick={handleConfirm} 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:bg-red-300 disabled:active:scale-100" 
            disabled={updating || confirmInput !== radicado}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
