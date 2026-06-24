import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale, FileText, Mail, Shield, Wallet, Leaf, BarChart2,
  ChevronRight, Terminal, Lock, Database, Zap,
} from 'lucide-react';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

const MODULOS = [
  { icon: Scale,    label: 'Derechos de Petición', color: 'text-blue-400',   border: 'border-blue-900/60',   bg: 'bg-blue-950/20'   },
  { icon: FileText, label: 'Contratos',             color: 'text-pink-400',   border: 'border-pink-900/60',   bg: 'bg-pink-950/20'   },
  { icon: Mail,     label: 'Comunicaciones',        color: 'text-amber-400',  border: 'border-amber-900/60',  bg: 'bg-amber-950/20'  },
  { icon: Shield,   label: 'Conformidades',         color: 'text-emerald-400',border: 'border-emerald-900/60',bg: 'bg-emerald-950/20'},
  { icon: Wallet,   label: 'Pagos (PDP)',           color: 'text-sky-400',    border: 'border-sky-900/60',    bg: 'bg-sky-950/20'    },
  { icon: Leaf,     label: 'Derecho Ambiental',     color: 'text-green-400',  border: 'border-green-900/60',  bg: 'bg-green-950/20'  },
  { icon: BarChart2,label: 'Reportes',              color: 'text-indigo-400', border: 'border-indigo-900/60', bg: 'bg-indigo-950/20' },
  { icon: Database, label: 'Catálogos',             color: 'text-orange-400', border: 'border-orange-900/60', bg: 'bg-orange-950/20' },
];

const PILARES = [
  { icon: Lock,     title: 'Seguridad',       desc: 'JWT en cookies HttpOnly, permisos granulares por usuario y módulo, borrado lógico.' },
  { icon: Zap,      title: 'Rendimiento',      desc: 'Queries paralelas, índices vectoriales HNSW, respuestas optimizadas con pgvector.' },
  { icon: Terminal, title: 'Trazabilidad',     desc: 'Historial de estados, auditoría de cambios y logs inmutables en cada módulo.' },
];

// Animación de texto tipo typewriter para el tagline
function Typewriter({ text, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = '';
    let i = 0;
    const t = setInterval(() => {
      el.textContent += text[i] ?? '';
      i++;
      if (i >= text.length) clearInterval(t);
    }, 45);
    return () => clearInterval(t);
  }, [text]);
  return <span ref={ref} className={className} />;
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-mono flex flex-col relative overflow-hidden">
      <ConstellationBackground />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <header className="relative z-10 border-b border-slate-800/50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-emerald-500" />
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">CORE OS</span>
          <span className="text-emerald-900 text-[10px] tracking-[0.2em] hidden sm:block">{'>'} ENEL COLOMBIA</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 transition-all"
        >
          [ INICIAR SESIÓN ] <ChevronRight size={12} />
        </button>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="mb-6 inline-flex items-center gap-2 border border-emerald-900 bg-emerald-950/20 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Sistema Operativo Centralizado — Build 2026
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-3xl mb-4">
          CORE<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
            OPERATING SYSTEM
          </span>
        </h1>

        <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] mb-6">
          <Typewriter text="// gestión integral de operaciones — enel colombia" className="text-slate-600" />
        </p>

        <p className="text-slate-400 text-sm max-w-xl leading-relaxed mb-10">
          Plataforma transversal para la gestión de procesos legales, ambientales,
          contractuales y operativos. Trazabilidad completa, permisos granulares,
          reportería cross-módulo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.7)]"
          >
            ACCEDER AL SISTEMA <ChevronRight size={14} />
          </button>
          <span className="text-[10px] text-slate-700 uppercase tracking-widest">
            Acceso restringido — requiere credenciales
          </span>
        </div>
      </section>

      {/* ── Módulos ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-8 pb-20 max-w-5xl mx-auto w-full">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700 text-center mb-8">
          :: MÓDULOS OPERATIVOS ::
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MODULOS.map(({ icon: Icon, label, color, border, bg }) => (
            <div
              key={label}
              className={`flex items-center gap-2.5 px-4 py-3 border ${border} ${bg} text-[10px] font-bold uppercase tracking-wide ${color}`}
            >
              <Icon size={13} /> {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pilares técnicos ──────────────────────────────────────────────── */}
      <section className="relative z-10 px-8 pb-24 max-w-5xl mx-auto w-full">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700 text-center mb-8">
          :: ARQUITECTURA ::
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PILARES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-slate-800 bg-slate-900/30 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={14} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">{title}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-[10px] text-slate-800 uppercase tracking-[0.2em]">
        ICEBREAKER © 2026 // ALEJANDRO M. TORRES — ENEL COLOMBIA
      </footer>
    </div>
  );
}
