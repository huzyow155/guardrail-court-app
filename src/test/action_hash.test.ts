import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeActionHash, normalizeAsset } from '../lib/actionHash';
import { getActionHash } from '../services/contractClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

describe('Action Hash Canonical Parity (V2)', () => {
  it('matches recorded action_hash for decision 1 in case_01_clean.json', () => {
    const raw = fs.readFileSync(path.resolve(rootDir, 'src/data/evidence_v2/case_01_clean.json'), 'utf8');
    const data = JSON.parse(raw);
    const d = data.decision;

    const computed = computeActionHash(
      d.policy_id,
      d.category,
      d.recipient,
      d.asset,
      d.amount,
      d.calldata_hash
    );

    expect(computed).toBe(d.action_hash);
    expect(computed).toBe('d1e58b5135c56d6f439e513e79c70b7225edb3c5b35e9dfde831f2257826ee6d');
  });

  it('matches recorded action_hash for decision 22 in case_04b_velocity_live.json', () => {
    const raw = fs.readFileSync(path.resolve(rootDir, 'src/data/evidence_v2/case_04b_velocity_live.json'), 'utf8');
    const data = JSON.parse(raw);
    const d = data.step2_tries[0].decision;

    expect(d.id).toBe('22');
    const computed = computeActionHash(
      d.policy_id,
      d.category,
      d.recipient,
      d.asset,
      d.amount,
      d.calldata_hash
    );

    expect(computed).toBe(d.action_hash);
    expect(computed).toBe('c2c7cc7a985f827b363c691fa0a1564a88ddf8196a9f8f57f6d8d74c3928f731');
  });

  it('correctly normalizes 0x asset addresses vs ticker symbols', () => {
    expect(normalizeAsset('usdc')).toBe('USDC');
    expect(normalizeAsset('USDC')).toBe('USDC');
    expect(normalizeAsset('  native  ')).toBe('NATIVE');
    expect(normalizeAsset('0xAbCdEf1234567890AbCdEf1234567890AbCdEf12')).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
  });

  it('matches on-chain view get_action_hash for 5 distinct parameter sets', async () => {
    const testCases = [
      {
        policyId: '1',
        category: 'server_ops',
        recipient: '0x1111111111111111111111111111111111111111',
        asset: 'USDC',
        amount: '40',
        calldataHash: 'a'.repeat(64),
      },
      {
        policyId: '3',
        category: 'server_ops',
        recipient: '0x1111111111111111111111111111111111111111',
        asset: 'USDC',
        amount: '60',
        calldataHash: '0f631df300bb8cf6816263867d5e305a5d1be4aad7a234b9c900389f55ce3594',
      },
      {
        policyId: '1',
        category: 'treasury',
        recipient: '0x2222222222222222222222222222222222222222',
        asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amount: '150',
        calldataHash: 'b'.repeat(64),
      },
      {
        policyId: '2',
        category: 'payroll',
        recipient: '0x3333333333333333333333333333333333333333',
        asset: 'NATIVE',
        amount: '500',
        calldataHash: 'c'.repeat(64),
      },
      {
        policyId: '4',
        category: 'marketing_bounty',
        recipient: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
        asset: 'GEN',
        amount: '1000',
        calldataHash: 'D'.repeat(64),
      },
    ];

    await Promise.all(
      testCases.map(async (tc) => {
        const localHash = computeActionHash(
          tc.policyId,
          tc.category,
          tc.recipient,
          tc.asset,
          tc.amount,
          tc.calldataHash
        );
        const onchainHash = await getActionHash(
          tc.policyId,
          tc.category,
          tc.recipient,
          tc.asset,
          tc.amount,
          tc.calldataHash
        );
        expect(localHash).toBe(onchainHash);
      })
    );
  }, 30000);
});
