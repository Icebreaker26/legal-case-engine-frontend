import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

/**
 * Props:
 *  options     — [{ value, label, sub? }]
 *  value       — valor seleccionado actualmente
 *  onChange    — (value) => void
 *  placeholder — texto cuando no hay selección
 *  disabled    — bool
 *  noResultsText — texto cuando no hay coincidencias
 */
export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Selecciona una opción...',
    disabled = false,
    noResultsText = 'Sin resultados',
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find(o => String(o.value) === String(value)) || null;

    const filtered = options.filter(o =>
        !query || o.label.toLowerCase().includes(query.toLowerCase())
    );

    // Cierra al hacer clic fuera
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Enfoca el input al abrir
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 30);
    }, [open]);

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setQuery('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm transition-all text-left ${
                    disabled
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : open
                        ? 'border-pink-500 ring-2 ring-pink-500 bg-white'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                }`}
            >
                <span className={selected ? 'text-gray-800 font-medium truncate pr-2' : 'text-gray-400 truncate pr-2'}>
                    {selected ? selected.label : placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {selected && !disabled && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            <X size={13} />
                        </span>
                    )}
                    <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {/* Buscador */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all placeholder:text-gray-400"
                                placeholder="Buscar..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista */}
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-400 text-center italic">{noResultsText}</li>
                        ) : (
                            filtered.map(opt => (
                                <li
                                    key={opt.value}
                                    onClick={() => handleSelect(opt)}
                                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                                        String(opt.value) === String(value)
                                            ? 'bg-pink-50 text-pink-700'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{opt.label}</p>
                                        {opt.sub && <p className="text-[11px] text-gray-400 truncate mt-0.5">{opt.sub}</p>}
                                    </div>
                                    {String(opt.value) === String(value) && (
                                        <Check size={14} className="text-pink-600 shrink-0 ml-2" />
                                    )}
                                </li>
                            ))
                        )}
                    </ul>

                    {/* Contador */}
                    {options.length > 10 && (
                        <div className="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400">
                            {filtered.length} de {options.length} opciones
                            {query && ` · "${query}"`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
