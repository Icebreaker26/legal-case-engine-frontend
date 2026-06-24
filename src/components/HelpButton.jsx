import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

function Section({ title, children, dark }) {
  const [open, setOpen] = useState(false);

  const wrapCls   = dark ? 'border border-[#1A441A] rounded-xl overflow-hidden'                                   : 'border border-gray-100 rounded-xl overflow-hidden';
  const btnCls    = dark ? 'w-full flex items-center justify-between px-4 py-3 bg-[#0A140A] transition-colors text-left' : 'w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left';
  const titleCls  = dark ? 'font-semibold text-[#33FF33] text-sm'                                                : 'font-semibold text-gray-700 text-sm';
  const iconCls   = dark ? 'text-[#33FF33] shrink-0'                                                             : 'text-gray-400 shrink-0';
  const bodyCls   = dark ? 'px-4 py-3 text-sm text-[#a0f0a0] leading-relaxed bg-[#050A05]'                      : 'px-4 py-3 text-sm text-gray-600 leading-relaxed bg-white';

  return (
    <div className={wrapCls}>
      <button onClick={() => setOpen(o => !o)} className={btnCls}>
        <span className={titleCls}>{title}</span>
        {open ? <ChevronUp size={16} className={iconCls} /> : <ChevronDown size={16} className={iconCls} />}
      </button>
      {open && <div className={bodyCls}>{children}</div>}
    </div>
  );
}

/**
 * HelpButton — hover muestra tooltip rápido, clic abre modal detallado.
 *
 * Props:
 *   title       string    — Título del modal
 *   color       string    — Clase Tailwind para el color del ícono (ej. "text-blue-600")
 *   accentColor string    — Color CSS para los círculos numerados del tooltip (ej. "#33FF33")
 *   theme       string    — "dark" para módulos con fondo oscuro
 *   tips        string[]  — Bullets cortos para el tooltip (hover)
 *   sections    Array<{ title: string, content: ReactNode }>
 */
export default function HelpButton({ title = 'Guía de uso', color = 'text-gray-500', accentColor = '', theme = 'light', tips = [], sections = [] }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const tooltipTimer = useRef(null);
  const wrapRef      = useRef(null);
  const dark = theme === 'dark';

  const handleMouseEnter = () => { clearTimeout(tooltipTimer.current); if (!showModal) setShowTooltip(true); };
  const handleMouseLeave = () => { tooltipTimer.current = setTimeout(() => setShowTooltip(false), 150); };
  const handleClick      = () => { setShowTooltip(false); setShowModal(true); };

  useEffect(() => () => clearTimeout(tooltipTimer.current), []);

  /* ── paleta del tooltip ── */
  const tt = dark
    ? { wrap: 'bg-[#0A140A] border border-[#1A441A]', arrow: 'border-b-[#0A140A]', arrowFilter: 'drop-shadow(0 -1px 0 #1A441A)', header: 'border-b border-[#1A441A]', headerText: 'text-xs font-semibold text-[#33FF33] uppercase tracking-widest', item: 'text-xs text-[#a0f0a0] leading-relaxed', footer: 'bg-[#050A05] border-t border-[#1A441A]', footerText: 'text-[10px] text-[#1A441A]' }
    : { wrap: 'bg-white border border-gray-200',       arrow: 'border-b-white',      arrowFilter: 'drop-shadow(0 -1px 0 #e5e7eb)',    header: 'border-b border-gray-100',    headerText: 'text-xs font-semibold text-gray-500 uppercase tracking-widest',  item: 'text-xs text-gray-600 leading-relaxed',   footer: 'bg-gray-50 border-t border-gray-100',   footerText: 'text-[10px] text-gray-400' };

  /* ── paleta del modal ── */
  const md = dark
    ? { wrap: 'bg-[#050A05] border-2 border-[#1A441A]', header: 'border-b border-[#1A441A]', title: 'font-bold text-base text-[#33FF33]', closeBtn: 'text-[#33FF33] hover:bg-[#0A140A]', footer: 'border-t border-[#1A441A]', footerText: 'text-xs text-[#1A441A]' }
    : { wrap: 'bg-white',                                header: 'border-b border-gray-100',  title: 'font-bold text-base text-gray-800',  closeBtn: 'text-gray-400 hover:bg-gray-100',    footer: 'border-t border-gray-100',   footerText: 'text-xs text-gray-400' };

  return (
    <>
      <div ref={wrapRef} className="relative inline-flex" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          onClick={handleClick}
          title="Ver guía de uso"
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border-2 border-current ${color} hover:bg-current/10 transition-colors shrink-0`}
        >
          <HelpCircle size={15} />
        </button>

        {/* ── Tooltip ── */}
        {showTooltip && tips.length > 0 && (
          <div className={`absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] z-50 w-72 rounded-xl shadow-lg overflow-hidden ${tt.wrap}`}>
            <div className={`absolute left-1/2 -translate-x-1/2 -top-[5px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[5px] ${tt.arrow}`} style={{ filter: tt.arrowFilter }} />
            <div className={`px-4 py-3 ${tt.header}`}>
              <p className={tt.headerText}>Vista rápida</p>
            </div>
            <ul className="px-4 py-3 space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className={`flex items-start gap-2 ${tt.item}`}>
                  <span
                    className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white${accentColor ? '' : ' ' + color.replace('text-', 'bg-')}`}
                    style={accentColor ? { backgroundColor: accentColor } : undefined}
                  >{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
            <div className={`px-4 py-2 ${tt.footer}`}>
              <p className={tt.footerText}>Haz clic en <strong>?</strong> para ver la guía completa</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col ${md.wrap}`}>
            <div className={`flex items-center justify-between px-6 py-4 ${md.header}`}>
              <div className="flex items-center gap-2">
                <HelpCircle size={20} className={color} />
                <h2 className={md.title}>{title}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg transition-colors ${md.closeBtn}`}>
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-2">
              {sections.map((s, i) => (
                <Section key={i} title={s.title} dark={dark}>{s.content}</Section>
              ))}
            </div>

            <div className={`px-6 py-3 text-center ${md.footer}`}>
              <p className={md.footerText}>¿Tienes dudas adicionales? Consulta con tu administrador.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
