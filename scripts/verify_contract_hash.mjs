import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const EXPECTED_CONTRACT_HASHES = {
  'contracts/GuardrailCourtV2.py': '94BDA609903A2ECC854269307E628E49869A36B466DAE7CD941553406E12F9F6',
  'contracts/GuardedVaultV2.py': '7CB69D7745B0C9354ECA3D1D712EBF7099726298128C3C45E54F8C7CC2060366',
  'contracts/GuardrailCourt.py': 'DD3C61182F299699A55A3FFEFB64FB472DBA0B37C7B68DEF92235A577E179BBC',
  'contracts/GuardedVault.py': '34844351BD7B484E56E1A55425B73166803B8C3C3277E2F915BBE5BDEFB4D866',
};

export function computeContractSha256(filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  const buffer = fs.readFileSync(fullPath);
  // Normalize \r\n to \n if checked out with CRLF on Windows to match standard LF contract sha
  const str = buffer.toString('utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(Buffer.from(str, 'utf8')).digest('hex').toUpperCase();
}

export function verifyContracts() {
  const results = [];
  let allMatched = true;

  for (const [relPath, expected] of Object.entries(EXPECTED_CONTRACT_HASHES)) {
    const fullPath = path.resolve(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
      results.push({
        file: relPath,
        computed: 'FILE NOT FOUND',
        expected,
        status: 'MISMATCH',
      });
      allMatched = false;
      continue;
    }

    const computed = computeContractSha256(fullPath);
    const matched = computed === expected;
    if (!matched) {
      allMatched = false;
    }
    results.push({
      file: relPath,
      computed,
      expected,
      status: matched ? 'MATCH' : 'MISMATCH',
    });
  }

  return { results, allMatched };
}

// If executed directly as CLI script
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  console.log('=== CONTRACT REFERENCE HASH VERIFICATION ===\n');
  const { results, allMatched } = verifyContracts();

  console.log(
    'FILE'.padEnd(30) +
    ' | ' +
    'COMPUTED SHA-256'.padEnd(64) +
    ' | ' +
    'EXPECTED SHA-256'.padEnd(64) +
    ' | STATUS'
  );
  console.log('-'.repeat(178));

  for (const r of results) {
    console.log(
      r.file.padEnd(30) +
      ' | ' +
      r.computed.padEnd(64) +
      ' | ' +
      r.expected.padEnd(64) +
      ' | ' +
      r.status
    );
  }

  console.log('-'.repeat(178));
  if (allMatched) {
    console.log('\nSTATUS: ALL CONTRACT HASHES MATCH (PASS)');
    process.exit(0);
  } else {
    console.error('\nSTATUS: CONTRACT HASH MISMATCH DETECTED (FAIL)');
    process.exit(1);
  }
}
