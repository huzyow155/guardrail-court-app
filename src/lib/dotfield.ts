/**
 * Pure deterministic full-viewport DotField engine
 * - Seeded 2D noise + 4x4 Bayer ordered dithering
 * - Hard density cap (never exceeds maxDots)
 * - Radial expanding ripples (cursor/touch + section/tx events with verdict color)
 * - Scroll parallax (factor 0.22, within 0.15-0.30)
 * - Alpha bounded to [0.10, 0.55] with elevated baseline visibility for architectural dot grid
 */

export const BAYER_4X4: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export type RippleVerdict = 'ALLOW' | 'ESCALATE' | 'DENY' | 'NEUTRAL';

export interface DotRipple {
  x: number;
  y: number;
  startTimeMs: number;
  durationMs?: number;
  maxRadius?: number;
  verdict?: RippleVerdict;
}

export interface DotPoint {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  verdict: RippleVerdict;
}

export interface DotFieldParams {
  seed: number;
  width: number;
  height: number;
  timeMs: number;
  scrollY?: number;
  parallaxFactor?: number;
  baseGap?: number;
  maxDots?: number;
  baseRadius?: number;
  ripples?: DotRipple[];
  reducedMotion?: boolean;
}

export const DEFAULT_MAX_DOTS = 1600;
export const DEFAULT_PARALLAX_FACTOR = 0.22; // strictly in 0.15..0.30

/**
 * Deterministic 32-bit integer hash from (col, row, seed) -> [0, 1)
 */
