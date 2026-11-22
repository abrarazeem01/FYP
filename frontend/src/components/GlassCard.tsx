import React, { useRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  tilt?: boolean;
  spotlight?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = false,
  tilt = false,
  spotlight = false,
  ...props
}) => {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={tilt ? { y: -4, scale: 1.008 } : undefined}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={`
        relative rounded-xl overflow-hidden
        transition-colors duration-200
        ${
          theme === 'dark'
            ? `bg-[#0E1117] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ${
                glow ? 'shadow-[0_0_30px_rgba(255,77,28,0.25)] border-[#FF4D1C]/40' : ''
              }`
            : `bg-white border-[1.5px] border-[#0F172A] shadow-[4px_4px_0px_#0F172A] ${
                glow ? 'border-[#FF4D1C] shadow-[4px_4px_0px_#FF4D1C]' : ''
              }`
        }
        ${className}
      `}
      {...props}
    >
      {/* Interactive spotlight glow on hover */}
      {spotlight && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, ${
              theme === 'dark' ? 'rgba(255, 77, 28, 0.12)' : 'rgba(15, 23, 42, 0.06)'
            }, transparent 80%)`,
          }}
        />
      )}

      {/* Specular hairline at top border in dark mode */}
      {theme === 'dark' && (
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      )}

      {children}
    </motion.div>
  );
};
