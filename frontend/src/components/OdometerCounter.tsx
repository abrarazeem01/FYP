import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface OdometerCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const OdometerCounter: React.FC<OdometerCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const spring = useSpring(0, {
    stiffness: 90,
    damping: 24,
    mass: 1,
  });

  const display = useTransform(spring, (current) => {
    return Math.floor(current).toLocaleString();
  });

  const [currentText, setCurrentText] = useState('0');

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      setCurrentText(latest);
    });
    return () => unsubscribe();
  }, [display]);

  return (
    <span className={`inline-flex items-baseline font-display-condensed font-bold tracking-tight ${className}`}>
      {prefix && <span className="mr-0.5 opacity-70 text-[0.8em]">{prefix}</span>}
      <span>{currentText}</span>
      {suffix && <span className="ml-0.5 opacity-80 text-[0.7em]">{suffix}</span>}
    </span>
  );
};

export default OdometerCounter;