export function seededHash2D(col: number, row: number, seed: number): number {
  let h = (seed | 0) + Math.imul(col | 0, 374761393) + Math.imul(row | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/**
 * Smooth deterministic 2D value noise in [0, 1]
 */
export function seededNoise2D(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;

  // Smoothstep
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  const n00 = seededHash2D(x0, y0, seed);
  const n10 = seededHash2D(x0 + 1, y0, seed);
  const n01 = seededHash2D(x0, y0 + 1, seed);
  const n11 = seededHash2D(x0 + 1, y0 + 1, seed);

  const nx0 = n00 + u * (n10 - n00);
  const nx1 = n01 + u * (n11 - n01);
  return nx0 + v * (nx1 - nx0);
}

/**
 * Computes effective grid gap so total candidate cells never exceed maxDots
 */
export function computeEffectiveGap(
  width: number,
  height: number,
  baseGap: number = 22,
  maxDots: number = DEFAULT_MAX_DOTS
): number {
  if (width <= 0 || height <= 0) return baseGap;
  const safeBase = Math.max(12, baseGap);
  const currentCells = Math.ceil(width / safeBase) * Math.ceil(height / safeBase);
  if (currentCells <= maxDots) {
    return safeBase;
  }
  const minAreaPerDot = (width * height) / maxDots;
  return Math.ceil(Math.sqrt(minAreaPerDot));
}

/**
 * Pure helper to determine if consecutive slow frames (>20ms) require stepping down density
 */
export function shouldStepDownDensity(recentFrameDurationsMs: number[], thresholdMs = 20, consecutive = 3): boolean {
  if (recentFrameDurationsMs.length < consecutive) return false;
  const tail = recentFrameDurationsMs.slice(-consecutive);
  return tail.every((d) => d > thresholdMs);
}

/**
 * Computes deterministic dot list for given viewport, seed, time, scroll, and ripples.
 * Same (seed, width, height, timeMs) guarantees identical output array.
 */
export function computeDotFieldFrame(params: DotFieldParams): DotPoint[] {
  const {
    seed,
    width,
    height,
    timeMs,
    scrollY = 0,
    parallaxFactor = DEFAULT_PARALLAX_FACTOR,
    baseGap = 22,
    maxDots = DEFAULT_MAX_DOTS,
    baseRadius = 1.9,
    ripples = [],
    reducedMotion = false,
  } = params;

  if (width <= 0 || height <= 0) return [];

  const effectiveTime = reducedMotion ? 0 : timeMs;
  const clampedParallax = Math.max(0.15, Math.min(0.3, parallaxFactor));
  const parallaxOffsetY = reducedMotion ? 0 : scrollY * clampedParallax;

  const gap = computeEffectiveGap(width, height, baseGap, maxDots);
  const cols = Math.floor(width / gap);
  const rows = Math.floor(height / gap);

  const dots: DotPoint[] = [];
  const activeRipples = reducedMotion
    ? []
    : ripples.filter((r) => {
        const dur = r.durationMs ?? 1200;
        const elapsed = effectiveTime - r.startTimeMs;
        return elapsed >= 0 && elapsed <= dur;
      });

  const virtualRowShift = Math.floor(parallaxOffsetY / gap);
  const subRowOffset = ((parallaxOffsetY % gap) + gap) % gap;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dots.length >= maxDots) break;

      const worldRow = r + virtualRowShift;
      const x = c * gap + gap * 0.5;
      const y = ((r * gap + gap * 0.5 - subRowOffset + height) % height);

      const noiseVal = seededNoise2D(
        c * 0.14 + effectiveTime * 0.00014,
        worldRow * 0.14 + effectiveTime * 0.00011,
        seed
      );
      const waveVal =
        (Math.sin(c * 0.16 + effectiveTime * 0.0007 + seed * 0.1) +
          Math.cos(worldRow * 0.15 - effectiveTime * 0.0006)) *
        0.25 +
        0.5;

      // Elevated architectural field intensity so the dot matrix covers the entire screen
      let fieldIntensity = 4.8 + (noiseVal * 0.6 + waveVal * 0.4) * 12.0;
      let dotVerdict: RippleVerdict = 'NEUTRAL';
      let rippleBoost = 0;

      // Apply expanding circular ripples
      for (let i = 0; i < activeRipples.length; i++) {
        const rp = activeRipples[i];
        const dur = rp.durationMs ?? 1200;
        const maxRad = rp.maxRadius ?? Math.hypot(width, height) * 0.65;
        const progress = (effectiveTime - rp.startTimeMs) / dur;
        const currentRad = progress * maxRad;
        const bandWidth = Math.max(48, gap * 3.2);
        const dist = Math.hypot(x - rp.x, y - rp.y);
        const delta = Math.abs(dist - currentRad);

        if (delta < bandWidth) {
          const ringStrength = (1 - delta / bandWidth) * (1 - progress);
          if (ringStrength > rippleBoost) {
            rippleBoost = ringStrength;
            if (rp.verdict && rp.verdict !== 'NEUTRAL') {
              dotVerdict = rp.verdict;
            }
          }
        }
      }

      fieldIntensity += rippleBoost * 6.5;

      const bayerRow = ((worldRow % 4) + 4) % 4;
      const bayerCol = ((c % 4) + 4) % 4;
      const threshold = BAYER_4X4[bayerRow][bayerCol];

      if (fieldIntensity > threshold) {
        const normalized = Math.min(1, Math.max(0, (fieldIntensity - threshold) / 14));
        // Bounded alpha [0.10, 0.55] with elevated baseline (0.24..0.55) for crisp visibility
        const rawAlpha = 0.24 + normalized * 0.28 + rippleBoost * 0.15;
        const alpha = Number(Math.min(0.55, Math.max(0.10, rawAlpha)).toFixed(3));
        const radius = Number((baseRadius * (0.95 + normalized * 0.3 + rippleBoost * 0.35)).toFixed(2));

        dots.push({
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          radius,
          alpha,
          verdict: dotVerdict,
        });
      }
    }
  }

  return dots;
}

/**
 * Helper to dispatch a full-screen ripple wave from any DOM element or coordinate
 */
export function triggerDotFieldRipple(options: {
  x?: number;
  y?: number;
  element?: HTMLElement | null;
  verdict?: RippleVerdict;
  maxRadius?: number;
  durationMs?: number;
}): void {
  if (typeof window === 'undefined') return;
  let x = options.x ?? window.innerWidth / 2;
  let y = options.y ?? window.innerHeight / 2;

  if (options.element) {
    const rect = options.element.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  window.dispatchEvent(
    new CustomEvent('guardrail:ripple', {
      detail: {
        x,
        y,
        verdict: options.verdict ?? 'NEUTRAL',
        maxRadius: options.maxRadius,
        durationMs: options.durationMs ?? 1350,
      },
    })
  );
}
