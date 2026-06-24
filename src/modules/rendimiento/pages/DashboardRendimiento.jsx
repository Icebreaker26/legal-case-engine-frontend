import { useState, useEffect, useMemo } from 'react';
import apiService from '../../../services/apiService';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, History } from 'lucide-react';
import ModalHistorialAcciones from '../components/ModalHistorialAcciones';
import MilitaryProfileCard from '../components/MilitaryProfileCard';
import UserKPIs from '../components/UserKPIs';
import HelpButton from '../../../components/HelpButton';

export default function DashboardRendimiento() {
  const { user } = useAuth();
  const [objetivos, setObjetivos] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [showHistorial, setShowHistorial] = useState(null);
  const [peso, setPeso] = useState(1);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (user) fetchObjetivos();
  }, [user]);

  const fetchObjetivos = async () => {
    try {
      const { data } = await apiService.get(`/rendimiento/cumplimiento/individual/${user.id}`);
      setObjetivos(data);
    } catch (error) { toast.error('Error al cargar objetivos'); }
  };

  const handleRegistrarAvance = async (objetivoId) => {
    try {
      await apiService.post('/rendimiento/acciones', {
        objetivo_id: objetivoId,
        comentario,
        peso: parseInt(peso)
      });
      toast.success('Avance registrado');
      setShowModal(null);
      setComentario('');
      setPeso(1);
      fetchObjetivos();
    } catch (error) { toast.error('Error al registrar avance'); }
  };

  const [filtros, setFiltros] = useState({ mes: '', estado: 'active' });

  // ... (existing fetch functions)

  const [busqueda, setBusqueda] = useState('');

  // ... (existing fetch functions)

  const objetivosFiltrados = useMemo(() => {
    return objetivos.filter(obj => {
        const matchMes = filtros.mes === '' || obj.mes === parseInt(filtros.mes);
        const estadoRaw = obj.estado;
        const estadoLimpio = String(estadoRaw || '').replace(/'/g, '').trim().toLowerCase();
        const filtroLimpio = filtros.estado.toLowerCase();
        
        const matchEstado = filtros.estado === '' || estadoLimpio === filtroLimpio;
        
        const matchBusqueda = busqueda === '' || 
                              obj.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                              (obj.descripcion || '').toLowerCase().includes(busqueda.toLowerCase());
                              
        return matchMes && matchEstado && matchBusqueda;
    });
  }, [objetivos, filtros, busqueda]);

  const mesesDisponibles = useMemo(() => [...new Set(objetivos.map(o => o.mes))], [objetivos]);

  return (
    <div className="terminal-border bg-[#050A05] border-2 border-[#1A441A] p-6 text-[#33FF33] font-mono shadow-[0_0_10px_rgba(51,255,51,0.1)]">
      <div className="flex items-center gap-3 border-b border-[#1A441A] pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#33FF33]">[ MI PR0GRES0 ]</h2>
        <HelpButton
          title="Cómo usar el módulo de Rendimiento"
          color="text-[#33FF33]"
          accentColor="#33FF33"
          theme="dark"
          tips={[
            'Este panel muestra tus objetivos activos del mes y tu porcentaje de cumplimiento.',
            'Registra avances cada vez que completes una acción relacionada con un objetivo.',
            'El peso (1-10) que asignas a cada acción determina cuánto suma al % del objetivo.',
            'Los managers pueden ver el progreso de todo el equipo desde el Dashboard del Manager.',
          ]}
          sections={[
            {
              title: '¿Qué hace este módulo?',
              content: (
                <p>
                  Este módulo hace seguimiento al cumplimiento de objetivos mensuales por cada miembro del equipo jurídico.
                  Cada abogado tiene objetivos asignados por su manager, y registra avances a medida que completa actividades.
                  El sistema calcula automáticamente el porcentaje de cumplimiento y permite que managers y coordinadores
                  vean el desempeño del equipo en tiempo real.
                </p>
              )
            },
            {
              title: 'Cómo registrar un avance',
              content: (
                <ol className="list-decimal list-inside space-y-2">
                  <li>En la lista de objetivos, ubica el objetivo al que quieres registrar un avance.</li>
                  <li>Haz clic en el botón <b>Registrar Avance</b> (ícono de suma).</li>
                  <li>Ingresa el <b>peso</b> de la acción en una escala de 1 a 10 — usa valores más altos para actividades más relevantes o complejas.</li>
                  <li>Escribe un <b>comentario</b> describiendo qué hiciste concretamente (ej. "Radicación de contestación tutela #2024-123").</li>
                  <li>Guarda — el sistema suma el peso al acumulado del objetivo y actualiza tu % de cumplimiento al instante.</li>
                </ol>
              )
            },
            {
              title: 'Entender el porcentaje de cumplimiento',
              content: (
                <p>
                  Cada objetivo tiene una <b>meta de puntos</b> definida por el manager. El % de cumplimiento es la suma de
                  los pesos de todas tus acciones registradas dividida entre esa meta. Por ejemplo, si la meta es 50 puntos
                  y has registrado acciones por 35 puntos, tu cumplimiento es del 70%. Puedes ver el historial de todas
                  tus acciones haciendo clic en el ícono de historial del objetivo.
                </p>
              )
            },
            {
              title: 'Estados de los objetivos',
              content: (
                <ul className="list-disc list-inside space-y-2">
                  <li><b>Activo:</b> el objetivo está vigente y puedes seguir registrando avances.</li>
                  <li><b>Completado:</b> alcanzaste o superaste el 100% de la meta — felicidades.</li>
                  <li><b>Vencido:</b> el mes terminó y el objetivo no se completó — queda en el historial para análisis.</li>
                </ul>
              )
            },
            {
              title: 'Para managers: vista del equipo',
              content: (
                <p>
                  Si tienes rol de manager, accede al <b>Dashboard del Manager</b> desde el menú para ver el progreso
                  de todo tu equipo en un solo lugar. Desde el <b>Gestor de Equipos</b> puedes asignar nuevos objetivos
                  mensuales, ajustar metas existentes y consultar el historial de cumplimiento de períodos anteriores.
                </p>
              )
            }
          ]}
        />
      </div>

      <MilitaryProfileCard user={user} />
      <UserKPIs objetivos={objetivosFiltrados} />
      
      {/* Filtros */}
      <div className="mb-6 flex gap-4 p-4 border border-[#1A441A] bg-[#0A140A] flex-wrap">
        <div>
            <label className="block text-xs uppercase text-[#1A441A] mb-1">Mes:</label>
            <select className="bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none" value={filtros.mes} onChange={e => setFiltros({...filtros, mes: e.target.value})}>
                <option value="">Todos</option>
                {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-xs uppercase text-[#1A441A] mb-1">Estado:</label>
            <select className="bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none" value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}>
                <option value="active">Activos</option>
                <option value="archived">Archivados/Terminados</option>
                <option value="">Todos</option>
            </select>
        </div>
        <div className="flex-1">
            <label className="block text-xs uppercase text-[#1A441A] mb-1">Buscar:</label>
            <input 
                className="w-full bg-[#050A05] border border-[#1A441A] p-2 text-sm text-[#33FF33] outline-none"
                placeholder="Filtrar por título o descripción..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
            />
        </div>
      </div>
      
      <div className="space-y-6">
        {objetivosFiltrados.map(obj => {
          // Debugging

          
          const realizadas = Number(obj.acciones_realizadas) || 0;
          const meta = Number(obj.meta_acciones) || 1;
          const progreso = meta > 0 ? Math.min(Math.round((realizadas / meta) * 100), 100) : 0;
          
          // Cálculo de tiempo transcurrido en el mes (aprox)
          const hoy = new Date();
          const diasEnMes = new Date(obj.anio, obj.mes, 0).getDate();
          const progresoTiempo = Math.min((hoy.getDate() / diasEnMes) * 100, 100);
          
          let estadoColor = 'text-[#33FF33] border-[#1A441A]'; // OK
          let estadoLabel = 'STATUS: OK';
          
          if (progreso < progresoTiempo - 20) {
              estadoColor = 'text-[#FF3333] border-[#FF3333] animate-pulse'; // CRITICAL
              estadoLabel = 'STATUS: CRITICAL';
          } else if (progreso < progresoTiempo) {
              estadoColor = 'text-[#FFFF00] border-[#FFFF00]'; // WARNING
              estadoLabel = 'STATUS: WARNING';
          }
          
          return (
            <div key={obj.id} className="border border-[#1A441A] p-4 bg-[#0A140A] relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold uppercase tracking-wider">{obj.titulo}</h3>
                <div className={`border px-2 py-0.5 text-[10px] uppercase font-bold ${estadoColor}`}>
                    {estadoLabel}
                </div>
              </div>

              <div className="flex justify-end gap-2 mb-4">
                  <button onClick={() => setShowHistorial(obj.id)} className="bg-[#1A441A] text-[#33FF33] px-3 py-1 text-xs uppercase hover:bg-[#33FF33] hover:text-[#050A05]">
                    <History size={12}/> Historial
                  </button>
                  <button onClick={() => setShowModal(obj.id)} className="bg-[#1A441A] text-[#33FF33] px-3 py-1 text-xs uppercase hover:bg-[#33FF33] hover:text-[#050A05]">
                    <Plus size={12}/> Registrar Avance
                  </button>
              </div>
              
              <div className="w-full bg-[#050A05] h-4 border border-[#1A441A] overflow-hidden">
                <div className="bg-[#33FF33] h-full" style={{ width: `${progreso}%` }}></div>
              </div>
              <p className="text-xs mt-2 mb-4 tracking-widest">{realizadas} / {meta} ACCI0NES ({progreso}%)</p>

              <div className="mt-2 pt-2 border-t border-[#1A441A]">
                <p className="text-[10px] text-[#1A441A] uppercase tracking-wider mb-1">Descripción de la tarea:</p>
                <p className="text-xs text-[#33FF33] bg-[#050A05] p-2 border border-[#1A441A]">{obj.descripcion || 'Sin descripción.'}</p>
              </div>
            </div>
          );
        })}
        {objetivos.length === 0 && <p className="text-sm italic tracking-widest">[ N0 HAY 0BJETIV0S ASIGNAD0S ]</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
            <div className="bg-[#050A05] border-2 border-[#1A441A] p-8 w-full max-w-lg text-[#33FF33] font-mono shadow-[0_0_20px_rgba(51,255,51,0.2)]">
                <h3 className="text-lg font-bold mb-6 uppercase tracking-widest">[ REGISTRAR AVANCE ]</h3>
                <label className="block text-sm uppercase mb-2">Peso (Acciones):</label>
                <input className="w-full bg-[#050A05] border border-[#1A441A] p-3 mb-4 text-base text-[#33FF33] outline-none focus:border-[#33FF33]" type="number" placeholder="Ingrese cantidad..." value={peso} onChange={e => setPeso(e.target.value)} />
                <label className="block text-sm uppercase mb-2">Comentario:</label>
                <textarea className="w-full bg-[#050A05] border border-[#1A441A] p-3 mb-6 text-base text-[#33FF33] outline-none focus:border-[#33FF33] h-32" placeholder="Describa el avance..." value={comentario} onChange={e => setComentario(e.target.value)} />
                <div className="flex gap-4">
                    <button onClick={() => handleRegistrarAvance(showModal)} className="bg-[#1A441A] text-[#33FF33] px-6 py-3 text-base flex-1 uppercase hover:bg-[#33FF33] hover:text-[#050A05]">Guardar</button>
                    <button onClick={() => setShowModal(null)} className="bg-[#050A05] border border-[#1A441A] text-[#33FF33] px-6 py-3 text-base flex-1 uppercase hover:bg-[#33FF33] hover:text-[#050A05]">Cancelar</button>
                </div>
            </div>
        </div>
      )}
      
      {showHistorial && (
          <ModalHistorialAcciones objetivoId={showHistorial} onClose={() => setShowHistorial(null)} />
      )}
    </div>
  );
}
