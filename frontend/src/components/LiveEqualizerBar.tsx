import React from 'react';

interface LiveEqualizerBarProps {
  className?: string;
  color?: string;
}

export const LiveEqualizerBar: React.FC<LiveEqualizerBarProps> = ({
  className = '',
  color = '#D4FF00',
}) => {
  return (
    <div className={`flex items-end gap-1 h-3.5 ${className}`}>
      <span
        className="w-[2px] bg-current eq-bar-1"
        style={{ color, height: '40%' }}
      />
      <span
        className="w-[2px] bg-current eq-bar-2"
        style={{ color, height: '75%' }}
      />
      <span
        className="w-[2px] bg-current eq-bar-3"
        style={{ color, height: '100%' }}
      />
      <span
        className="w-[2px] bg-current eq-bar-4"
        style={{ color, height: '60%' }}
      />
      <span
        className="w-[2px] bg-current eq-bar-5"
        style={{ color, height: '30%' }}
      />
    </div>
  );
};

export default LiveEqualizerBar;
