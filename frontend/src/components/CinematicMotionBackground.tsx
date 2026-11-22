import React, { useEffect, useRef } from 'react';

interface CinematicMotionBackgroundProps {
  intensity?: number;
  className?: string;
}

export const CinematicMotionBackground: React.FC<CinematicMotionBackgroundProps> = ({
  intensity = 0.35,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      active: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.active = true;
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Grid configuration for high-performance 60fps
    const GRID_SPACING = 38;
    const CONTOUR_COUNT = 7;

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.008;

      // Mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Deep carbon obsidian base gradient
      const bgGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        50,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGrad.addColorStop(0, '#0d0f12');
      bgGrad.addColorStop(0.5, '#060708');
      bgGrad.addColorStop(1, '#040405');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. AERODYNAMIC TOPOGRAPHIC CONTOUR FLOW LINES
      for (let c = 0; c < CONTOUR_COUNT; c++) {
        const offsetMultiplier = (c + 1) * 0.13;
        const baseY = height * (0.15 + c * 0.12);

        ctx.beginPath();
        for (let x = 0; x <= width; x += 18) {
          // Distance to cursor
          const dx = x - mouse.x;
          const dy = baseY - mouse.y;
          const distToCursor = Math.hypot(dx, dy);

          // Cursor warp ripple effect
          const ripple = Math.exp(-distToCursor / 180) * Math.sin(distToCursor * 0.04 - t * 4) * 22;

          // Aerodynamic undulating wave
          const wave =
            Math.sin(x * 0.0025 + t * 1.2 + c * 0.7) * 28 +
            Math.cos(x * 0.001 - t * 0.8 + c) * 16 +
            ripple;

          const y = baseY + wave;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Hairline stroke with Acid Volt accent proximity boost
        const alpha = Math.min(0.2, (0.035 + c * 0.012) * (intensity * 2.5));
        ctx.strokeStyle = c % 2 === 0 ? `rgba(255, 255, 255, ${alpha})` : `rgba(212, 255, 0, ${alpha * 0.9})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. INTERACTIVE DOT-MATRIX GRID WITH CURSOR WARP
      const cols = Math.ceil(width / GRID_SPACING);
      const rows = Math.ceil(height / GRID_SPACING);

      for (let i = 0; i <= cols; i++) {
        const baseX = i * GRID_SPACING;
        for (let j = 0; j <= rows; j++) {
          const baseY = j * GRID_SPACING;

          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.hypot(dx, dy);

          let px = baseX;
          let py = baseY;
          let dotRadius = 0.85;
          let dotAlpha = 0.07;

          // Warp vertices away/towards cursor dynamically
          if (dist < 220) {
            const factor = (1 - dist / 220);
            const repel = factor * 14;
            px += (dx / (dist || 1)) * repel;
            py += (dy / (dist || 1)) * repel;
            dotRadius = 0.85 + factor * 1.5;
            dotAlpha = 0.07 + factor * 0.45;
          }

          ctx.beginPath();
          ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = dist < 140 ? `rgba(212, 255, 0, ${dotAlpha})` : `rgba(255, 255, 255, ${dotAlpha})`;
          ctx.fill();
        }
      }

      // 3. SUBTLE AMBIENT RADIAL LIGHT SPOT AT CURSOR
      const cursorGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 350);
      cursorGlow.addColorStop(0, 'rgba(212, 255, 0, 0.035)');
      cursorGlow.addColorStop(0.5, 'rgba(212, 255, 0, 0.008)');
      cursorGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = cursorGlow;
      ctx.fillRect(0, 0, width, height);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none -z-10 w-full h-full ${className}`}
    />
  );
};

export default CinematicMotionBackground;
