import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function NotificationBell() {
    const location = useLocation();
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

    const isRendimiento = location.pathname.includes('/rendimiento');
    const isComunicacionesOPagos = location.pathname.includes('/comunicaciones') || location.pathname.includes('/pagos');
    
    // Style profiles: Route-based
    const getStyles = () => {
        if (isRendimiento) {
            return {
                bell: 'text-[#33FF33]',
                bg: 'bg-[#050A05]',
                border: 'border-[#33FF33]',
                text: 'text-[#33FF33]',
                hover: 'hover:bg-[#1A441A]'
            };
        }
        if (isComunicacionesOPagos) {
            return {
                bell: 'text-[#2d4a3e]',
                bg: 'bg-[#e0dcc8]',
                border: 'border-[#2d4a3e]',
                text: 'text-[#1a1a1a]',
                hover: 'hover:bg-[#2d4a3e]/10'
            };
        }
        // White/Clean aesthetic for Tutelas/Standard
        return {
            bell: 'text-gray-600',
            bg: 'bg-white',
            border: 'border-gray-200',
            text: 'text-gray-800',
            hover: 'hover:bg-gray-100'
        };
    };

    const { bell, bg, border, text, hover } = getStyles();

    return (
        <div className="relative">
            <button onClick={() => setAbierto(!abierto)} className={`p-2 relative ${bell} transition-colors hover:scale-110`}>
                <Bell size={20} />
                {noLeidas.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {noLeidas.length}
                    </span>
                )}
            </button>
            
            {abierto && (
                <div className={`absolute right-0 top-12 w-80 ${bg} border-2 ${border} shadow-2xl z-[100] p-4 max-h-96 overflow-y-auto ${text} rounded-lg`}>
                    <h3 className="font-bold uppercase text-xs mb-3 border-b border-gray-500/20 pb-2">Notificaciones</h3>
                    {notificaciones.length === 0 ? <p className="text-xs italic opacity-70">No hay notificaciones.</p> : (
                        <ul className="space-y-2">
                            {notificaciones.map(n => (
                                <li key={n.id} className={`text-xs p-2 border-b border-gray-500/10 flex justify-between items-center ${hover} ${n.leida ? 'opacity-50' : ''} rounded-md`}>
                                    <span className="pr-2">{n.mensaje}</span>
                                    {!n.leida && <button onClick={() => marcarLeida(n.id)} className={`${text} hover:text-blue-500`} title="Marcar como leída"><Check size={14}/></button>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
