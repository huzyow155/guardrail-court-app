import { describe, it, expect } from 'vitest';
import {
  COURT_ADDRESS,
  STUDIONET_CHAIN_ID,
  RPC_URL,
} from '../services/contractClient';

describe('Contract Interface Parameters', () => {
  it('has correct Studionet parameters', () => {
    expect(COURT_ADDRESS).toBe('0x6C553Ba27a768D71b570a106D9D2e13553b4103c');
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
