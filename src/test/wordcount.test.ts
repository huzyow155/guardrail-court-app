import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { extractVisibleWordsFromTsx } from '../../scripts/count-words.mjs';

describe('Word Count Limits', () => {
  it('landing page strictly contains 350 words or fewer', () => {
    const landingPath = path.resolve('src/pages/Landing.tsx');
    const content = fs.readFileSync(landingPath, 'utf8');
    const words = extractVisibleWordsFromTsx(content);
    expect(words.length).toBeGreaterThan(50);
    expect(words.length).toBeLessThanOrEqual(350);
  });
});
