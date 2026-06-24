import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import ConstellationBackground from '../../rendimiento/components/ConstellationBackground';
import {
  LayoutDashboard, LogOut, User, Mail, Wallet, FileText, Target,
  Activity, Clock, AlertTriangle, ChevronRight, Search, X, Plus
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function diasRestantes(fecha) {
  return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
}

function EstadoBadge({ estado }) {
  const lower = estado?.toLowerCase() || '';
  const cls =
    lower.includes('respondid') || lower.includes('completad') || lower.includes('pagad') || lower === 'conformado'
      ? 'text-emerald-500 border-emerald-800'
      : lower.includes('urgent') || lower.includes('vencid')
      ? 'text-red-400 border-red-800'
      : 'text-slate-300 border-slate-500';
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest border px-1.5 py-0.5 ${cls}`}>
      {estado}
    </span>
  );
}

function SeccionCard({ titulo, icono, color, count, children, emptyMsg }) {
  const [abierto, setAbierto] = useState(true);
  return (
    <div className="border border-slate-800 bg-slate-900/40">
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={color}>{icono}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{titulo}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${count > 0 ? `${color} border-current` : 'text-slate-400 border-slate-500'}`}>
            {count}
          </span>
        </div>
        <ChevronRight size={13} className={`text-slate-400 transition-transform ${abierto ? 'rotate-90' : ''}`} />
      </button>
      {abierto && (
        <div className="border-t border-slate-800 divide-y divide-slate-800/60">
          {count === 0 ? (
            <p className="px-5 py-4 text-[10px] text-slate-500 italic">{emptyMsg}</p>
          ) : children}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MiPerfil() {
  const { user, permissions, hasPermission, logout } = useAuth();
  const [tareas, setTareas] = useState({ tutelas: [], comunicaciones: [], pagos: [], conformidades: [], contratos: [], objetivos: [], logs: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);

  const QUICK_ACTIONS = [
    { label: 'Nueva Tutela',        path: '/procesar',             perm: ['tutelas', 'WRITE'],            color: 'bg-blue-600 hover:bg-blue-500' },
    { label: 'Nueva Comunicación',  path: '/comunicaciones/nueva', perm: ['comunicaciones', 'WRITE_COM'], color: 'bg-amber-600 hover:bg-amber-500' },
    { label: 'Nuevo Pago',          path: '/pagos/nueva',          perm: ['pagos', 'WRITE_PAGO'],         color: 'bg-sky-600 hover:bg-sky-500' },
    { label: 'Nueva Conformidad',   path: '/conformidades/nueva',  perm: ['conformidades', 'WRITE'],      color: 'bg-emerald-600 hover:bg-emerald-500' },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const [tutRes, comRes, pagRes, confRes, ctRes, objRes, logRes] = await Promise.all([
          apiService.get('/tutelas/mis-tutelas').catch(() => ({ data: [] })),
          apiService.get('/comunicaciones/mis-comunicaciones').catch(() => ({ data: [] })),
          apiService.get('/pagos/mis-pagos').catch(() => ({ data: [] })),
          apiService.get('/conformidades/mis-conformidades').catch(() => ({ data: [] })),
          apiService.get('/contratos/auditorias/mis-auditorias').catch(() => ({ data: [] })),
          apiService.get('/rendimiento/mis-objetivos').catch(() => ({ data: [] })),
          apiService.get('/tutelas/logs/mis-logs').catch(() => ({ data: [] })),
        ]);
        setTareas({
          tutelas: tutRes.data,
          comunicaciones: comRes.data,
          pagos: pagRes.data,
          conformidades: confRes.data,
          contratos: ctRes.data,
          objetivos: objRes.data,
          logs: logRes.data,
        });
      } catch { toast.error('Error al cargar datos'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const f = tareas; // alias

  const alertas = useMemo(() => {
    const hoy = new Date();
    const en5 = new Date(); en5.setDate(hoy.getDate() + 5);
    return [
      ...f.tutelas.filter(t => t.fecha_vencimiento && new Date(t.fecha_vencimiento) <= en5 && t.estado !== 'Respondida')
        .map(t => ({ tipo: 'Tutela', ref: t.radicado, dias: diasRestantes(t.fecha_vencimiento), link: `/tutela/${t.id}` })),
      ...f.pagos.filter(p => p.fecha_limite && new Date(p.fecha_limite) <= en5 && !['completado', 'pagado'].includes(p.estado?.toLowerCase()))
        .map(p => ({ tipo: 'Pago', ref: p.concepto, dias: diasRestantes(p.fecha_limite), link: `/pagos/${p.id}` })),
    ].sort((a, b) => a.dias - b.dias);
  }, [f]);

  const q = search.toLowerCase();

  const tutFil = f.tutelas.filter(t =>
    (t.radicado?.toLowerCase().includes(q) || t.accionante?.toLowerCase().includes(q)) &&
    (!soloActivos || t.estado !== 'Respondida')
  );
  const comFil = f.comunicaciones.filter(c =>
    (c.asunto?.toLowerCase().includes(q) || c.entidad?.toLowerCase().includes(q)) &&
    (!soloActivos || c.estado !== 'respondida')
  );
  const pagFil = f.pagos.filter(p =>
    (p.concepto?.toLowerCase().includes(q) || p.nit?.toLowerCase().includes(q)) &&
    (!soloActivos || !['completado', 'pagado', 'rechazado'].includes(p.estado?.toLowerCase()))
  );
  const conFil = f.conformidades.filter(c =>
    c.concepto?.toLowerCase().includes(q) &&
    (!soloActivos || c.estado !== 'CONFORMADO')
  );
  const ctFil = f.contratos.filter(c =>
    (c.minuta_titulo?.toLowerCase().includes(q) || c.tercero_nombre?.toLowerCase().includes(q)) &&
    (!soloActivos || c.estado !== 'Completado')
  );

  const totalPendientes = tutFil.length + comFil.length + pagFil.length + conFil.length + ctFil.length;

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center font-mono text-slate-400 text-xs uppercase tracking-widest">
      Cargando...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-mono">
      <ConstellationBackground baseOpacity={0.15} />

      {/* ── Navbar ── */}
      <header className="relative z-10 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Mi Perfil</span>
          <div className="flex items-center gap-3">
            <Link to="/selector" className="text-slate-500 hover:text-white transition-colors" title="Selector">
              <LayoutDashboard size={18} />
            </Link>
            <button onClick={logout} className="text-red-600 hover:text-red-400 transition-colors" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10 space-y-8">

        {/* ── Identidad ── */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <User size={24} className="text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-[0.15em] text-white">{user?.nombre}</h1>
              <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
              <p className="text-[10px] text-slate-500 mt-2">
                {[...new Set(permissions.map(p => p.modulo))].join(' · ')}
              </p>
            </div>
          </div>

          {/* Stat pendientes */}
          <div className="border border-slate-800 bg-slate-900/40 px-6 py-4 text-center shrink-0">
            <p className={`text-4xl font-bold ${totalPendientes > 0 ? 'text-white' : 'text-slate-500'}`}>{totalPendientes}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">tareas activas</p>
          </div>
        </div>

        {/* ── Alertas de vencimiento ── */}
        {alertas.length > 0 && (
          <div className="border border-red-900/60 bg-red-950/20 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                {alertas.length} vencimiento{alertas.length > 1 ? 's' : ''} próximo{alertas.length > 1 ? 's'  : ''}
              </span>
            </div>
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <Link key={i} to={a.link} className="flex items-center justify-between hover:bg-red-950/30 px-2 py-1.5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-red-700 uppercase border border-red-900 px-1.5 py-0.5">{a.tipo}</span>
                    <span className="text-xs text-slate-300 truncate">{a.ref}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold ${a.dias <= 0 ? 'text-red-400' : a.dias <= 2 ? 'text-orange-400' : 'text-amber-400'}`}>
                      {a.dias <= 0 ? 'VENCIDO' : `${a.dias}d`}
                    </span>
                    <ChevronRight size={12} className="text-red-800 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Acciones rápidas ── */}
        {QUICK_ACTIONS.some(a => hasPermission(a.perm[0], a.perm[1])) && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">Acciones rápidas</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.filter(a => hasPermission(a.perm[0], a.perm[1])).map(a => (
                <Link
                  key={a.path}
                  to={a.path}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] ${a.color}`}
                >
                  <Plus size={12} /> {a.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Filtros ── */}
        <div className="flex items-center gap-4 border border-slate-800 bg-slate-900/30 px-4 py-3">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-700 outline-none"
            placeholder="Buscar en mis tareas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-400 transition-colors">
              <X size={13} />
            </button>
          )}
          <button
            onClick={() => setSoloActivos(v => !v)}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${
              soloActivos
                ? 'border-blue-700 text-blue-400 bg-blue-950/30'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soloActivos ? 'Solo activos' : 'Todos'}
          </button>
        </div>

        {/* ── Secciones por módulo ── */}
        <div className="space-y-3">

          {hasPermission('tutelas', 'READ') && (
            <SeccionCard titulo="Tutelas" icono={<FileText size={14} />} color="text-blue-400" count={tutFil.length} emptyMsg="Sin tutelas activas">
              {tutFil.map(t => (
                <Link key={t.id} to={`/tutela/${t.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors group">
                  <span className="text-xs font-bold text-blue-400 w-28 shrink-0">{t.radicado}</span>
                  <span className="text-xs text-slate-400 flex-1 truncate">{t.accionante}</span>
                  <EstadoBadge estado={t.estado} />
                  {t.fecha_vencimiento && (
                    <span className={`text-[10px] shrink-0 ${diasRestantes(t.fecha_vencimiento) <= 3 ? 'text-red-400' : 'text-slate-400'}`}>
                      {diasRestantes(t.fecha_vencimiento)}d
                    </span>
                  )}
                  <ChevronRight size={12} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </SeccionCard>
          )}

          {hasPermission('comunicaciones', 'READ_COM') && (
            <SeccionCard titulo="Comunicaciones" icono={<Mail size={14} />} color="text-amber-400" count={comFil.length} emptyMsg="Sin comunicaciones activas">
              {comFil.map(c => (
                <Link key={c.id} to={`/comunicaciones/${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors group">
                  <span className="text-xs text-slate-300 flex-1 truncate">{c.asunto}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{c.entidad}</span>
                  <EstadoBadge estado={c.estado} />
                  <ChevronRight size={12} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </SeccionCard>
          )}

          {hasPermission('pagos', 'READ_PAGO') && (
            <SeccionCard titulo="Pagos" icono={<Wallet size={14} />} color="text-sky-400" count={pagFil.length} emptyMsg="Sin pagos activos">
              {pagFil.map(p => (
                <Link key={p.id} to={`/pagos/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors group">
                  <span className="text-xs text-slate-300 flex-1 truncate">{p.concepto}</span>
                  <span className="text-xs font-bold text-sky-400 shrink-0">${parseFloat(p.monto || 0).toLocaleString('es-CO')}</span>
                  <EstadoBadge estado={p.estado} />
                  <ChevronRight size={12} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </SeccionCard>
          )}

          {hasPermission('conformidades', 'READ') && (
            <SeccionCard titulo="Conformidades" icono={<FileText size={14} />} color="text-emerald-400" count={conFil.length} emptyMsg="Sin conformidades activas">
              {conFil.map(c => (
                <Link key={c.id} to={`/conformidades/${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors group">
                  <span className="text-xs text-slate-300 flex-1 truncate">{c.concepto}</span>
                  <EstadoBadge estado={c.estado} />
                  <ChevronRight size={12} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </SeccionCard>
          )}

          {hasPermission('contratos', 'READ') && (
            <SeccionCard titulo="Contratos (Auditorías)" icono={<FileText size={14} />} color="text-pink-400" count={ctFil.length} emptyMsg="Sin auditorías activas">
              {ctFil.map(c => (
                <Link key={c.id} to={`/contratos/auditoria/${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/30 transition-colors group">
                  <span className="text-xs text-slate-300 flex-1 truncate">{c.minuta_titulo}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 truncate max-w-[140px]">{c.tercero_nombre}</span>
                  <EstadoBadge estado={c.estado} />
                  <ChevronRight size={12} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </SeccionCard>
          )}

          {hasPermission('rendimiento', 'READ') && f.objetivos.length > 0 && (
            <SeccionCard titulo="Objetivos" icono={<Target size={14} />} color="text-violet-400" count={f.objetivos.length} emptyMsg="Sin objetivos registrados">
              {f.objetivos.map((o, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs text-slate-300 flex-1">{o.meta_acciones} acciones</span>
                  <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.min((o.acciones_completadas / o.meta_acciones) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-violet-400 font-bold w-10 text-right">
                    {o.acciones_completadas}/{o.meta_acciones}
                  </span>
                </div>
              ))}
            </SeccionCard>
          )}

          {f.logs.length > 0 && (
            <SeccionCard titulo="Actividad reciente" icono={<Activity size={14} />} color="text-slate-400" count={f.logs.length} emptyMsg="Sin actividad registrada">
              {f.logs.slice(0, 10).map((l, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-2.5">
                  <span className="text-xs text-slate-400 flex-1">{l.accion}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{new Date(l.created_at).toLocaleDateString('es-CO')}</span>
                </div>
              ))}
            </SeccionCard>
          )}

        </div>
      </div>

      <footer className="relative z-10 mt-16 text-slate-500 text-[10px] uppercase tracking-[0.2em] text-center pb-8">
        ICEBREAKER © 2026 // PERFIL MODULE
      </footer>
    </div>
  );
}
