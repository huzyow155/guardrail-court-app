// WCAG 2.1 Relative Luminance & Contrast Ratio Audit Script
// Mode: chỉ light (Light mode only)

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
    g: fg.g * alpha + bg.g * (1 - alpha),
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
  // Composite surface (0.94 alpha) over thickest dot (0.55 alpha) on --bg
  const dotMaxOnBg = compositeOver(tokens['--dot'], tokens['--bg'], 0.55);
  const surfaceOverMaxDot = compositeOver(tokens['--surface'], dotMaxOnBg, 0.94);

  const pairs = [
    {
      name: 'Body text (--ink) on panel (--surface)',
      fg: tokens['--ink'],
      bg: tokens['--surface'],
      minRatio: 7.0,
      role: 'Body text (>=7:1)',
    },
    {
      name: 'Body text (--ink) on page (--bg)',
      fg: tokens['--ink'],
      bg: tokens['--bg'],
      minRatio: 7.0,
      role: 'Body text (>=7:1)',
    },
    {
      name: 'Body text (--ink) on divider band (--bg-deep)',
      fg: tokens['--ink'],
      bg: tokens['--bg-deep'],
      minRatio: 7.0,
      role: 'Body text (>=7:1)',
    },
    {
      name: 'Body text (--ink) on surface over max-alpha dot (0.55)',
      fg: tokens['--ink'],
      bg: surfaceOverMaxDot,
      minRatio: 7.0,
      role: 'Body on surface over dot (>=7:1)',
    },
    {
      name: 'Large text/UI (--ink) directly on max-alpha dot (0.55 on --bg)',
      fg: tokens['--ink'],
      bg: dotMaxOnBg,
      minRatio: 4.5,
      role: 'Large text / UI on dot (>=4.5:1)',
    },
    {
      name: 'Muted text (--ink-muted) on panel (--surface)',
      fg: tokens['--ink-muted'],
      bg: tokens['--surface'],
      minRatio: 7.0,
      role: 'Body muted text (>=7:1)',
    },
    {
      name: 'Muted text (--ink-muted) on page (--bg)',
      fg: tokens['--ink-muted'],
      bg: tokens['--bg'],
      minRatio: 4.5,
      role: 'Secondary label on bg (>=4.5:1)',
    },
    {
      name: 'Footer/CTA light text (--surface) on dark block (--surface-ink)',
      fg: tokens['--surface'],
      bg: tokens['--surface-ink'],
      minRatio: 7.0,
      role: 'Body text inverted (>=7:1)',
    },
    {
      name: 'Primary button text (--surface) on (--accent)',
      fg: tokens['--surface'],
      bg: tokens['--accent'],
      minRatio: 4.5,
      role: 'UI Button (>=4.5:1)',
    },
    {
      name: 'Secondary button / link (--accent) on (--surface)',
      fg: tokens['--accent'],
      bg: tokens['--surface'],
      minRatio: 4.5,
      role: 'UI Button / Link (>=4.5:1)',
    },
    {
      name: 'Semaphore ALLOW (--allow) label/badge on (--surface)',
      fg: tokens['--allow'],
      bg: tokens['--surface'],
      minRatio: 4.5,
      role: 'Semaphore UI (>=4.5:1)',
    },
    {
      name: 'Semaphore ALLOW button text (--surface) on (--allow)',
      fg: tokens['--surface'],
      bg: tokens['--allow'],
      minRatio: 4.5,
      role: 'UI Action Button (>=4.5:1)',
    },
    {
      name: 'Semaphore ESCALATE (--escalate) label/badge on (--surface)',
      fg: tokens['--escalate'],
      bg: tokens['--surface'],
      minRatio: 4.5,
      role: 'Semaphore UI (>=4.5:1)',
    },
    {
      name: 'Semaphore DENY (--deny) label/badge on (--surface)',
      fg: tokens['--deny'],
      bg: tokens['--surface'],
      minRatio: 4.5,
      role: 'Semaphore UI (>=4.5:1)',
    },
    {
      name: 'Semaphore DENY button text (--surface) on (--deny)',
      fg: tokens['--surface'],
      bg: tokens['--deny'],
      minRatio: 4.5,
      role: 'UI Action Button (>=4.5:1)',
    },
    {
      name: 'Semaphore PAUSED (--paused) label/badge on (--surface)',
      fg: tokens['--paused'],
      bg: tokens['--surface'],
      minRatio: 4.5,
      role: 'Semaphore UI (>=4.5:1)',
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
  console.log('=== WCAG 2.1 CONTRAST AUDIT (Mode: chỉ light) ===');
  console.log('Loaded :root tokens from src/index.css:');
  for (const [k, v] of Object.entries(tokens)) {
    console.log(`  ${k.padEnd(16)}: ${v}`);
  }
  console.log('');
  const results = runContrastAudit(tokens);
  console.log(
    `${'PAIR DESCRIPTION'.padEnd(56)} | ${'FG'.padEnd(8)} | ${'BG'.padEnd(8)} | ${'RATIO'.padEnd(7)} | ${'REQ'.padEnd(6)} | STATUS`
  );
  console.log('-'.repeat(102));
  let allPass = true;
  for (const r of results) {
    if (!r.pass) allPass = false;
    console.log(
      `${r.name.padEnd(56)} | ${r.fg.padEnd(8)} | ${r.bg.padEnd(8)} | ${(r.ratio + ':1').padEnd(7)} | ${(r.minRatio + ':1').padEnd(6)} | ${r.pass ? 'PASS' : 'FAIL'}`
    );
  }
  console.log('-'.repeat(102));
  if (!allPass) {
    console.error('CONTRAST AUDIT FAILED');
    process.exit(1);
  } else {
    console.log(`ALL ${results.length} PAIRS PASSED WCAG THRESHOLDS.`);
  }
}
