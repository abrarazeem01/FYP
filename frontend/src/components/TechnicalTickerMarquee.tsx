import React from 'react';
import { motion } from 'framer-motion';

interface TechnicalTickerMarqueeProps {
  className?: string;
  items?: string[];
}

export const TechnicalTickerMarquee: React.FC<TechnicalTickerMarqueeProps> = ({
  className = '',
  items = [
    'NEXUS SENTINEL // v2.4 KINETIC CORE',
    '18,985 PAKWHEELS TRANSACTIONS REGRESSED',
    'LIGHTGBM MODEL R² 0.9382 VALIDATED',
    'ROMAN URDU CONTRABAND DIALECT NLP: 100% RECALL',
    'CHAMAN // TORKHAM BORDER TRANSIT RADAR ACTIVE',
    'REAL-TIME SHA-256 PII ENCRYPTED SESSIONS',
    'VERLET SPRING ROPE & FLUID TRAIL 60 FPS',
  ],
}) => {
  // Duplicate for seamless infinite loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#060708] border-y border-white/[0.08] py-1.5 select-none ${className}`}
    >
      {/* Edge Blur Vignette Masks */}
      <div className="absolute left-0 inset-y-0 w-12 bg-gradient-to-r from-[#060708] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-12 bg-gradient-to-l from-[#060708] to-transparent z-10 pointer-events-none" />

      {/* Animated Sliding Marquee Track */}
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 28,
        }}
        className="flex items-center gap-8 whitespace-nowrap will-change-transform"
      >
        {displayItems.map((text, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 font-mono text-[10px] tracking-widest uppercase"
          >
            <span className="text-[#D4FF00] font-bold">| +</span>
            <span className="text-[#8A94A6] hover:text-[#F4F6F8] transition-colors">
              {text}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default TechnicalTickerMarquee;
