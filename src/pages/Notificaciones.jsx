import { useState, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';

export default function Notificaciones() {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    try {
      // Obtenemos tutelas próximas a vencer y recordatorios de historial
      const { data } = await apiService.get('/tutelas');
      
      const hoy = new Date();
      const proximasVencimiento = data.filter(t => {
        const fecha = new Date(t.fecha_vencimiento);
        const diffTime = fecha - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3 && t.estado !== 'Respondida';
      }).map(t => ({
        id: t.id,
        titulo: `Vencimiento próximo: ${t.radicado}`,
        mensaje: `La tutela vence el ${new Date(t.fecha_vencimiento).toLocaleDateString()}`,
        tipo: 'vencimiento'
      }));

      setAlertas([...proximasVencimiento]);
    } catch (error) {
      toast.error('Error al cargar alertas');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#002E6D] mb-6 flex items-center gap-2">
        <Bell size={24} /> Centro de Notificaciones
      </h1>
      
      <div className="space-y-4">
        {alertas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            No tienes notificaciones pendientes. ¡Todo al día!
          </div>
        ) : (
          alertas.map((alerta, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-50 rounded-full text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{alerta.titulo}</h4>
                  <p className="text-sm text-gray-600">{alerta.mensaje}</p>
                </div>
              </div>
              <Link to={`/tutela/${alerta.id}`} className="text-[#002E6D] hover:bg-blue-50 p-2 rounded-lg">
                <ChevronRight size={20} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
