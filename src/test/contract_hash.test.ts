import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyContracts, EXPECTED_CONTRACT_HASHES } from '../../scripts/verify_contract_hash.mjs';
import { DEPLOYMENTS, COURT_V2_ADDRESS, VAULT_V2_ADDRESS } from '../config/deployments';
import { COURT_ADDRESS, VAULT_ADDRESS } from '../services/contractClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('Contract Reference Hash Integrity & Deployments Parity', () => {
  it('matches genuine GenLayer contract SHA-256 for all 4 reference copies', () => {
    const { results, allMatched } = verifyContracts();
    expect(results.length).toBe(Object.keys(EXPECTED_CONTRACT_HASHES).length);
    expect(results.length).toBe(4);
    for (const r of results) {
      expect(r.status).toBe('MATCH');
      expect(r.computed).toBe(r.expected);
    }
    expect(allMatched).toBe(true);
  });

  it('affirms active addresses in contractClient.ts match README.md and DEPLOYMENTS', () => {
    const readmeContent = fs.readFileSync(path.resolve(rootDir, 'contracts/README.md'), 'utf8');

    // Confirm addresses are imported from config/deployments
    expect(COURT_ADDRESS).toBe(COURT_V2_ADDRESS);
    expect(VAULT_ADDRESS).toBe(VAULT_V2_ADDRESS);

    // Confirm README contains the active V2 addresses
    expect(readmeContent).toContain(DEPLOYMENTS.v2.court.address);
    expect(readmeContent).toContain(DEPLOYMENTS.v2.vault.address);

    // Confirm README contains the legacy superseded addresses
    expect(readmeContent).toContain(DEPLOYMENTS.legacy.court.address);
    expect(readmeContent).toContain(DEPLOYMENTS.legacy.vault.address);

    // Confirm README contains expected SHA-256 hashes
    expect(readmeContent).toContain(DEPLOYMENTS.v2.court.sha256);
    expect(readmeContent).toContain(DEPLOYMENTS.v2.vault.sha256);
    expect(readmeContent).toContain(DEPLOYMENTS.legacy.court.sha256);
    expect(readmeContent).toContain(DEPLOYMENTS.legacy.vault.sha256);
  });
});
