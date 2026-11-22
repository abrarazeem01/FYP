import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '../services/soundEngine';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'stealth';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  type = 'button',
  title,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    // Magnetic pull distance
    const pullX = (clientX - centerX) * 0.28;
    const pullY = (clientY - centerY) * 0.28;
    setPosition({ x: pullX, y: pullY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundEngine.playTactileClick();
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    soundEngine.playTactileClick();
    if (onClick) onClick();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#D4FF00] text-black border-[#D4FF00] font-bold shadow-[0_0_20px_rgba(212,255,0,0.35)] hover:shadow-[0_0_30px_rgba(212,255,0,0.55)]';
      case 'secondary':
        return 'bg-[#0d0f12] text-[#F4F6F8] border-white/10 hover:border-[#D4FF00]/60 hover:text-[#D4FF00]';
      case 'stealth':
      default:
        return 'bg-transparent text-[#8A94A6] border-transparent hover:text-[#F4F6F8] hover:bg-white/5';
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      title={title}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => { setPosition({ x: 0, y: 0 }); setIsHovered(false); }}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 20, mass: 0.5 }}
      className={`relative overflow-hidden font-sans font-semibold tracking-wide text-xs px-4 py-2 transition-colors duration-200 border chamfer-sm select-none ${getVariantStyles()} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {/* Glassmorphic Shimmer Light Sweep on Hover */}
      <span
        className={`absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] transition-all duration-700 pointer-events-none ${
          isHovered ? 'translate-x-[260%] opacity-100' : '-translate-x-full opacity-0'
        }`}
      />

      {/* Liquid fill wipe effect on hover */}
      <span
        className={`absolute inset-0 bg-gradient-to-r from-[#D4FF00] to-[#FF2A4B] transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          variant === 'secondary'
            ? isHovered
              ? 'opacity-15 translate-y-0'
              : 'opacity-0 translate-y-full'
            : variant === 'primary'
            ? isHovered
              ? 'opacity-20 scale-105'
              : 'opacity-0 scale-95'
            : 'hidden'
        }`}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

export default MagneticButton;
