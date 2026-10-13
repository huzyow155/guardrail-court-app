import React, { useEffect, useRef, useState } from 'react';
import {
  computeWordMaskDelays,
  scrambleStep,
  computeElapsedSeconds,
} from '../lib/textAnimation';
import { triggerDotFieldRipple, type RippleVerdict } from '../lib/dotfield';

export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  emitRipple?: boolean;
  rippleVerdict?: RippleVerdict;
}

/**
 * IntersectionObserver hook that reveals an element once it enters the viewport.
 * Respects prefers-reduced-motion (reveals immediately without transition) and falls back cleanly in jsdom.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(options: UseRevealOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -8% 0px', emitRipple = false, rippleVerdict = 'NEUTRAL' } = options;
  const ref = useRef<T | null>(null);
  const reducedMotion = getPrefersReducedMotion();
  const [revealed, setRevealed] = useState<boolean>(() => {
    if (reducedMotion) return true;
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return true;
    return false;
  });

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            if (emitRipple) {
              triggerDotFieldRipple({ element: el, verdict: rippleVerdict });
            }
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, emitRipple, rippleVerdict, reducedMotion]);

  return { ref, revealed, reducedMotion };
}

/**
 * H1 Word-Mask Heading Component (40-60ms stagger per word, zero CLS)
 */
export const WordMaskHeading: React.FC<{
  text: string;
  stepMs?: number;
  style?: React.CSSProperties;
}> = ({ text, stepMs = 48, style }) => {
  const { ref, revealed, reducedMotion } = useReveal<HTMLHeadingElement>({ threshold: 0.1 });
  const items = computeWordMaskDelays(text, stepMs, reducedMotion);

  const children: React.ReactNode[] = [];
  items.forEach((item, idx) => {
    children.push(
      React.createElement(
        'span',
        { key: `w-${item.index}`, className: 'word-mask' },
        React.createElement(
          'span',
          {
            className: `word-mask-inner ${revealed ? '' : 'is-hidden'}`.trim(),
            style: { transitionDelay: `${item.delayMs}ms` },
          },
          item.word
        )
      )
    );
    if (idx < items.length - 1) {
      children.push(' ');
    }
  });

  return React.createElement('h1', { ref, style }, ...children);
};

/**
 * Section Heading with Animated Underline Draw on Scroll Reveal
 */
export const SectionHeading: React.FC<{
  text: string;
  as?: 'h1' | 'h2';
  rippleVerdict?: RippleVerdict;
  style?: React.CSSProperties;
}> = ({ text, as = 'h2', rippleVerdict = 'NEUTRAL', style }) => {
  const { ref, revealed } = useReveal<HTMLDivElement>({
    threshold: 0.2,
    emitRipple: true,
    rippleVerdict,
  });

  return React.createElement(
    'div',
    { ref, className: 'section-heading-wrap', style },
    React.createElement(as, { style: as === 'h1' ? { fontSize: '1.85rem' } : undefined }, text),
    React.createElement('span', {
      className: `section-heading-underline ${revealed ? '' : 'is-hidden'}`.trim(),
      'aria-hidden': 'true',
    })
  );
};

/**
 * Scramble Text for Addresses, Hashes, and Numeric Metrics (Zero CLS)
 */
export const ScrambleText: React.FC<{
  value: string;
  durationMs?: number;
  className?: string;
}> = ({ value, durationMs = 520, className = 'font-mono' }) => {
  const { ref, revealed, reducedMotion } = useReveal<HTMLSpanElement>({ threshold: 0.1 });
  const [display, setDisplay] = useState<string>(value);

  useEffect(() => {
    if (reducedMotion || !revealed) {
      setDisplay(value);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setDisplay(scrambleStep(value, progress, 61999, reducedMotion));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value, durationMs, revealed, reducedMotion]);

  return React.createElement(
    'span',
    { ref, className, 'aria-label': value },
    display
  );
};

/**
 * Real Elapsed Seconds Counter for Pending Transactions
 */
export const RealTxTimer: React.FC<{ active: boolean }> = ({ active }) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  useEffect(() => {
    if (!active) {
      setElapsedSec(0);
      return;
    }
    const startMs = performance.now();
    const id = window.setInterval(() => {
      setElapsedSec(computeElapsedSeconds(startMs, performance.now()));
    }, 100);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;
  return React.createElement('span', { className: 'font-mono' }, `(${elapsedSec.toFixed(1)}s)`);
};
