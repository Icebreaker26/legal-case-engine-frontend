import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, RotateCcw } from 'lucide-react';
import ConstellationBackground from '../modules/rendimiento/components/ConstellationBackground';

// ── Snake game ────────────────────────────────────────────────────────────────
const COLS = 20;
const ROWS = 16;
const TICK = 130;

const rndFood = (snake) => {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
};

const INIT_SNAKE = [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }];
const INIT_DIR   = { x: 1, y: 0 };

function Snake() {
  const [snake, setSnake]   = useState(INIT_SNAKE);
  const [food, setFood]     = useState({ x: 15, y: 8 });
  const [dir, setDir]       = useState(INIT_DIR);
  const [score, setScore]   = useState(0);
  const [best, setBest]     = useState(0);
  const [dead, setDead]     = useState(false);
  const [started, setStarted] = useState(false);

  const dirRef   = useRef(INIT_DIR);
  const snakeRef = useRef(INIT_SNAKE);
  const foodRef  = useRef({ x: 15, y: 8 });
  const deadRef  = useRef(false);

  const reset = useCallback(() => {
    const s = INIT_SNAKE;
    const d = INIT_DIR;
    const f = rndFood(s);
    setSnake(s); setDir(d); setFood(f);
    setScore(0); setDead(false); setStarted(true);
    snakeRef.current = s;
    dirRef.current   = d;
    foodRef.current  = f;
    deadRef.current  = false;
  }, []);

  // Teclado
  useEffect(() => {
    const MAP = {
      ArrowUp:    { x: 0,  y: -1 },
      ArrowDown:  { x: 0,  y:  1 },
      ArrowLeft:  { x: -1, y:  0 },
      ArrowRight: { x: 1,  y:  0 },
      w: { x: 0,  y: -1 }, s: { x: 0,  y:  1 },
      a: { x: -1, y:  0 }, d: { x: 1,  y:  0 },
    };
    const handler = (e) => {
      if (MAP[e.key]) {
        e.preventDefault();
        const nd = MAP[e.key];
        const cd = dirRef.current;
        // No permitir dirección opuesta
        if (nd.x === -cd.x && nd.y === -cd.y) return;
        if (!started) { setStarted(true); }
        dirRef.current = nd;
        setDir(nd);
      }
      if (e.key === 'Enter' || e.key === ' ') reset();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset, started]);

  // Game loop
  useEffect(() => {
    if (!started || deadRef.current) return;
    const interval = setInterval(() => {
      if (deadRef.current) return;
      setSnake(prev => {
        const head = {
          x: (prev[0].x + dirRef.current.x + COLS) % COLS,
          y: (prev[0].y + dirRef.current.y + ROWS) % ROWS,
        };
        // Colisión con sí mismo
        if (prev.some(s => s.x === head.x && s.y === head.y)) {
          deadRef.current = true;
          setDead(true);
          setBest(b => Math.max(b, prev.length - 3));
          return prev;
        }
        const ate = head.x === foodRef.current.x && head.y === foodRef.current.y;
        const next = ate ? [head, ...prev] : [head, ...prev.slice(0, -1)];
        if (ate) {
          const nf = rndFood(next);
          foodRef.current = nf;
          setFood(nf);
          setScore(s => s + 1);
        }
        snakeRef.current = next;
        return next;
      });
    }, TICK);
    return () => clearInterval(interval);
  }, [started]);

  const grid = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      const isHead  = snake[0].x === x && snake[0].y === y;
      const isSnake = !isHead && snake.some(s => s.x === x && s.y === y);
      const isFood  = food.x === x && food.y === y;
      return { isHead, isSnake, isFood };
    })
  );

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Marcadores */}
      <div className="flex gap-6 text-[10px] font-mono uppercase tracking-widest">
        <span className="text-slate-600">Score: <span className="text-emerald-500">{score}</span></span>
        <span className="text-slate-600">Best:  <span className="text-indigo-400">{best}</span></span>
      </div>

      {/* Grid */}
      <div
        className="border border-slate-800 bg-black/60 p-1"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 16px)`, gap: '1px' }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              style={{ width: 16, height: 16 }}
              className={
                cell.isHead  ? 'bg-emerald-400'  :
                cell.isSnake ? 'bg-emerald-700'  :
                cell.isFood  ? 'bg-red-500 animate-pulse' :
                'bg-slate-950'
              }
            />
          ))
        )}
      </div>

      {/* Estado */}
      <div className="text-[10px] font-mono text-slate-700 tracking-widest uppercase">
        {!started && !dead && '[ ENTER / ESPACIO para iniciar ]'}
        {started && !dead && '[ ↑ ↓ ← → para mover ]'}
        {dead && (
          <span className="text-red-600 animate-pulse">
            GAME OVER — ENTER para reiniciar
          </span>
        )}
      </div>
    </div>
  );
}

// ── Página 404 ────────────────────────────────────────────────────────────────
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-mono flex flex-col items-center justify-center relative overflow-hidden py-12">
      <ConstellationBackground />

      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-8 w-full">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-red-900 border border-red-900/40 bg-red-950/20 px-4 py-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          KERNEL PANIC — RUTA NO ENCONTRADA
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="border border-slate-800 bg-slate-900/40 px-6 py-4 text-left w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
            <Terminal size={11} className="text-red-500" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">core_os — error.log</span>
          </div>
          <p className="text-[11px] text-red-500 mb-1">{`> ERROR 0x404: MODULE_NOT_FOUND`}</p>
          <p className="text-[11px] text-slate-600 mb-1">{`> PATH: ${window.location.pathname}`}</p>
          <p className="text-[11px] text-slate-700">{`> Mientras esperas, juega Snake.`}</p>
        </motion.div>

        {/* Snake */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Snake />
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
