import React, { useEffect, useState } from 'react';

interface OdometerProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export const Odometer: React.FC<OdometerProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const isFloat = String(value).includes('.');
  const decimals = isFloat ? String(value).split('.')[1]?.length || 2 : 0;

  const [displayValue, setDisplayValue] = useState<number>(numericValue);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(numericValue);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (numericValue - start) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(numericValue);
      }
    };

    requestAnimationFrame(step);
  }, [numericValue, duration]);

  return (
    <span className="odometer-digit font-mono" aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};
