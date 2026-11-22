import React from 'react';
import { motion } from 'framer-motion';
import { LiveEqualizerBar } from './LiveEqualizerBar';

interface SectionHeadingProps {
  tag?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  showEqualizer?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  tag,
  title,
  subtitle,
  action,
  className = '',
  showEqualizer = true,
}) => {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 pb-3 border-b border-white/10 ${className}`}>
      <div className="space-y-1">
        {tag && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#D4FF00] uppercase tracking-wider font-bold">
              // {tag}
            </span>
            {showEqualizer && <LiveEqualizerBar color="#D4FF00" />}
          </div>
        )}

        {/* Staggered masked overflow text reveal */}
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl sm:text-3xl font-bold tracking-[0.02em] text-[#F4F6F8] uppercase"
          >
            {title}
          </motion.h2>
        </div>

        {subtitle && (
          <p className="font-sans text-xs text-[#8A94A6] max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeading;
