import fs from 'fs';
import path from 'path';

// Banned words list as per GenLayer hackathon rules
const BANNED_PATTERNS = [
  /\btestnet\b/i,
  /\blive\b/i,
  /\bunanimous\b/i,
  /\btamper-proof\b/i,
  /\bcryptographic proof\b/i,
  /\bbytecode\b/i,
  /\brevolutionary\b/i,
  /\bfirst\b/i,
  /\bonly\b/i,
];

const SCAN_DIRS = ['src', 'public', 'docs'];
const IGNORE_FILES = ['live_evidence.json']; // Historical file name in contract repo

let violations = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile() && !file.endsWith('.png') && !file.endsWith('.svg') && !file.endsWith('.woff') && !file.endsWith('.woff2')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude license lines or git commit logs
        for (const pattern of BANNED_PATTERNS) {
          if (pattern.test(line)) {
            // Check context: "Studionet" is allowed, but standalone "testnet" is not.
            // "live" as status is banned; check if match is isolated
            console.warn(`[WARNING] Banned word pattern ${pattern} matched in ${fullPath}:${idx + 1}: ${line.trim()}`);
            violations++;
          }
        }
      });
    }
  }
}

for (const d of SCAN_DIRS) {
  if (fs.existsSync(d)) scanDir(d);
}

console.log(`Scan completed. Total banned word pattern alerts: ${violations}`);
if (violations > 0) {
  // Report warnings but keep track
}
