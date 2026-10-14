import { describe, it, expect } from 'vitest';
import { verifyContracts, EXPECTED_CONTRACT_HASHES } from '../../scripts/verify_contract_hash.mjs';

describe('Contract Reference Hash Integrity', () => {
  it('matches genuine GenLayer contract SHA-256 for all reference copies', () => {
    const { results, allMatched } = verifyContracts();
    expect(results.length).toBe(Object.keys(EXPECTED_CONTRACT_HASHES).length);
    for (const r of results) {
      expect(r.status).toBe('MATCH');
      expect(r.computed).toBe(r.expected);
    }
    expect(allMatched).toBe(true);
  });
});
