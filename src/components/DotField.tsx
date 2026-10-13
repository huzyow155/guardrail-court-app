import React, { useEffect, useRef } from 'react';
import {
  computeDotFieldFrame,
  shouldStepDownDensity,
  DEFAULT_MAX_DOTS,
  DEFAULT_PARALLAX_FACTOR,
  type DotRipple,
  type RippleVerdict,
} from '../lib/dotfield';

interface DotFieldProps {
  className?: string;
  seed?: number;
  baseGap?: number;
  maxDots?: number;
}

const VERDICT_RGB: Record<RippleVerdict, string> = {
  NEUTRAL: '104, 151, 255',  // --dot soft luminous cyan/blue on black
  ALLOW:   '52, 211, 153',   // --allow (#34D399 emerald)
  ESCALATE:'251, 191, 36',   // --escalate (#FBBF24 amber)
  DENY:    '248, 113, 113',  // --deny (#F87171 rose)
};

export const DotField: React.FC<DotFieldProps> = ({
  className = '',
  seed = 61999,
  baseGap = 22,
  maxDots = DEFAULT_MAX_DOTS,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth || 1280;
    let height = window.innerHeight || 800;
    let currentGap = baseGap;
    let currentMaxDots = maxDots;
    let scrollY = window.scrollY || 0;
    let isTabHidden = typeof document !== 'undefined' ? document.hidden : false;
    let lastPointerRippleMs = 0;

    const ripples: DotRipple[] = [];
    const frameDurations: number[] = [];

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const updateCanvasSize = () => {
      width = window.innerWidth || 1280;
      height = window.innerHeight || 800;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prefersReducedMotion) {
        renderFrame(0);
      }
    };

    const renderFrame = (timeMs: number) => {
      if (!ctx) return;
      const frameStart = performance.now();

      ctx.clearRect(0, 0, width, height);

      // Prune expired ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const dur = ripples[i].durationMs ?? 1200;
        if (timeMs - ripples[i].startTimeMs > dur) {
          ripples.splice(i, 1);
        }
      }

      const dots = computeDotFieldFrame({
        seed,
        width,
        height,
        timeMs,
        scrollY,
        parallaxFactor: DEFAULT_PARALLAX_FACTOR,
        baseGap: currentGap,
        maxDots: currentMaxDots,
        baseRadius: 1.75,
        ripples,
        reducedMotion: prefersReducedMotion,
      });

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const rgb = VERDICT_RGB[d.verdict] || VERDICT_RGB.NEUTRAL;
        const effectiveAlpha = d.verdict === 'NEUTRAL' ? d.alpha : Math.min(0.46, d.alpha);
        ctx.fillStyle = `rgba(${rgb}, ${effectiveAlpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const frameElapsed = performance.now() - frameStart;
      frameDurations.push(frameElapsed);
      if (frameDurations.length > 6) {
        frameDurations.shift();
      }
      if (shouldStepDownDensity(frameDurations, 20, 3) && currentGap < 44) {
        currentGap += 4;
        currentMaxDots = Math.max(400, Math.floor(currentMaxDots * 0.8));
        frameDurations.length = 0;
      }
    };

    const loop = (now: number) => {
      if (!prefersReducedMotion && !isTabHidden) {
        renderFrame(now);
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    const handleScroll = () => {
      scrollY = window.scrollY || 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const now = performance.now();
      if (now - lastPointerRippleMs < 140) return;
      lastPointerRippleMs = now;
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        startTimeMs: now,
        durationMs: 950,
        maxRadius: 240,
        verdict: 'NEUTRAL',
      });
      if (ripples.length > 10) ripples.shift();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      const now = performance.now();
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        startTimeMs: now,
        durationMs: 1250,
        maxRadius: Math.hypot(width, height) * 0.55,
        verdict: 'NEUTRAL',
      });
      if (ripples.length > 10) ripples.shift();
    };

    const handleCustomRipple = (ev: Event) => {
      if (prefersReducedMotion) return;
      const custom = ev as CustomEvent<{
        x?: number;
        y?: number;
        verdict?: RippleVerdict;
        maxRadius?: number;
        durationMs?: number;
      }>;
      const now = performance.now();
      ripples.push({
        x: custom.detail?.x ?? width / 2,
        y: custom.detail?.y ?? height / 2,
        startTimeMs: now,
        durationMs: custom.detail?.durationMs ?? 1400,
        maxRadius: custom.detail?.maxRadius ?? Math.hypot(width, height) * 0.85,
        verdict: custom.detail?.verdict ?? 'NEUTRAL',
      });
      if (ripples.length > 10) ripples.shift();
    };

    const handleVisibilityChange = () => {
      isTabHidden = document.hidden;
      if (isTabHidden) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      } else if (!prefersReducedMotion && !animationFrameId) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    const handleMotionChange = (ev: MediaQueryListEvent) => {
      prefersReducedMotion = ev.matches;
      if (prefersReducedMotion) {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
        renderFrame(0);
      } else if (!isTabHidden && !animationFrameId) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('guardrail:ripple', handleCustomRipple);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    mediaQuery.addEventListener?.('change', handleMotionChange);

    if (prefersReducedMotion) {
      renderFrame(0);
    } else if (!isTabHidden) {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('guardrail:ripple', handleCustomRipple);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener?.('change', handleMotionChange);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [seed, baseGap, maxDots]);

  return (
    <canvas
      ref={canvasRef}
      className={`global-dotfield-canvas dot-field-canvas ${className}`.trim()}
      aria-hidden="true"
    />
  );
};
