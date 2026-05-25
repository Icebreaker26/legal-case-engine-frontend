import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendario() {
  const [tutelas, setTutelas] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchTutelas();
    fetchFestivos();
  }, []);

  const fetchTutelas = async () => {
    try {
      const { data } = await apiService.get('/tutelas');
      setTutelas(data);
    } catch (err) {
      toast.error('Error cargando tutelas');
    }
  };

  const fetchFestivos = async () => {
    try {
        const { data } = await apiService.get('/tutelas/festivos');
        console.log('Festivos recibidos:', data);
        // El formato de date-holidays es { date: 'YYYY-MM-DD HH:mm:ss', ... }
        setHolidays(data.map(h => h.date.split(' ')[0]));
    } catch (err) { toast.error('Error cargando festivos'); }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const isFestivo = (day) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  };

  const getEventsForDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return tutelas.filter(t => new Date(t.fecha_vencimiento).toISOString().split('T')[0] === dateStr);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarIcon /> {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h1>
            <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-white border rounded hover:bg-gray-100"><ChevronLeft size={20}/></button>
                <button onClick={() => changeMonth(1)} className="p-2 bg-white border rounded hover:bg-gray-100"><ChevronRight size={20}/></button>
            </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="bg-gray-100 p-2 text-center text-xs font-bold uppercase">{day}</div>
          ))}
          {[...Array(firstDay).fill(null), ...Array(days).fill(0).map((_, i) => i + 1)].map((day, i) => (
            <div key={i} className={`min-h-[120px] p-2 ${!day ? 'bg-gray-50' : 'bg-white'} ${isFestivo(day) ? 'bg-red-50' : ''}`}>
              {day && (
                <>
                  <p className={`text-xs font-bold mb-1 ${isFestivo(day) ? 'text-red-500' : 'text-gray-400'}`}>
                    {day} {isFestivo(day) && <span className="ml-1 text-[8px] uppercase">Festivo</span>}
                  </p>
                  <div className="space-y-1">
                    {getEventsForDay(day).map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => navigate(`/tutela/${t.id}`)}
                        className={`w-full text-[10px] text-left p-1 rounded border-l-2 truncate ${t.prioridad === 'Alta' ? 'bg-red-100 border-red-500 text-red-800' : 'bg-blue-100 border-blue-500 text-blue-800'}`}
                      >
                        {t.radicado}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
