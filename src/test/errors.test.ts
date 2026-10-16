import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTRACT_USER_ERRORS, formatContractError, extractErrorMessageFromPayload } from '../lib/errors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('Contract UserError Catalog Parity (V2)', () => {
  it('extracts all gl.vm.UserError from GuardrailCourtV2.py and GuardedVaultV2.py and asserts complete coverage in CONTRACT_USER_ERRORS', () => {
    const contractFiles = [
      'contracts/GuardrailCourtV2.py',
      'contracts/GuardedVaultV2.py',
    ];

    const extractedErrors = new Set<string>();
    let totalOccurrences = 0;

    for (const relPath of contractFiles) {
      const fullPath = path.resolve(rootDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Match gl.vm.UserError("...") or gl.vm.UserError('...')
      const regex = /gl\.vm\.UserError\(["']([^"']+)["']\)/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        totalOccurrences++;
        extractedErrors.add(match[1]);
      }
    }

    // Verify 44 total occurrences across the two V2 contracts
    expect(totalOccurrences).toBe(44);

    // Verify every extracted contract error string is mapped in CONTRACT_USER_ERRORS
    for (const errStr of extractedErrors) {
      expect(
        CONTRACT_USER_ERRORS[errStr],
        `Missing mapping in CONTRACT_USER_ERRORS for contract error: "${errStr}"`
      ).toBeDefined();
      expect(typeof CONTRACT_USER_ERRORS[errStr]).toBe('string');
      expect(CONTRACT_USER_ERRORS[errStr].length).toBeGreaterThan(0);
    }

    // Verify formatContractError translates properly
    for (const errStr of extractedErrors) {
      const translated = formatContractError(errStr);
      expect(translated).toBe(CONTRACT_USER_ERRORS[errStr]);
    }
  });

  it('correctly extracts and decodes contract error from payloads and Base64 strings', () => {
    const rawError = 'Execution failed: gl.vm.UserError("policy is paused")';
    expect(extractErrorMessageFromPayload(rawError)).toBe('policy is paused');
    expect(formatContractError(rawError)).toBe('Policy is paused. No new actions can be requested while paused.');

    // Base64 encoded payload test
    const b64 = Buffer.from('UserError: clearance does not match this action').toString('base64');
    expect(extractErrorMessageFromPayload(b64)).toBe('clearance does not match this action');
    expect(formatContractError(b64)).toBe('Clearance mismatch: parameters do not match cleared action hash or policy is paused.');
  });
});
