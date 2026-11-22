import React, { useRef, useEffect, useState } from 'react';
import { Shield, Radio, AlertTriangle, Crosshair, MapPin, Zap } from 'lucide-react';

interface Blip {
  id: string;
  name: string;
  corridor: string;
  angle: number; // in degrees
  distance: number; // 0 to 1 normalized
  risk: number;
  type: 'NCP Convoy' | 'Tampered Chassis' | 'Document Fraud' | 'Unregistered Ad';
  status: 'ACTIVE' | 'INTERCEPT_PENDING' | 'IDENTIFIED';
}

const CORRIDOR_BLIPS: Blip[] = [
  { id: 'BLIP-01', name: 'Chaman Sector-A', corridor: 'Chaman-Spin Boldak', angle: 45, distance: 0.65, risk: 94, type: 'NCP Convoy', status: 'ACTIVE' },
  { id: 'BLIP-02', name: 'Torkham Gate-3', corridor: 'Khyber Pass North', angle: 130, distance: 0.82, risk: 88, type: 'Tampered Chassis', status: 'INTERCEPT_PENDING' },
  { id: 'BLIP-03', name: 'Quetta Depot West', corridor: 'Balochistan Transit', angle: 215, distance: 0.45, risk: 91, type: 'Document Fraud', status: 'ACTIVE' },
  { id: 'BLIP-04', name: 'Nawa Pass Link', corridor: 'Bajaur Agency', angle: 310, distance: 0.72, risk: 76, type: 'Unregistered Ad', status: 'IDENTIFIED' },
];

export const TacticalBorderRadar: React.FC<{ className?: string }> = ({ className = 'h-[420px]' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedBlip, setSelectedBlip] = useState<Blip | null>(CORRIDOR_BLIPS[0]);
  const [azimuth, setAzimuth] = useState<number>(0);
  const angleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 24;

      ctx.clearRect(0, 0, width, height);

      // 1. Radar Background Radial
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      bgGrad.addColorStop(0, '#0C1322');
      bgGrad.addColorStop(0.8, '#060A12');
      bgGrad.addColorStop(1, '#030509');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric Radar Rings
      const rings = [0.25, 0.5, 0.75, 1.0];
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;

      rings.forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
        ctx.stroke();

        // Distance text
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`${Math.round(ratio * 200)} KM`, cx + 6, cy - radius * ratio + 10);
      });

      // 3. Crosshairs & Radial Spokes
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Cardinal direction ticks
      for (let i = 0; i < 360; i += 30) {
        const rad = (i * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * (radius - 6);
        const y1 = cy + Math.sin(rad) * (radius - 6);
        const x2 = cx + Math.cos(rad) * radius;
        const y2 = cy + Math.sin(rad) * radius;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 4. Update & Draw Radar Sweep Line with gradient trail
      angleRef.current = (angleRef.current + 0.02) % (Math.PI * 2);
      const sweepAngle = angleRef.current;
      setAzimuth(Math.round(((sweepAngle * 180) / Math.PI) % 360));

      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      sweepGrad.addColorStop(0, 'rgba(255, 77, 28, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(255, 77, 28, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweepAngle - 0.35, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Leading beam edge
      ctx.strokeStyle = '#FF4D1C';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.restore();

      // 5. Draw Target Blips
      CORRIDOR_BLIPS.forEach((blip) => {
        const rad = (blip.angle * Math.PI) / 180;
        const bx = cx + Math.cos(rad) * (radius * blip.distance);
        const by = cy + Math.sin(rad) * (radius * blip.distance);

        // Angle diff to sweep
        const diff = Math.abs(sweepAngle - rad);
        const isLit = diff < 0.4 || diff > Math.PI * 2 - 0.4;

        // Blip Outer Glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, isLit ? 10 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isLit ? 'rgba(255, 77, 28, 0.4)' : 'rgba(245, 158, 11, 0.2)';
        ctx.fill();

        // Blip Core
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = blip.risk >= 90 ? '#FF4D1C' : '#F59E0B';
        ctx.fill();

        // Label
        ctx.fillStyle = '#E2E8F0';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(blip.name, bx + 8, by - 6);

        ctx.fillStyle = blip.risk >= 90 ? '#FF4D1C' : '#F59E0B';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillText(`${blip.risk}% NCP RISK`, bx + 8, by + 6);
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className={`relative w-full rounded-2xl bg-[#060A12] border border-slate-800/80 p-5 overflow-hidden flex flex-col lg:flex-row items-center gap-6 shadow-2xl ${className}`}>
      {/* Canvas Radar Screen */}
      <div className="relative w-full lg:w-2/3 h-[320px] sm:h-[360px] flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

        {/* HUD Overlay Info */}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300 backdrop-blur-md pointer-events-none">
          <Radio className="w-3 h-3 text-[#FF4D1C] animate-pulse" />
          <span>FREQ: 9.4 GHz X-BAND</span>
          <span className="text-slate-600">|</span>
          <span>AZM: {azimuth}°</span>
        </div>

        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 border border-white/10 text-[10px] font-mono text-emerald-400 backdrop-blur-md pointer-events-none">
          SURVEILLANCE: PAK-AFGHAN TRANSIT ACTIVE
        </div>
      </div>

      {/* Corridor Telemetry Cards */}
      <div className="w-full lg:w-1/3 flex flex-col gap-3 font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Crosshair className="w-4 h-4 text-[#FF4D1C]" />
            <span>INTERCEPT TARGETS</span>
          </div>
          <span className="text-[10px] text-slate-400">{CORRIDOR_BLIPS.length} TRACKS</span>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {CORRIDOR_BLIPS.map((blip) => {
            const isSelected = selectedBlip?.id === blip.id;
            return (
              <button
                key={blip.id}
                type="button"
                onClick={() => setSelectedBlip(blip)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#0E1524] border-[#FF4D1C]/60 shadow-[0_0_15px_rgba(255,77,28,0.15)]'
                    : 'bg-[#090D17] border-slate-800/60 hover:border-slate-700 hover:bg-[#0C121F]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-200">{blip.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                    blip.risk >= 90 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {blip.risk}% RISK
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{blip.corridor}</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>{blip.type}</span>
                  <span className="text-emerald-400 font-bold">{blip.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default TacticalBorderRadar;