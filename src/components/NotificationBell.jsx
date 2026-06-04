import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

export default function NotificationBell({ theme = 'light' }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [abierto, setAbierto] = useState(false);

    useEffect(() => {
        fetchNotificaciones();
        const interval = setInterval(fetchNotificaciones, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotificaciones = async () => {
        try {
            const { data } = await apiService.get('/notificaciones');
            setNotificaciones(data);
        } catch (error) { console.error('Error al cargar notificaciones'); }
    };

    const marcarLeida = async (id) => {
        try {
            await apiService.patch(`/notificaciones/${id}/leida`);
            fetchNotificaciones();
        } catch (error) { toast.error('Error al actualizar'); }
    };

    const noLeidas = notificaciones.filter(n => !n.leida);

    const bellColor = theme === 'dark' ? 'text-[#33FF33]' : 'text-[#2d4a3e]';
    const bgDropdown = theme === 'dark' ? 'bg-[#050A05]' : 'bg-[#e0dcc8]';
    const borderColor = theme === 'dark' ? 'border-[#33FF33]' : 'border-[#2d4a3e]';
    const textColor = theme === 'dark' ? 'text-[#33FF33]' : 'text-[#1a1a1a]';
    const hoverColor = theme === 'dark' ? 'hover:bg-[#1A441A]' : 'hover:bg-[#2d4a3e]/10';

    return (
        <div className="relative">
            <button onClick={() => setAbierto(!abierto)} className={`p-2 relative ${bellColor} transition-colors hover:scale-110`}>
                <Bell size={20} />
                {noLeidas.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {noLeidas.length}
                    </span>
                )}
            </button>
            
            {abierto && (
                <div className={`absolute right-0 top-12 w-80 ${bgDropdown} border-2 ${borderColor} shadow-2xl z-[100] p-4 max-h-96 overflow-y-auto ${textColor}`}>
                    <h3 className="font-bold uppercase text-xs mb-3 border-b border-[#2d4a3e]/30 pb-2">Notificaciones</h3>
                    {notificaciones.length === 0 ? <p className="text-xs italic opacity-70">No hay notificaciones.</p> : (
                        <ul className="space-y-2">
                            {notificaciones.map(n => (
                                <li key={n.id} className={`text-xs p-2 border-b border-[#2d4a3e]/20 flex justify-between items-center ${hoverColor} ${n.leida ? 'opacity-50' : ''}`}>
                                    <span className="pr-2">{n.mensaje}</span>
                                    {!n.leida && <button onClick={() => marcarLeida(n.id)} className={`${textColor} hover:text-green-500`} title="Marcar como leída"><Check size={14}/></button>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
