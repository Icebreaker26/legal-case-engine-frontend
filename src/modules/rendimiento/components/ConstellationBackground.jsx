import { useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';

export default function ConstellationBackground({ baseOpacity = 0.3, isTutelas = false }) {
  const { theme } = useTheme();
  const canvasRef = useRef(null);

  const isDark = theme === 'dark-pro';
  // Si no es tutelas, es "vivido" (brillante/neón). Si es tutelas, es sutil.
  const isVivid = !isTutelas;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Colores ajustados
      if (isVivid) {
          ctx.fillStyle = '#33FF33';
          ctx.strokeStyle = 'rgba(51, 255, 51, 0.4)';
      } else {
          if (isDark) {
              ctx.fillStyle = '#33FF33';
              ctx.strokeStyle = 'rgba(51, 255, 51, 0.9)';
          } else {
              // Light Mode: Color sutil para Tutelas (Azul)
              ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
              ctx.strokeStyle = 'rgba(37, 99, 235, 0.1)';
          }
      }

      stars.forEach((star, i) => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [theme, isVivid, isTutelas]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: isVivid ? 1.0 : baseOpacity }} />;
}
