import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Cpu, Scan, CheckCircle2, Radio } from 'lucide-react';
import { LiveEqualizerBar } from './LiveEqualizerBar';

export const AutomotiveTelemetryCard: React.FC = () => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((prev) => (prev + 1) % 100);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#111315] border border-white/15 chamfer-md bracket-box p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#d4ff00]/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header Telemetry */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="text-xs font-bold text-[#f7fafb] tracking-wider uppercase">
            FORENSIC TELEMETRY HUD
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#8e98a0]">
          <LiveEqualizerBar color="#00f0ff" />
          <span className="text-[#00f0ff] font-bold">60 FPS</span>
        </div>
      </div>

      {/* Center Cinematic Automotive Forensic HUD */}
      <div className="relative z-10 my-4 flex flex-col items-center justify-center">
        {/* Silhouette Vector with Forensic Scan Crosshair */}
        <div className="relative w-full max-w-[360px] h-44 bg-[#090a0b] border border-white/10 chamfer-sm flex items-center justify-center overflow-hidden">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Forensic Laser Sweep Beam */}
          <motion.div
            animate={{ x: [-180, 180, -180] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#00f0ff] to-transparent shadow-[0_0_12px_#00f0ff] pointer-events-none z-20"
          />

          {/* Automotive Vector Art */}
          <svg className="w-56 h-28 text-[#8e98a0] drop-shadow-[0_0_15px_rgba(0,240,255,0.25)]" viewBox="0 0 240 120" fill="none" stroke="currentColor" strokeWidth="2">
            {/* Aerodynamic car silhouette */}
            <path d="M 20 85 L 45 85 C 48 72 62 65 74 74 C 77 77 80 85 80 85 L 160 85 C 163 72 177 65 189 74 C 192 77 195 85 195 85 L 225 85 C 230 85 235 80 235 72 L 230 55 C 228 50 220 46 210 45 L 180 43 L 145 20 C 140 16 130 16 115 16 L 65 24 C 55 26 48 34 42 45 L 20 58 C 14 62 12 70 14 78 Z" stroke="#00f0ff" strokeWidth="2.2" fill="rgba(0, 240, 255, 0.05)" />
            {/* Windows */}
            <path d="M 68 28 L 115 22 C 125 22 135 22 142 24 L 172 43 L 65 44 Z" stroke="#f7fafb" strokeWidth="1.5" fill="rgba(255, 255, 255, 0.08)" />
            {/* Wheels */}
            <circle cx="62" cy="85" r="14" stroke="#d4ff00" strokeWidth="2.5" fill="#090a0b" />
            <circle cx="62" cy="85" r="6" stroke="#00f0ff" strokeWidth="1.5" />
            <circle cx="178" cy="85" r="14" stroke="#d4ff00" strokeWidth="2.5" fill="#090a0b" />
            <circle cx="178" cy="85" r="6" stroke="#00f0ff" strokeWidth="1.5" />
            {/* Chassis Inspection Tag */}
            <line x1="115" y1="22" x2="115" y2="85" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 3" />
          </svg>

          {/* Active target blip */}
          <div className="absolute top-8 left-12 px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[9px] chamfer-badge flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>CUT-PIECE CHASSIS</span>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 w-full mt-4 font-mono text-center">
          <div className="p-2.5 bg-[#090a0b] border border-white/10 chamfer-sm">
            <span className="text-[9px] text-[#8e98a0] block uppercase">CHASSIS INTEGRITY</span>
            <span className="text-sm font-bold text-red-400 mt-0.5 block">TAMPERED</span>
          </div>
          <div className="p-2.5 bg-[#090a0b] border border-white/10 chamfer-sm">
            <span className="text-[9px] text-[#8e98a0] block uppercase">DUTY CLEARANCE</span>
            <span className="text-sm font-bold text-[#d4ff00] mt-0.5 block">UNPAID (NCP)</span>
          </div>
          <div className="p-2.5 bg-[#090a0b] border border-white/10 chamfer-sm">
            <span className="text-[9px] text-[#8e98a0] block uppercase">CONFIDENCE</span>
            <span className="text-sm font-bold text-[#00f0ff] mt-0.5 block">99.2%</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Banner */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#8e98a0]">
        <span>CHAMAN BORDER CORRIDOR</span>
        <span className="text-[#00f0ff] font-bold">VALUATION: -74% BELOW MARKET</span>
      </div>
    </div>
  );
};

export default AutomotiveTelemetryCard;
