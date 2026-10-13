import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import {
  computeWordMaskDelays,
  scrambleStep,
  computeElapsedSeconds,
} from '../lib/textAnimation';
import { WordMaskHeading, SectionHeading, ScrambleText } from '../hooks/useReveal';

describe('Text Animation Pure Logic & Reveal Hook Components', () => {
  it('computes 40-60ms word-mask stagger delays and 0ms under reducedMotion', () => {
    const normal = computeWordMaskDelays('Guardrail Court Protocol', 50, false);
    expect(normal).toEqual([
      { word: 'Guardrail', index: 0, delayMs: 0 },
      { word: 'Court', index: 1, delayMs: 50 },
      { word: 'Protocol', index: 2, delayMs: 100 },
    ]);

    const reduced = computeWordMaskDelays('Guardrail Court Protocol', 50, true);
    expect(reduced.every((w) => w.delayMs === 0)).toBe(true);
  });

  it('scrambleStep preserves exact character length (CLS = 0) and settles on exact target', () => {
    const addr = '0x6C553Ba27a768D71b570a106D9D2e13553b4103c';
    const mid = scrambleStep(addr, 0.4, 61999, false);
    expect(mid).toHaveLength(addr.length);
    expect(mid.startsWith('0x')).toBe(true);

    const done = scrambleStep(addr, 1.0, 61999, false);
    expect(done).toBe(addr);

    const reduced = scrambleStep(addr, 0.1, 61999, true);
    expect(reduced).toBe(addr);
  });

  it('computeElapsedSeconds computes real elapsed seconds accurately', () => {
    expect(computeElapsedSeconds(1000, 1000)).toBe(0);
    expect(computeElapsedSeconds(1000, 6300)).toBe(5.3);
  });

  it('renders WordMaskHeading, SectionHeading, and ScrambleText cleanly', () => {
    const { container } = render(
      <div>
        <WordMaskHeading text="Guardrail Court" />
        <SectionHeading text="Three Protection Layers" />
        <ScrambleText value="0x6C553Ba27a768D71b570a106D9D2e13553b4103c" />
      </div>
    );
    expect(container.querySelectorAll('.word-mask').length).toBe(2);
    expect(container.querySelector('.section-heading-underline')).toBeInTheDocument();
    expect(container.textContent).toContain('Three Protection Layers');
  });
});
