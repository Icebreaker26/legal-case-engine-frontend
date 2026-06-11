import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchableSelect({ options, value, onChange, placeholder, labelField = 'nombre', valueField = 'id' }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const selected = options.find(o => o[valueField] == value);
    const filteredOptions = options.filter(o => String(o[labelField]).toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-[#e0dcc8] border-b-2 border-[#2d4a3e] p-2 outline-none text-[#1a1a1a] uppercase text-sm placeholder-[#2d4a3e]/50 text-left flex justify-between items-center">
                {selected ? selected[labelField] : placeholder}
                <Search size={16} />
            </button>
            {isOpen && (
                <div className="absolute z-50 w-full bg-[#e0dcc8] border border-[#2d4a3e] max-h-40 overflow-y-auto mt-1">
                    <input className="w-full bg-transparent p-2 border-b border-[#2d4a3e] text-xs" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    {filteredOptions.map(o => (
                        <div key={o[valueField]} className="p-2 hover:bg-[#2d4a3e] hover:text-[#e0dcc8] cursor-pointer text-xs" onClick={() => { onChange(o[valueField]); setIsOpen(false); setSearchTerm(''); }}>
                            {o[labelField]}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
