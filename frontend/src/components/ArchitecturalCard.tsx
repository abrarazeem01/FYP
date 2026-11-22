import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { soundEngine } from '../services/soundEngine';

interface ArchitecturalCardProps {
  children: React.ReactNode;
  className?: string;
  chamfer?: 'sm' | 'md' | 'tr-bl' | 'none';
  active?: boolean;
  hoverGlow?: boolean;
  tiltEnabled?: boolean;
  headerTag?: string;
  headerAction?: React.ReactNode;
  onClick?: () => void;
}

export const ArchitecturalCard: React.FC<ArchitecturalCardProps> = ({
  children,
  className = '',
  chamfer = 'md',
  active = false,
  hoverGlow = true,
  tiltEnabled = true,
  headerTag,
  headerAction,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D Parallax Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 400, damping: 25, mass: 0.5 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMousePos({ x: mouseX, y: mouseY });

    if (tiltEnabled) {
      const xPct = mouseX / rect.width - 0.5;
      const yPct = mouseY / rect.height - 0.5;
      x.set(xPct);
      y.set(yPct);
    }
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

  const getChamferClass = () => {
    switch (chamfer) {
      case 'sm':
        return 'chamfer-sm';
      case 'md':
        return 'chamfer-md';
      case 'tr-bl':
        return 'chamfer-tr-bl';
      default:
        return '';
    }
  };

  return (
    <div style={{ perspective: 1000 }} className="relative h-full">
      <motion.div
        ref={cardRef}
        onClick={(e) => {
          if (onClick) {
            soundEngine.playTactileClick();
            onClick();
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: tiltEnabled ? rotateX : 0,
          rotateY: tiltEnabled ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        className={`relative bg-[#0d0f12]/95 backdrop-blur-md border transition-colors duration-200 overflow-hidden ${
          active
            ? 'border-[#D4FF00]/50 shadow-[0_0_25px_rgba(212,255,0,0.18)] bracket-box'
            : 'border-white/[0.08] hover:border-white/20'
        } ${
          hoverGlow ? 'hover:shadow-[0_16px_40px_rgba(0,0,0,0.85)]' : ''
        } ${getChamferClass()} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {/* Spotlight Radial Cursor Illumination Border */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-200"
            style={{
              background: `radial-gradient(320px circle at ${mousePos.x}px ${mousePos.y}px, rgba(212, 255, 0, 0.22), transparent 70%)`,
            }}
          />
        )}

        {/* Dynamic Holographic Foil & Iridescent Sheen */}
        {isHovered && (
          <div
            className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 mix-blend-screen"
            style={{
              background: `linear-gradient(${120 + (mousePos.x / 300) * 40}deg, transparent 20%, rgba(212, 255, 0, 0.05) 40%, rgba(0, 240, 255, 0.08) 55%, rgba(255, 42, 75, 0.05) 70%, transparent 85%)`,
            }}
          />
        )}

        {/* Corner Bracket Accent Ticks */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#D4FF00]/70 pointer-events-none z-10" />
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#D4FF00]/70 pointer-events-none z-10" />

        {/* Header Tag Bar if provided */}
        {headerTag && (
          <div className="px-4 py-2 border-b border-white/[0.08] flex items-center justify-between bg-black/35 relative z-10">
            <span className="font-mono text-[9px] text-[#D4FF00] uppercase tracking-wider font-bold">
              // {headerTag}
            </span>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}

        {/* Main Content with translateZ depth */}
        <div
          className="p-4 sm:p-5 relative z-10"
          style={{ transform: tiltEnabled && isHovered ? 'translateZ(12px)' : 'none' }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default ArchitecturalCard;
