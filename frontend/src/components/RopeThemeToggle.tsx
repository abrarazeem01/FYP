import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { soundEngine } from '../services/soundEngine';

// Synthesize a tactile mechanical switch click sound using Web Audio API
const playMechanicalClickSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.045);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // AudioContext might be blocked before first interaction
  }
};

export const RopeThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isPulling, setIsPulling] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  // Vertical drag displacement
  const dragY = useMotionValue(0);

  // Spring physics for realistic elastic recoil
  const springY = useSpring(dragY, {
    stiffness: 450,
    damping: 18,
    mass: 0.6,
  });

  // Dynamic cord endpoint
  const cordEndY = useTransform(springY, (val) => 82 + val);

  const triggerSwitch = () => {
    soundEngine.playRopeTug();
    playMechanicalClickSound();
    setRippleActive(true);
    setTimeout(() => setRippleActive(false), 500);

    // Get handle screen position for circular wipe origin
    if (handleRef.current) {
      const rect = handleRef.current.getBoundingClientRect();
      toggleTheme({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    } else {
      toggleTheme();
    }
  };

  const handleDrag = (_: any, info: { offset: { y: number } }) => {
    const clampedY = Math.max(0, Math.min(info.offset.y, 95));
    dragY.set(clampedY);

    if (clampedY >= 55 && !triggered) {
      setTriggered(true);
      triggerSwitch();
    }
  };

  const handleDragEnd = () => {
    setIsPulling(false);
    setTriggered(false);
    // Dynamic elastic snap recoil
    animate(dragY, 0, {
      type: 'spring',
      stiffness: 550,
      damping: 14,
      mass: 0.5,
    });
  };

  const handleClickToggle = () => {
    // Pull down and snap back on direct click
    animate(dragY, [0, 60, 0], {
      times: [0, 0.35, 1],
      duration: 0.45,
      ease: ['easeIn', 'backOut'],
    });
    triggerSwitch();
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed top-0 right-14 z-[9999] pointer-events-none select-none">
      <div className="relative pointer-events-auto">
        {/* SVG Flexible Tension Cord */}
        <svg
          width="48"
          height="210"
          className="overflow-visible"
          style={{ filter: isDark ? 'drop-shadow(0 4px 12px rgba(212,255,0,0.3))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
        >
          {/* Ceiling Mount Bracket */}
          <rect
            x="20"
            y="0"
            width="8"
            height="12"
            rx="2"
            fill={isDark ? '#14171c' : '#FFFFFF'}
            stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'}
            strokeWidth="1.5"
          />
          <circle cx="24" cy="12" r="3.5" fill={isDark ? '#D4FF00' : '#FF2A4B'} />

          {/* Elastic Cord with Tension Accent */}
          <motion.line
            x1="24"
            y1="12"
            x2="24"
            y2={cordEndY}
            stroke={isDark ? '#D4FF00' : '#111315'}
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        </svg>

        {/* Interactive Glowing Pull Handle / Tassel */}
        <motion.div
          ref={handleRef}
          drag="y"
          dragConstraints={{ top: 0, bottom: 95 }}
          dragElastic={0.25}
          onDragStart={() => setIsPulling(true)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={handleClickToggle}
          style={{ y: springY, top: 72, left: 6 }}
          className={`
            absolute w-9 h-14 rounded-full cursor-grab active:cursor-grabbing
            flex flex-col items-center justify-center
            transition-colors duration-200 border chamfer-sm
            ${
              isDark
                ? 'bg-[#0d0f12] text-[#D4FF00] border-[#D4FF00]/50 shadow-[0_0_20px_rgba(212,255,0,0.35)] hover:border-[#D4FF00]'
                : 'bg-white text-[#111315] border-2 border-[#111315] shadow-[0_4px_16px_rgba(0,0,0,0.18)] hover:border-[#FF2A4B]'
            }
          `}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          title="Pull cord down or click to switch mode"
        >
          {/* Mechanical Pulse / Ripple ring */}
          {rippleActive && (
            <span
              className={`absolute inset-0 rounded-full border-2 ${
                isDark ? 'border-[#D4FF00]' : 'border-[#FF2A4B]'
              } animate-ping pointer-events-none`}
            />
          )}

          <div
            className={`w-1.5 h-1.5 rounded-full mb-1.5 ${
              isDark ? 'bg-[#D4FF00] animate-pulse' : 'bg-[#FF2A4B]'
            }`}
          />

          {isDark ? (
            <Sun className="w-4 h-4 text-[#D4FF00] transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-[#111315] transition-transform duration-300 hover:-rotate-12" />
          )}

          {/* Live Dragging Distance Indicator */}
          {isPulling && (
            <div className="absolute -left-24 top-2 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap bg-black text-[#D4FF00] border border-[#D4FF00]/40 pointer-events-none shadow-xl">
              {dragY.get() >= 55 ? 'SWITCHING!' : 'PULL TO FLIP'}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RopeThemeToggle;
