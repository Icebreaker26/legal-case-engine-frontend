import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, labelField = 'nombre', valueField = 'id', className = '', isDark = false, variant = 'habano' }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const selected = options.find(o => o[valueField] == value);
    const filteredOptions = options.filter(o => String(o[labelField]).toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Terminal colors
    const isWhite = variant === 'white';
    const bgClass = isDark ? 'bg-[#0F172A]' : (isWhite ? 'bg-white' : 'bg-[#e0dcc8]');
    const borderClass = isDark ? 'border-slate-700' : (isWhite ? 'border-gray-300' : 'border-[#2d4a3e]');
    const textClass = isDark ? 'text-slate-200' : (isWhite ? 'text-gray-900' : 'text-[#1a1a1a]');
    const hoverClass = isDark ? 'hover:bg-slate-800' : (isWhite ? 'hover:bg-gray-100' : 'hover:bg-[#2d4a3e] hover:text-[#e0dcc8]');
    const iconClass = isDark ? "text-slate-400" : (isWhite ? "text-gray-400" : "text-[#2d4a3e]");
    
    return (
        <div className={`relative ${className}`}>
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className={`w-full ${bgClass} border-b-2 ${borderClass} p-2 outline-none ${textClass} uppercase text-sm text-left flex justify-between items-center`}
            >
                <span className="truncate">{selected ? selected[labelField] : placeholder}</span>
                <Search size={16} className={iconClass} />
            </button>
            {isOpen && (
                <div className={`absolute z-50 w-full ${bgClass} border ${borderClass} max-h-48 overflow-y-auto shadow-xl`}>
                    <input 
                        className={`w-full ${bgClass} p-2 border-b ${borderClass} text-xs outline-none ${textClass}`} 
                        placeholder="Buscar..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                    {filteredOptions.map(o => (
                        <div 
                            key={o[valueField]} 
                            className={`p-2 cursor-pointer text-xs uppercase ${hoverClass} ${textClass}`} 
                            onClick={() => { onChange(o[valueField]); setIsOpen(false); setSearchTerm(''); }}
                        >
                            {o[labelField]}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
