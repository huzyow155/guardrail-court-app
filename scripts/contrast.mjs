// WCAG 2.1 Relative Luminance & Contrast Ratio Audit Script
// Mode: Dark Theme (Vesper Aesthetic)

import fs from 'fs';
import path from 'path';

export function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Alpha composite fg (with alpha 0..1) over bg
export function compositeOver(fgHex, bgHex, alpha) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  return rgbToHex({
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.r * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  });
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const transform = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = transform(r);
  const G = transform(g);
  const B = transform(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse :root tokens from src/index.css so the script verifies the ACTUAL CSS file
export function loadTokensFromCss(cssPath = path.resolve('src/index.css')) {
  const css = fs.readFileSync(cssPath, 'utf8');
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) {
    throw new Error('Could not find :root block in src/index.css');
  }
  const block = rootMatch[1];
  const tokens = {};
  const regex = /(--[a-zA-Z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    tokens[m[1]] = m[2].toUpperCase();
  }
  return tokens;
}

export function runContrastAudit(tokens) {
  const pairs = [
    {
      name: 'Primary text (--text) on dark background (--bg)',
      fg: tokens['--text'] || '#FFFFFF',
      bg: tokens['--bg'] || '#000000',
      minRatio: 7.0,
      role: 'Body text (>=7:1)',
    },
    {
      name: 'Primary text (--text) on dark panel (--surface)',
      fg: tokens['--text'] || '#FFFFFF',
      bg: tokens['--surface'] || '#0E0E0E',
      minRatio: 7.0,
      role: 'Body text on surface (>=7:1)',
    },
    {
      name: 'Primary text (--text) on deep band (--bg-deep)',
      fg: tokens['--text'] || '#FFFFFF',
      bg: tokens['--bg-deep'] || '#050505',
      minRatio: 7.0,
      role: 'Body text on deep bg (>=7:1)',
    },
    {
      name: 'Muted text (--muted) on dark background (--bg)',
      fg: tokens['--muted'] || '#A3A3A3',
      bg: tokens['--bg'] || '#000000',
      minRatio: 7.0,
      role: 'Secondary copy (>=7:1)',
    },
    {
      name: 'Muted text (--muted) on dark panel (--surface)',
      fg: tokens['--muted'] || '#A3A3A3',
      bg: tokens['--surface'] || '#0E0E0E',
      minRatio: 7.0,
      role: 'Secondary copy on surface (>=7:1)',
    },
    {
      name: 'Stat label (--stat) on dark background (--bg)',
      fg: tokens['--stat'] || '#D8D8D8',
      bg: tokens['--bg'] || '#000000',
      minRatio: 7.0,
      role: 'Metric text on bg (>=7:1)',
    },
    {
      name: 'Primary metallic button text (#111111) on white (#FFFFFF)',
      fg: '#111111',
      bg: '#FFFFFF',
      minRatio: 7.0,
      role: 'Button label high-contrast (>=7:1)',
    },
    {
      name: 'Accent text (--accent) on dark background (--bg)',
      fg: tokens['--accent'] || '#6897FF',
      bg: tokens['--bg'] || '#000000',
      minRatio: 4.5,
      role: 'Interactive UI Accent (>=4.5:1)',
    },
    {
      name: 'Accent text (--accent) on dark panel (--surface)',
      fg: tokens['--accent'] || '#6897FF',
      bg: tokens['--surface'] || '#0E0E0E',
      minRatio: 4.5,
      role: 'Interactive UI Accent on surface (>=4.5:1)',
    },
    {
      name: 'Semaphore ALLOW (--allow) on dark background (--bg)',
      fg: tokens['--allow'] || '#34D399',
      bg: tokens['--bg'] || '#000000',
      minRatio: 4.5,
      role: 'ALLOW Status UI (>=4.5:1)',
    },
    {
      name: 'Semaphore ALLOW (--allow) on dark panel (--surface)',
      fg: tokens['--allow'] || '#34D399',
      bg: tokens['--surface'] || '#0E0E0E',
      minRatio: 4.5,
      role: 'ALLOW Status UI on surface (>=4.5:1)',
    },
    {
      name: 'Semaphore ESCALATE (--escalate) on dark background (--bg)',
      fg: tokens['--escalate'] || '#FBBF24',
      bg: tokens['--bg'] || '#000000',
      minRatio: 4.5,
      role: 'ESCALATE Status UI (>=4.5:1)',
    },
    {
      name: 'Semaphore ESCALATE (--escalate) on dark panel (--surface)',
      fg: tokens['--escalate'] || '#FBBF24',
      bg: tokens['--surface'] || '#0E0E0E',
      minRatio: 4.5,
      role: 'ESCALATE Status UI on surface (>=4.5:1)',
    },
    {
      name: 'Semaphore DENY (--deny) on dark background (--bg)',
      fg: tokens['--deny'] || '#F87171',
      bg: tokens['--bg'] || '#000000',
      minRatio: 4.5,
      role: 'DENY Status UI (>=4.5:1)',
    },
    {
      name: 'Semaphore DENY (--deny) on dark panel (--surface)',
      fg: tokens['--deny'] || '#F87171',
      bg: tokens['--surface'] || '#0E0E0E',
      minRatio: 4.5,
      role: 'DENY Status UI on surface (>=4.5:1)',
    },
    {
      name: 'Semaphore PAUSED (--paused) on dark background (--bg)',
      fg: tokens['--paused'] || '#94A3B8',
      bg: tokens['--bg'] || '#000000',
      minRatio: 4.5,
      role: 'PAUSED Status UI (>=4.5:1)',
    },
  ];

  return pairs.map((p) => {
    const ratio = contrastRatio(p.fg, p.bg);
    const pass = ratio >= p.minRatio;
    return {
      ...p,
      ratio: Number(ratio.toFixed(2)),
      pass,
    };
  });
}

if (process.argv[1] && (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('contrast.mjs'))) {
  const tokens = loadTokensFromCss();
  console.log('=== WCAG 2.1 CONTRAST AUDIT (Mode: Dark Theme) ===');
  console.log('Loaded :root tokens from src/index.css:');
  for (const [k, v] of Object.entries(tokens)) {
    console.log(`  ${k.padEnd(16)}: ${v}`);
  }
  console.log('');
  const results = runContrastAudit(tokens);
  console.log(
    `${'PAIR DESCRIPTION'.padEnd(58)} | ${'FG'.padEnd(8)} | ${'BG'.padEnd(8)} | ${'RATIO'.padEnd(7)} | ${'REQ'.padEnd(6)} | STATUS`
  );
  console.log('-'.repeat(104));
  let allPass = true;
  for (const r of results) {
    if (!r.pass) allPass = false;
    console.log(
      `${r.name.padEnd(58)} | ${r.fg.padEnd(8)} | ${r.bg.padEnd(8)} | ${(r.ratio + ':1').padEnd(7)} | ${(r.minRatio + ':1').padEnd(6)} | ${r.pass ? 'PASS' : 'FAIL'}`
    );
  }
  console.log('-'.repeat(104));
  if (!allPass) {
    console.error('CONTRAST AUDIT FAILED');
    process.exit(1);
  } else {
    console.log(`ALL ${results.length} PAIRS PASSED WCAG THRESHOLDS.`);
  }
}
