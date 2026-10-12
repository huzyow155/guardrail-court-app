import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Word Count Limits', () => {
  it('landing page strictly contains 220 words or fewer', () => {
    const landingPath = path.resolve('src/pages/Landing.tsx');
    const content = fs.readFileSync(landingPath, 'utf8');
    const matches = content.match(/>([^<]+)</g) || [];
    const text = matches
      .map((m) => m.slice(1, -1).trim())
      .filter(Boolean)
      .join(' ')
      .replace(/[#*`_~]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = text.split(' ').filter(Boolean).length;
    expect(wordCount).toBeLessThanOrEqual(220);
  });
});
