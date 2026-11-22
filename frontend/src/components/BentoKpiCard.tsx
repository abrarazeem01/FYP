import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { NumberFlow } from './NumberFlow';
import { useTheme } from '../context/ThemeContext';

interface BentoKpiCardProps {
  coord: string; // e.g. "[01 // TELEMETRY]"
  title: string;
  value: number | string;
  subValue?: string;
  icon?: React.ReactNode;
  badge?: string;
  accent?: 'vermilion' | 'cyan' | 'amber' | 'slate';
  className?: string;
}

export const BentoKpiCard: React.FC<BentoKpiCardProps> = ({
  coord,
  title,
  value,
  subValue,
  icon,
  badge,
  accent = 'slate',
  className = '',
}) => {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Perspective Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 350, damping: 24, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMousePos({ x: mouseX, y: mouseY });

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
    setMousePos({ x: -200, y: -200 });
  };

  const getAccentColors = () => {
    switch (accent) {
      case 'vermilion':
        return {
          spotlight: 'rgba(255, 77, 28, 0.22)',
          text: 'text-[#FF4D1C]',
          border: theme === 'dark' ? 'border-[#FF4D1C]/40' : 'border-[#0F172A]',
          bg: theme === 'dark' ? 'bg-[#FF4D1C]/10' : 'bg-[#FF4D1C]/15',
          coordText: theme === 'dark' ? 'text-[#FF4D1C]' : 'text-[#B82A02]',
        };
      case 'cyan':
        return {
          spotlight: 'rgba(0, 229, 255, 0.22)',
          text: 'text-[#00E5FF]',
          border: theme === 'dark' ? 'border-[#00E5FF]/40' : 'border-[#0F172A]',
          bg: theme === 'dark' ? 'bg-[#00E5FF]/10' : 'bg-[#00E5FF]/15',
          coordText: theme === 'dark' ? 'text-[#00E5FF]' : 'text-[#00829B]',
        };
      case 'amber':
        return {
          spotlight: 'rgba(245, 158, 11, 0.22)',
          text: 'text-[#F59E0B]',
          border: theme === 'dark' ? 'border-[#F59E0B]/40' : 'border-[#0F172A]',
          bg: theme === 'dark' ? 'bg-[#F59E0B]/10' : 'bg-[#F59E0B]/15',
          coordText: theme === 'dark' ? 'text-[#F59E0B]' : 'text-[#B45309]',
        };
      default:
        return {
          spotlight: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
          text: theme === 'dark' ? 'text-[#F8FAFC]' : 'text-[#090D16]',
          border: theme === 'dark' ? 'border-white/10' : 'border-[#0F172A]',
          bg: theme === 'dark' ? 'bg-white/5' : 'bg-slate-100',
          coordText: theme === 'dark' ? 'text-zinc-500' : 'text-slate-500',
        };
    }
  };

  const accentStyles = getAccentColors();

  return (
    <div style={{ perspective: 1200 }} className="relative h-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.015, y: -5 }}
        className={`
          relative rounded-2xl p-5 overflow-hidden transition-all duration-200 h-full flex flex-col justify-between
          ${
            theme === 'dark'
              ? 'bg-[#0E1117] border border-white/10 shadow-[0_10px_35px_0_rgba(0,0,0,0.5)]'
              : 'bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]'
          }
          ${className}
        `}
      >
        {/* Mouse-Tracking Radial Spotlight Border & Specular Glare */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${accentStyles.spotlight}, transparent 75%)`,
            }}
          />
        )}

        {/* Top Specular Hairline in Dark Mode */}
        {theme === 'dark' && (
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
        )}

        {/* Top Header with translateZ Floating Depth */}
        <div
          className="flex items-center justify-between mb-3 relative z-10 transition-transform duration-200"
          style={{ transform: `translateZ(${isHovered ? '24px' : '0px'})` }}
        >
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase">
            <span className="text-zinc-500">+</span>
            <span className={`font-semibold ${accentStyles.coordText}`}>{coord}</span>
          </div>
          {icon && (
            <div
              className={`p-1.5 rounded-lg border shadow-sm ${accentStyles.border} ${accentStyles.bg}`}
              style={{ transform: 'translateZ(10px)' }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Metric Title & Floating Number Counter with translateZ(28px) */}
        <div
          className="relative z-10 my-1 transition-transform duration-200"
          style={{ transform: `translateZ(${isHovered ? '28px' : '0px'})` }}
        >
          <div className="text-[11px] font-mono uppercase tracking-wider text-contrast-secondary mb-1">
            {title}
          </div>
          <div className="flex items-baseline gap-2">
            {typeof value === 'number' ? (
              <NumberFlow
                value={value}
                className={`text-3xl sm:text-4xl font-display font-black tracking-tight ${accentStyles.text}`}
              />
            ) : (
              <span className={`text-2xl sm:text-3xl font-display font-black tracking-tight ${accentStyles.text}`}>
                {value}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Sub-label / Delta indicator with translateZ(16px) */}
        {(subValue || badge) && (
          <div
            className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-zinc-500/20 text-[10px] font-mono relative z-10 transition-transform duration-200"
            style={{ transform: `translateZ(${isHovered ? '16px' : '0px'})` }}
          >
            <span className="text-contrast-muted">{subValue}</span>
            {badge && (
              <span
                className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] border ${accentStyles.border} ${accentStyles.bg} ${accentStyles.text}`}
              >
                {badge}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
