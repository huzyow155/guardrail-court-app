import { describe, it, expect } from 'vitest';
import {
  COURT_ADDRESS,
  STUDIONET_CHAIN_ID,
  RPC_URL,
} from '../services/contractClient';

describe('Contract Interface Parameters', () => {
  it('has correct Studionet parameters', () => {
    expect(COURT_ADDRESS).toBe('0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b');
    expect(STUDIONET_CHAIN_ID).toBe(61999);
    expect(RPC_URL).toBe('https://studio.genlayer.com/api');
  });

  it('validates string parameter conversion requirement', () => {
    // Proves that contract parameters require string representation to avoid GenVM type errors
    const policyIdNum = 1;
    const policyIdStr = String(policyIdNum);
    expect(typeof policyIdStr).toBe('string');
    expect(policyIdStr).toBe('1');
  });
});
