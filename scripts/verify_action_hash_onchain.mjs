import { createClient, chains } from 'genlayer-js';
import crypto from 'node:crypto';

export const COURT_V2_ADDRESS = '0xF5797dDB4ce419ec50351BF9B48D5C24D5330d7b';

function normalizeAsset(asset) {
  const trimmed = asset.trim();
  return trimmed.startsWith('0x') ? trimmed.toLowerCase() : trimmed.toUpperCase();
}

function buildCanonicalActionString(policyId, category, recipient, asset, amount, calldataHash) {
  const pId = String(policyId).trim();
  const cat = String(category).trim();
  const rec = String(recipient).trim().toLowerCase();
  const ast = normalizeAsset(asset).toLowerCase();
  const amt = String(amount).trim();
  const cdh = String(calldataHash).trim().toLowerCase();
  return `GC2|${pId}|${cat}|${rec}|${ast}|${amt}|${cdh}`;
}

export function computeActionHash(policyId, category, recipient, asset, amount, calldataHash) {
  const canonical = buildCanonicalActionString(policyId, category, recipient, asset, amount, calldataHash);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

const client = createClient({
  chain: chains.studionet,
});

const testCases = [
  {
    name: 'Set 1: Decision 1 params (Standard uppercase symbol)',
    policyId: '1',
    category: 'server_ops',
    recipient: '0x1111111111111111111111111111111111111111',
    asset: 'USDC',
    amount: '40',
    calldataHash: 'a'.repeat(64),
  },
  {
    name: 'Set 2: Decision 22 params (Policy 3, mixed calldata)',
    policyId: '3',
    category: 'server_ops',
    recipient: '0x1111111111111111111111111111111111111111',
    asset: 'USDC',
    amount: '60',
    calldataHash: '0f631df300bb8cf6816263867d5e305a5d1be4aad7a234b9c900389f55ce3594',
  },
  {
    name: 'Set 3: Contract address as asset (0x lowercase preservation)',
    policyId: '1',
    category: 'treasury',
    recipient: '0x2222222222222222222222222222222222222222',
    asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    amount: '150',
    calldataHash: 'b'.repeat(64),
  },
  {
    name: 'Set 4: NATIVE asset symbol',
    policyId: '2',
    category: 'payroll',
    recipient: '0x3333333333333333333333333333333333333333',
    asset: 'NATIVE',
    amount: '500',
    calldataHash: 'c'.repeat(64),
  },
  {
    name: 'Set 5: Mixed-cased recipient and uppercase calldata hash normalization',
    policyId: '4',
    category: 'marketing_bounty',
    recipient: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
    asset: 'GEN',
    amount: '1000',
    calldataHash: 'D'.repeat(64),
  },
];

async function main() {
  console.log('=== VERIFYING ACTION HASH ON-CHAIN PARITY ===');
  console.log(`Contract: ${COURT_V2_ADDRESS}\n`);

  let allMatched = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[Test ${i + 1}/5] ${tc.name}`);
    console.log(`  Inputs: policy=${tc.policyId}, cat=${tc.category}, rec=${tc.recipient}, asset=${tc.asset}, amt=${tc.amount}`);

    const localHash = computeActionHash(
      tc.policyId,
      tc.category,
      tc.recipient,
      tc.asset,
      tc.amount,
      tc.calldataHash
    );

    let onchainHash = '';
    try {
      const raw = await client.readContract({
        address: COURT_V2_ADDRESS,
        functionName: 'get_action_hash',
        args: [
          String(tc.policyId),
          String(tc.category),
          String(tc.recipient),
          String(tc.asset),
          String(tc.amount),
          String(tc.calldataHash),
        ],
      });
      onchainHash = String(raw || '');
    } catch (err) {
      console.error('  On-chain call error:', err);
      allMatched = false;
      continue;
    }

    const matched = localHash === onchainHash;
    console.log(`  Local Hash   : ${localHash}`);
    console.log(`  On-chain Hash: ${onchainHash}`);
    console.log(`  Result       : ${matched ? 'MATCH (PASS)' : 'MISMATCH (FAIL)'}\n`);

    if (!matched) {
      allMatched = false;
    }
  }

  if (allMatched) {
    console.log('STATUS: ALL 5 SETS MATCH CONTRACT VIEW get_action_hash ON CHAIN');
    process.exit(0);
  } else {
    console.error('STATUS: ON-CHAIN PARITY CHECK FAILED');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
