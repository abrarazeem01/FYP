import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronRight, RefreshCw, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LiquidSurgeButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  loadingLabel?: string;
  className?: string;
}

export const LiquidSurgeButton: React.FC<LiquidSurgeButtonProps> = ({
  onClick,
  type = 'button',
  disabled = false,
  isLoading = false,
  label = 'EXECUTE SCRAPE >',
  loadingLabel = 'RUNNING SCRAPER TELEMETRY...',
  className = '',
}) => {
  const { theme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Subtle magnetic cursor attraction applied to inner content, not outer button hit-target
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 250, damping: 25 };
  const magneticX = useSpring(x, springConfig);
  const magneticY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled || isLoading) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const pullDistanceX = (e.clientX - centerX) * 0.12;
    const pullDistanceY = (e.clientY - centerY) * 0.12;

    x.set(pullDistanceX);
    y.set(pullDistanceY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div className="relative inline-block w-full">
      <button
        ref={buttonRef}
        type={type}
        onClick={handleClick}
        disabled={disabled || isLoading}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative w-full overflow-hidden rounded-xl py-3 px-6 font-mono font-bold text-xs uppercase
          transition-all duration-200 flex items-center justify-center gap-2 select-none cursor-pointer
          ${
            theme === 'dark'
              ? 'bg-[#FF4D1C] text-white shadow-[0_0_25px_rgba(255,77,28,0.45)] border border-[#FF4D1C]/60 hover:bg-[#E63908]'
              : 'bg-[#FF4D1C] text-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#0F172A]'
          }
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${className}
        `}
      >
        {/* Animated Liquid Wave / Surge Fill Layer (pointer-events-none) */}
        <div
          className={`
            absolute inset-0 pointer-events-none transition-transform duration-500 ease-out
            bg-gradient-to-r from-white/0 via-white/20 to-white/0
            ${isHovered && !isLoading ? 'translate-x-full' : '-translate-x-full'}
          `}
          style={{
            transform: isHovered && !isLoading ? 'translateX(100%)' : 'translateX(-100%)',
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Live Scraper Progress Telemetry Bar */}
        {isLoading && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40 overflow-hidden pointer-events-none">
            <motion.div
              className="h-full bg-white shadow-glow-vermilion"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: 'easeInOut',
              }}
              style={{ width: '60%' }}
            />
          </div>
        )}

        {/* Button Content with subtle magnetic displacement */}
        <motion.div
          style={{ x: magneticX, y: magneticY }}
          className="relative z-10 flex items-center justify-center gap-2 tracking-wider pointer-events-none"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>{loadingLabel}</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current text-white/90" />
              <span>{label}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </motion.div>
      </button>
    </div>
  );
};
