import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadTokensFromCss, runContrastAudit } from '../../scripts/contrast.mjs';

function getAllFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'test') {
        getAllFiles(full, acc);
      }
    } else if (/\.(ts|tsx|css)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

describe('WCAG Contrast Tokens & Forbidden Phrase Audit', () => {
  it('passes all 16 WCAG 2.1 contrast pairs from src/index.css', () => {
    const tokens = loadTokensFromCss(path.resolve('src/index.css'));
    const results = runContrastAudit(tokens);
    expect(results.length).toBeGreaterThanOrEqual(15);
    for (const r of results) {
      expect(r.pass, `${r.name} had ratio ${r.ratio}:1 < ${r.minRatio}:1`).toBe(true);
    }
  });

  it('contains zero occurrences of "rolling", "10 same-category", or "Space Grotesk" in src/', () => {
    const files = getAllFiles(path.resolve('src'));
    const forbidden = /rolling|10 same-category|Space Grotesk/i;
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      expect(forbidden.test(content), `Forbidden phrase found in ${f}`).toBe(false);
    }
  });
});
