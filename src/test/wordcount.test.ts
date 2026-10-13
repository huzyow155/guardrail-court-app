import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractVisibleWordsFromTsx } from '../../scripts/count-words.mjs';

describe('Editorial Landing Page Word Count Bounds', () => {
  it('landing page contains complete 6-section editorial narrative within bounds (250..1200 words)', () => {
    const landingPath = path.resolve('src/pages/Landing.tsx');
    const content = fs.readFileSync(landingPath, 'utf8');
    const words = extractVisibleWordsFromTsx(content);
    expect(words.length).toBeGreaterThanOrEqual(250);
    expect(words.length).toBeLessThanOrEqual(1200);
  });
});
