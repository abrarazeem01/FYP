import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface NumberFlowProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const NumberFlow: React.FC<NumberFlowProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1.2,
  className = '',
}) => {
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 18,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => Math.round(current));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on('change', (latest) => {
      setDisplayValue(latest);
    });
  }, [display]);

  return (
    <span className={`inline-flex items-baseline font-mono tracking-tight ${className}`}>
      {prefix && <span className="mr-0.5 opacity-80">{prefix}</span>}
      <motion.span
        key={value}
        initial={{ y: 8, opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {displayValue.toLocaleString()}
      </motion.span>
      {suffix && <span className="ml-0.5 opacity-80">{suffix}</span>}
    </span>
  );
};
