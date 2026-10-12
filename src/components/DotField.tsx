import React, { useEffect, useRef } from 'react';

/**
 * 4x4 Bayer Matrix for ordered dithering
 */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

interface DotFieldProps {
  className?: string;
  dotColor?: string;
  dotSize?: number;
  gap?: number;
}

export const DotField: React.FC<DotFieldProps> = ({
  className = '',
  dotColor = '#001FEB',
  dotSize = 2,
  gap = 14
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || 400;
      canvas.width = width;
      canvas.height = height;
      if (prefersReducedMotion) {
        draw(0);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    function draw(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = dotColor;

      const cols = Math.floor(width / gap);
      const rows = Math.floor(height / gap);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap + gap / 2;
          const y = r * gap + gap / 2;

          // Procedural wave / terrain height function
          const wave1 = Math.sin(c * 0.12 + t * 0.001);
          const wave2 = Math.cos(r * 0.14 + t * 0.0015);
          const heightVal = ((wave1 + wave2 + 2) / 4) * 16; // 0 to 16

          // Compare against Bayer matrix threshold
          const threshold = BAYER_4X4[r % 4][c % 4];

          if (heightVal > threshold) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    const animate = (currentTime: number) => {
      time = currentTime;
      draw(time);
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      draw(0);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [dotColor, dotSize, gap]);

  return (
    <canvas
      ref={canvasRef}
      className={`dot-field-canvas ${className}`}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
};
