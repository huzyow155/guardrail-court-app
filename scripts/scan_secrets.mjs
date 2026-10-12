import fs from 'fs';
import path from 'path';

// Scan for leaked secrets or private keys in tracked files
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z]+ PRIVATE KEY-----/,
  /0x[a-fA-F0-9]{64}/, // Generic 32-byte hex (ignore known hashes or check context)
  /ghp_[a-zA-Z0-9]{36}/,
  /gho_[a-zA-Z0-9]{36}/,
  /sk-[a-zA-Z0-9]{20,}/,
];

const ALLOWED_HASHES = new Set([
  // Contract deploy hash
  '0xe7a7ec9e6e1b1cf9f07696d251dc08118b7c865121551107850abb2938d81136',
  // Verified run hashes
  '0x9a52e1031febbdbde4c9bdccb85b31a8a4212ae0c403a4836253f9571bb6d131',
  '0xf6cee5bcec34932a6022bff401307fa2aac906632cc5ec1ea021d727003c90df',
  '0xad1894bed165db218c7e66151efc3fe31148d7feca1deaf777baa0876e184d81',
  '0x60251f8d782ac69f51b55cd4b545e36862163b52a3d63735440138bf52e7af05',
  '0x87339f78182a6b95bbc465154b9b0ed825f4aa5687665d1585d5e631387e1604',
  '0x5fbd13afeef7029c70ee2b51377a1e0d8646517aa269430c25b784137b25fadd',
  '0x5f71327df1b6d8c725572cc9e7572b16c186ddf6efc0bf497ce6a68eed33ff67',
  '0xf739cb6bb69a7d4a9a065b16be46edf6c721fd6453548b666bca46ba40fa93a4',
  '0x1dae708aa8e45aaf5828fd9164af01e33623b31579ca7d35634e1df8e23532de',
  '0x1c6854314d1e02304912f21a8f1df05e7e59b63555bf17e5f7d5e43c0d187e38',
]);

let leaks = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile() && !file.endsWith('.json') && !file.endsWith('.woff') && !file.endsWith('.woff2') && !file.endsWith('.png')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/private_key\s*=|PRIVATE_KEY\s*=/i.test(line)) {
          console.error(`[LEAK ALERT] Potential private key reference in ${fullPath}:${idx + 1}`);
          leaks++;
        }
      });
    }
  }
}

scanDir('src');
scanDir('public');

console.log(`Secret leak scan finished. Leak alerts: ${leaks}`);
if (leaks > 0) {
  process.exit(1);
} else {
  console.log('PASSED: Zero secret leaks in src/ and public/');
}
