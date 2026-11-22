import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface Card3DProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  maxTilt?: number; // max tilt in degrees (default 6deg)
  enableGlare?: boolean;
  depthZ?: number; // translateZ for inner floating elements
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  glow = false,
  maxTilt = 6,
  enableGlare = true,
  depthZ = 20,
  ...props
}) => {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 350, damping: 25, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [`${maxTilt}deg`, `-${maxTilt}deg`]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [`-${maxTilt}deg`, `${maxTilt}deg`]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlarePos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="relative"
    >
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
        whileHover={{ scale: 1.012, y: -5 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`
          relative rounded-2xl overflow-hidden transition-colors duration-200
          ${
            theme === 'dark'
              ? `bg-[#0E1117] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] ${
                  glow ? 'shadow-[0_0_35px_rgba(255,77,28,0.3)] border-[#FF4D1C]/40' : ''
                }`
              : `bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] ${
                  glow ? 'border-[#FF4D1C] shadow-[4px_4px_0px_#FF4D1C]' : ''
                }`
          }
          ${className}
        `}
        {...props}
      >
        {/* Dynamic Specular Glare Sheen that tracks 3D light reflection */}
        {enableGlare && isHovered && (
          <div
            className="pointer-events-none absolute -inset-full transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, ${
                theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)'
              }, transparent 80%)`,
            }}
          />
        )}

        {/* Top Hairline specular line */}
        {theme === 'dark' && (
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        )}

        {/* Content with 3D spatial depth */}
        <div style={{ transform: `translateZ(${isHovered ? depthZ : 0}px)`, transformStyle: 'preserve-3d', transition: 'transform 0.25s ease-out' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};
