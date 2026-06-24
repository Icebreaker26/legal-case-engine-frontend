import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * Select con barra de búsqueda integrada.
 * Props:
 *   options: [{ value, label }]
 *   value: string (valor seleccionado)
 *   onChange: (value) => void
 *   placeholder: string
 *   className: string (clases extra para el trigger)
 */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Seleccionar...', className = '' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  const handleSelect = (val) => { onChange(val); setOpen(false); setSearch(''); };
  const handleClear = (e) => { e.stopPropagation(); onChange(''); setSearch(''); };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 bg-[#e0dcc8] border border-[#2d4a3e] text-[#2d4a3e] px-2 py-1 text-xs uppercase w-full text-left"
      >
        <span className="flex-1 truncate">{selected ? selected.label : placeholder}</span>
        {value ? (
          <X size={12} onClick={handleClear} className="shrink-0 hover:text-red-700" />
        ) : (
          <ChevronDown size={12} className="shrink-0" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 min-w-full bg-[#e0dcc8] border border-[#2d4a3e] shadow-[4px_4px_0px_0px_#2d4a3e] mt-0.5">
          {/* Búsqueda */}
          <div className="flex items-center gap-1 border-b border-[#2d4a3e] px-2 py-1">
            <Search size={11} className="text-[#2d4a3e] shrink-0" />
            <input
              autoFocus
              className="bg-transparent outline-none text-[10px] text-[#1a1a1a] placeholder-[#2d4a3e]/50 w-full"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Opción vacía */}
          <div
            className="px-3 py-1.5 text-[10px] text-[#2d4a3e]/60 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer uppercase"
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </div>
          {/* Lista filtrada */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-[#2d4a3e]/50 italic">Sin resultados</div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  className={`px-3 py-1.5 text-[10px] uppercase cursor-pointer hover:bg-[#2d4a3e] hover:text-[#e0dcc8] ${
                    o.value === value ? 'bg-[#2d4a3e]/20 font-bold' : ''
                  }`}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
