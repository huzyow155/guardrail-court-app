import fs from 'fs';
import path from 'path';

// Scan for non-ASCII characters in source files
const SCAN_DIRS = ['src', 'scripts', 'docs'];
let nonAsciiFound = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile() && !file.endsWith('.woff') && !file.endsWith('.woff2') && !file.endsWith('.png') && !file.endsWith('.svg')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude UI decorative bullets/arrows/symbols if intentional, but check unexpected characters
        const nonAscii = line.match(/[^\x00-\x7F]/g);
        if (nonAscii) {
          // Allow common UI symbols: •, →, ←, ©, —
          const allowed = ['\u2022', '\u2192', '\u2190', '\u00A9', '\u2014', '\u201C', '\u201D', '\u2018', '\u2019'];
          const filtered = nonAscii.filter(c => !allowed.includes(c));
          if (filtered.length > 0) {
            console.warn(`[NON-ASCII] in ${fullPath}:${idx + 1}: ${filtered.join(' ')}`);
            nonAsciiFound++;
          }
        }
      });
    }
  }
}

for (const d of SCAN_DIRS) {
  if (fs.existsSync(d)) scanDir(d);
}

console.log(`Scan completed. Disallowed non-ASCII chars found: ${nonAsciiFound}`);
if (nonAsciiFound === 0) {
  console.log('PASSED: Clean ASCII scan.');
}
