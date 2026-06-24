import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, RotateCcw } from 'lucide-react';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-mono flex flex-col items-center justify-center relative overflow-hidden">
      <ConstellationBackground />

      <div className="relative z-10 flex flex-col items-center text-center px-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-10 text-[10px] uppercase tracking-[0.25em] text-red-900 border border-red-900/40 bg-red-950/20 px-4 py-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          KERNEL PANIC — RUTA NO ENCONTRADA
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <span className="text-[120px] sm:text-[160px] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-900 select-none">
            404
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border border-slate-800 bg-slate-900/40 px-6 py-4 text-left w-full max-w-md mb-10"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
            <Terminal size={11} className="text-red-500" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">core_os — error.log</span>
          </div>
          <p className="text-[11px] text-red-500 mb-1">{`> ERROR 0x404: MODULE_NOT_FOUND`}</p>
          <p className="text-[11px] text-slate-600 mb-1">{`> PATH: ${window.location.pathname}`}</p>
          <p className="text-[11px] text-slate-700">{`> STACK: null reference in routing table`}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-2.5 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            <RotateCcw size={12} /> VOLVER ATRÁS
          </button>
          <button
            onClick={() => navigate('/selector')}
            className="flex items-center gap-2 px-6 py-2.5 border border-indigo-800 bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/40 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            [ IR AL SELECTOR ]
          </button>
        </motion.div>

      </div>

      <footer className="absolute bottom-6 text-[9px] text-slate-800 uppercase tracking-[0.2em]">
        ICEBREAKER © 2026 // CORE OPERATING SYSTEM
      </footer>
    </div>
  );
}
