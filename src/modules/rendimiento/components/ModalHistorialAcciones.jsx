import { useState, useEffect } from 'react';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function ModalHistorialAcciones({ objetivoId, onClose }) {
  const [acciones, setAcciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetchAcciones();
  }, [objetivoId]);

  const fetchAcciones = async () => {
    setCargando(true);
    try {
      const { data } = await apiService.get(`/rendimiento/objetivos/${objetivoId}/acciones`);
      setAcciones(data);
    } catch (error) { toast.error('Error al cargar historial'); }
    finally { setCargando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="bg-[#050A05] border-2 border-[#1A441A] p-8 w-full max-w-2xl text-[#33FF33] font-mono shadow-[0_0_15px_rgba(51,255,51,0.2)]">
        <div className="flex justify-between items-center mb-6 border-b border-[#1A441A] pb-4">
            <h3 className="text-lg font-bold uppercase tracking-widest">[ HISTORIAL DE ACCIONES ]</h3>
            <button onClick={onClose} className="hover:text-white"><X size={24} /></button>
        </div>
        
        {cargando ? <p className="text-sm">Cargando...</p> : (
            <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
                {acciones.map(a => (
                    <li key={a.id} className="border border-[#1A441A] p-4 text-sm">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-[#33FF33] text-base">{a.profesional}</span>
                            <span className="text-[#1A441A]">{new Date(a.fecha_registro).toLocaleString()}</span>
                        </div>
                        <p className="text-[#33FF33] text-base mb-2">{a.comentario}</p>
                        <span className="text-[#00FF99] bg-[#1A441A] px-2 py-0.5 text-xs uppercase">Peso: {a.peso}</span>
                    </li>
                ))}
                {acciones.length === 0 && <p className="text-base italic tracking-widest">[ SIN ACCIONES REGISTRADAS ]</p>}
            </ul>
        )}
      </div>
    </div>
  );
}
