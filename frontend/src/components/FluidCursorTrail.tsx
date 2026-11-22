import React, { useEffect, useRef } from 'react';

interface RopePoint {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  vx: number;
  vy: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const FluidCursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse and scroll tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      vx: 0,
      vy: 0,
      lastX: width / 2,
      lastY: height / 2,
      active: false,
    };

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.active = true;
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.45;
      lastScrollY = currentScrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // -------------------------------------------------------------
    // VERLET ROPE PHYSICS CONFIGURATION
    // -------------------------------------------------------------
    const NUM_ROPE_SEGMENTS = 22;
    const SEGMENT_LENGTH = 7.5;
    const GRAVITY = 0.22;
    const FRICTION = 0.94;
    const RELAXATION_ITERATIONS = 8;

    const ropePoints: RopePoint[] = [];
    for (let i = 0; i < NUM_ROPE_SEGMENTS; i++) {
      ropePoints.push({
        x: mouse.x,
        y: mouse.y + i * SEGMENT_LENGTH,
        oldX: mouse.x,
        oldY: mouse.y + i * SEGMENT_LENGTH,
      });
    }

    // -------------------------------------------------------------
    // KINETIC MOUSE TRAIL & SPARK PARTICLES
    // -------------------------------------------------------------
    const trailPoints: TrailPoint[] = [];
    const sparks: SparkParticle[] = [];

    // Cache interactive elements for subtle magnetic snap
    let interactiveTargets: { x: number; y: number; radius: number }[] = [];
    let lastScanTime = 0;

    const updateInteractiveElements = (now: number) => {
      if (now - lastScanTime < 600) return;
      lastScanTime = now;
      const elements = document.querySelectorAll<HTMLElement>(
        'button, a, .chamfer-sm, .chamfer-md, .bracket-box, input'
      );
      interactiveTargets = Array.from(elements)
        .slice(0, 30) // limit for high 60fps performance
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: Math.max(rect.width, rect.height) / 2 + 30,
          };
        })
        .filter((t) => t.y >= -100 && t.y <= height + 100);
    };

    // -------------------------------------------------------------
    // RENDER LOOP (60 FPS)
    // -------------------------------------------------------------
    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      // Smooth cursor lerp
      mouse.vx = (mouse.targetX - mouse.x) * 0.35;
      mouse.vy = (mouse.targetY - mouse.y) * 0.35;
      mouse.x += mouse.vx;
      mouse.y += mouse.vy;

      const cursorSpeed = Math.hypot(mouse.vx, mouse.vy);

      // Decay scroll impulse
      scrollVelocity *= 0.88;

      updateInteractiveElements(now);

      // Magnetic attractor check on cursor
      let attractorX = mouse.x;
      let attractorY = mouse.y;
      for (const target of interactiveTargets) {
        const dist = Math.hypot(target.x - mouse.x, target.y - mouse.y);
        if (dist < target.radius) {
          const pull = (1 - dist / target.radius) * 0.18;
          attractorX += (target.x - mouse.x) * pull;
          attractorY += (target.y - mouse.y) * pull;
          break;
        }
      }

      // 1. UPDATE VERLET ROPE
      ropePoints[0].x = attractorX;
      ropePoints[0].y = attractorY;

      for (let i = 1; i < NUM_ROPE_SEGMENTS; i++) {
        const p = ropePoints[i];
        const vx = (p.x - p.oldX) * FRICTION;
        const vy = (p.y - p.oldY) * FRICTION + GRAVITY - scrollVelocity * 0.15;

        p.oldX = p.x;
        p.oldY = p.y;
        p.x += vx;
        p.y += vy;
      }

      // Jakobsen constraint relaxation
      for (let iter = 0; iter < RELAXATION_ITERATIONS; iter++) {
        for (let i = 0; i < NUM_ROPE_SEGMENTS - 1; i++) {
          const p1 = ropePoints[i];
          const p2 = ropePoints[i + 1];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const difference = (dist - SEGMENT_LENGTH) / dist;

          const offsetX = dx * 0.5 * difference;
          const offsetY = dy * 0.5 * difference;

          if (i === 0) {
            p2.x -= offsetX * 2;
            p2.y -= offsetY * 2;
          } else {
            p1.x += offsetX;
            p1.y += offsetY;
            p2.x -= offsetX;
            p2.y -= offsetY;
          }
        }
      }

      // 2. EMIT PARTICLES & TRAIL
      if (mouse.active) {
        trailPoints.push({
          x: mouse.x,
          y: mouse.y,
          age: 0,
          vx: mouse.vx,
          vy: mouse.vy,
        });

        if (cursorSpeed > 14 && sparks.length < 35) {
          sparks.push({
            x: mouse.x,
            y: mouse.y,
            vx: (Math.random() - 0.5) * 4 - mouse.vx * 0.15,
            vy: (Math.random() - 0.5) * 4 - mouse.vy * 0.15,
            life: 1,
            maxLife: 20 + Math.random() * 15,
            color: Math.random() > 0.4 ? '#D4FF00' : '#FF2A4B',
            size: Math.random() * 2 + 1,
          });
        }
      }

      // Bound trail queue
      if (trailPoints.length > 28) trailPoints.shift();

      // 3. DRAW FLUID KINETIC RIBBON TRAIL
      for (let i = 0; i < trailPoints.length; i++) {
        trailPoints[i].age += 1;
      }

      const activeTrail = trailPoints.filter((pt) => pt.age < 25);

      if (activeTrail.length > 2) {
        ctx.save();
        for (let i = 1; i < activeTrail.length; i++) {
          const p1 = activeTrail[i - 1];
          const p2 = activeTrail[i];
          const progress = i / activeTrail.length;
          const alpha = Math.max(0, (1 - p2.age / 25) * progress);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(212, 255, 0, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1 + progress * 2.8;
          ctx.lineCap = 'round';
          ctx.shadowColor = '#D4FF00';
          ctx.shadowBlur = 8;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. DRAW VERLET ROPE TETHER
      if (ropePoints.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ropePoints[0].x, ropePoints[0].y);

        for (let i = 1; i < ropePoints.length - 1; i++) {
          const xc = (ropePoints[i].x + ropePoints[i + 1].x) / 2;
          const yc = (ropePoints[i].y + ropePoints[i + 1].y) / 2;
          ctx.quadraticCurveTo(ropePoints[i].x, ropePoints[i].y, xc, yc);
        }
        ctx.lineTo(ropePoints[ropePoints.length - 1].x, ropePoints[ropePoints.length - 1].y);

        const ropeGradient = ctx.createLinearGradient(
          ropePoints[0].x,
          ropePoints[0].y,
          ropePoints[ropePoints.length - 1].x,
          ropePoints[ropePoints.length - 1].y
        );
        ropeGradient.addColorStop(0, 'rgba(212, 255, 0, 0.95)');
        ropeGradient.addColorStop(0.65, 'rgba(212, 255, 0, 0.5)');
        ropeGradient.addColorStop(1, 'rgba(255, 42, 75, 0.85)');

        ctx.strokeStyle = ropeGradient;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#D4FF00';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Terminal bead / tension weight at end of rope (Telemetry Crimson)
        const endNode = ropePoints[ropePoints.length - 1];
        ctx.beginPath();
        ctx.arc(endNode.x, endNode.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF2A4B';
        ctx.shadowColor = '#FF2A4B';
        ctx.shadowBlur = 12;
        ctx.fill();

        // Cursor razor anchor point (Acid Volt)
        ctx.beginPath();
        ctx.arc(ropePoints[0].x, ropePoints[0].y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#D4FF00';
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.restore();
      }

      // 5. DRAW SPARK PARTICLES
      ctx.save();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += 1;
        const progress = s.life / s.maxLife;

        if (progress >= 1) {
          sparks.splice(i, 1);
          continue;
        }

        const alpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 4;
        ctx.fill();
      }
      ctx.restore();
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

export default FluidCursorTrail;
