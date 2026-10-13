import { describe, it, expect } from 'vitest';
import {
  computeDotFieldFrame,
  computeEffectiveGap,
  shouldStepDownDensity,
  DEFAULT_MAX_DOTS,
} from '../lib/dotfield';

describe('DotField Pure Deterministic Engine', () => {
  it('returns identical dot list for identical (seed, width, height, timeMs)', () => {
    const frameA = computeDotFieldFrame({
      seed: 61999,
      width: 1440,
      height: 900,
      timeMs: 1250,
      scrollY: 200,
    });
    const frameB = computeDotFieldFrame({
      seed: 61999,
      width: 1440,
      height: 900,
      timeMs: 1250,
      scrollY: 200,
    });

    expect(frameA.length).toBeGreaterThan(50);
    expect(frameA).toEqual(frameB);
  });

  it('produces different patterns for different seeds', () => {
    const frame1 = computeDotFieldFrame({
      seed: 101,
      width: 800,
      height: 600,
      timeMs: 500,
    });
    const frame2 = computeDotFieldFrame({
      seed: 99999,
      width: 800,
      height: 600,
      timeMs: 500,
    });
    expect(frame1).not.toEqual(frame2);
  });

  it('never exceeds the maximum dot density cap even on 4K viewports', () => {
    const maxCap = 600;
    const gap = computeEffectiveGap(3840, 2160, 16, maxCap);
    expect(gap).toBeGreaterThan(16);

    const dots = computeDotFieldFrame({
      seed: 61999,
      width: 3840,
      height: 2160,
      timeMs: 1000,
      baseGap: 14,
      maxDots: maxCap,
    });

    expect(dots.length).toBeLessThanOrEqual(maxCap);
    expect(dots.length).toBeLessThanOrEqual(DEFAULT_MAX_DOTS);
    for (const d of dots) {
      expect(d.alpha).toBeGreaterThanOrEqual(0.1);
      expect(d.alpha).toBeLessThanOrEqual(0.55);
    }
  });

  it('applies verdict color tokens along expanding ripple rings and disables ripples in reducedMotion', () => {
    const withRipple = computeDotFieldFrame({
      seed: 61999,
      width: 600,
      height: 600,
      timeMs: 400,
      ripples: [
        {
          x: 300,
          y: 300,
          startTimeMs: 100,
          durationMs: 1000,
          maxRadius: 300,
          verdict: 'ALLOW',
        },
      ],
      reducedMotion: false,
    });
    expect(withRipple.some((d) => d.verdict === 'ALLOW')).toBe(true);

    const reduced = computeDotFieldFrame({
      seed: 61999,
      width: 600,
      height: 600,
      timeMs: 400,
      scrollY: 500,
      ripples: [
        {
          x: 300,
          y: 300,
          startTimeMs: 100,
          durationMs: 1000,
          maxRadius: 300,
          verdict: 'ALLOW',
        },
      ],
      reducedMotion: true,
    });
    expect(reduced.every((d) => d.verdict === 'NEUTRAL')).toBe(true);
  });

  it('triggers density step-down only after consecutive frames > 20ms', () => {
    expect(shouldStepDownDensity([12, 24, 15], 20, 3)).toBe(false);
    expect(shouldStepDownDensity([22, 25, 21], 20, 3)).toBe(true);
  });
});
