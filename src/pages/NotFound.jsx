import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, RotateCcw } from 'lucide-react';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

// ── Snake (mini) ──────────────────────────────────────────────────────────────
const COLS = 28;
const ROWS = 12;
const TICK = 140;

const rndFood = (snake) => {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
};

const mkSnake = () => [{ x: 8, y: 6 }, { x: 7, y: 6 }, { x: 6, y: 6 }];

function MiniSnake() {
  const [snake, setSnake]     = useState(mkSnake);
  const [food, setFood]       = useState(() => rndFood(mkSnake()));
  const [score, setScore]     = useState(0);
  const [dead, setDead]       = useState(false);
  const [tick, setTick]       = useState(0); // incrementar fuerza re-mount del loop

  const dirRef  = useRef({ x: 1, y: 0 });
  const foodRef = useRef(food);
  const deadRef = useRef(false);
  const activeRef = useRef(false);

  const reset = useCallback(() => {
    const s = mkSnake();
    const f = rndFood(s);
    foodRef.current  = f;
    deadRef.current  = false;
    dirRef.current   = { x: 1, y: 0 };
    activeRef.current = true;
    setSnake(s);
    setFood(f);
    setScore(0);
    setDead(false);
    setTick(t => t + 1); // fuerza re-ejecución del game loop
  }, []);

  // Teclado
  useEffect(() => {
    const MAP = {
      ArrowUp:    { x: 0, y: -1 }, ArrowDown:  { x: 0, y: 1 },
      ArrowLeft:  { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
      a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    };
    const handler = (e) => {
      if (MAP[e.key]) {
        e.preventDefault();
        const nd = MAP[e.key];
        const cd = dirRef.current;
        if (nd.x === -cd.x && nd.y === -cd.y) return;
        if (!activeRef.current) {
          activeRef.current = true;
          setTick(t => t + 1);
        }
        dirRef.current = nd;
      }
      if ((e.key === 'Enter' || e.key === ' ') && deadRef.current) reset();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  // Game loop — se remonta cada vez que tick cambia
  useEffect(() => {
    if (!activeRef.current) return;
    const interval = setInterval(() => {
      if (deadRef.current) return;
      setSnake(prev => {
        const head = {
          x: (prev[0].x + dirRef.current.x + COLS) % COLS,
          y: (prev[0].y + dirRef.current.y + ROWS) % ROWS,
        };
        // Colisión con sí mismo (excluye la cola que se moverá)
        if (prev.slice(0, -1).some(s => s.x === head.x && s.y === head.y)) {
          deadRef.current = true;
          setDead(true);
          return prev;
        }
        const ate = head.x === foodRef.current.x && head.y === foodRef.current.y;
        const next = ate ? [head, ...prev] : [head, ...prev.slice(0, -1)];
        if (ate) {
          const nf = rndFood(next);
          foodRef.current = nf;
          setFood(nf);
          setScore(sc => sc + 1);
        }
        return next;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [tick]);

  const active = activeRef.current;
  const CELL = active ? 22 : 10;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={{ opacity: active ? 1 : 0.4 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between w-full px-0.5"
      >
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-800">
          snake.exe
        </span>
        <span className="text-[9px] font-mono text-emerald-800">
          {score > 0 && `+${score}`}
        </span>
      </motion.div>

      <motion.div
        animate={{
          width:  COLS * CELL + (COLS - 1) + 4,
          height: ROWS * CELL + (ROWS - 1) + 4,
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="border border-slate-900 bg-black/40 overflow-hidden"
        style={{ padding: '2px' }}
      >
        <motion.div
          animate={{ gap: started ? '1px' : '1px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
            gap: '1px',
          }}
        >
          {Array.from({ length: ROWS }, (_, y) =>
            Array.from({ length: COLS }, (_, x) => {
              const isHead  = snake[0].x === x && snake[0].y === y;
              const isSnake = !isHead && snake.some(s => s.x === x && s.y === y);
              const isFood  = food.x === x && food.y === y;
              return (
                <motion.div
                  key={`${x}-${y}`}
                  animate={{ width: CELL, height: CELL }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={
                    isHead  ? 'bg-emerald-500' :
                    isSnake ? 'bg-emerald-900' :
                    isFood  ? 'bg-red-800'     :
                    'bg-transparent'
                  }
                />
              );
            })
          )}
        </motion.div>
      </motion.div>

      <p className="text-[9px] font-mono text-slate-800 uppercase tracking-widest">
        {!active && '↑↓←→ para jugar'}
        {active && dead && <span className="text-red-900 cursor-pointer" onClick={reset}>game over — enter</span>}
      </p>
    </div>
  );
}

// ── Página 404 ────────────────────────────────────────────────────────────────
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-mono flex flex-col items-center justify-center relative overflow-hidden">
      <ConstellationBackground />

      <div className="relative z-10 flex flex-col items-center text-center px-6">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-10 text-[10px] uppercase tracking-[0.25em] text-red-900 border border-red-900/40 bg-red-950/20 px-4 py-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          KERNEL PANIC — RUTA NO ENCONTRADA
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <span className="text-[120px] sm:text-[160px] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-900 select-none">
            404
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border border-slate-800 bg-slate-900/40 px-6 py-4 text-left w-full max-w-md mb-8"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
            <Terminal size={11} className="text-red-500" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">core_os — error.log</span>
          </div>
          <p className="text-[11px] text-red-500 mb-1">{`> ERROR 0x404: MODULE_NOT_FOUND`}</p>
          <p className="text-[11px] text-slate-600 mb-1">{`> PATH: ${window.location.pathname}`}</p>
          <p className="text-[11px] text-slate-700">{`> STACK: null reference in routing table`}</p>
        </motion.div>

        {/* Mini Snake — sutil, al fondo del terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-8"
        >
          <MiniSnake />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-2.5 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            <RotateCcw size={12} /> VOLVER ATRÁS
          </button>
          <button
            onClick={() => navigate('/selector')}
            className="flex items-center gap-2 px-6 py-2.5 border border-indigo-800 bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/40 hover:text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            [ IR AL SELECTOR ]
          </button>
        </motion.div>

      </div>

      <footer className="absolute bottom-6 text-[9px] text-slate-800 uppercase tracking-[0.2em]">
        ICEBREAKER © 2026 // CORE OPERATING SYSTEM
      </footer>
    </div>
  );
}
