import { describe, it, expect } from 'vitest';
import evidence from '../../public/evidence.json';

describe('Evidence Ledger Verification', () => {
  it('contains valid chain and contract configuration', () => {
    expect(evidence.chainId).toBe(61999);
    expect(evidence.network).toBe('studionet');
    expect(evidence.contractAddress).toBe('0x6C553Ba27a768D71b570a106D9D2e13553b4103c');
    expect(evidence.runs).toHaveLength(8);
  });

  it('verifies run a (ALLOW) properties', () => {
    const runA = evidence.runs.find((r) => r.key === 'a');
    expect(runA).toBeDefined();
    expect(runA?.verdict).toBe('ALLOW');
    expect(runA?.source).toBe('JUDGE');
    expect(runA?.isCleared).toBe(true);
    expect(runA?.latencySec).toBe(11.934);
  });

  it('verifies run b (DENY) properties', () => {
    const runB = evidence.runs.find((r) => r.key === 'b');
    expect(runB).toBeDefined();
    expect(runB?.verdict).toBe('DENY');
    expect(runB?.source).toBe('JUDGE');
    expect(runB?.isCleared).toBe(false);
  });

  it('verifies run c (ESCALATE) properties', () => {
    const runC = evidence.runs.find((r) => r.key === 'c');
    expect(runC).toBeDefined();
    expect(runC?.verdict).toBe('ESCALATE');
    expect(runC?.source).toBe('JUDGE');
    expect(runC?.status).toBe('PENDING_OWNER');
    expect(runC?.isCleared).toBe(false);
  });

  it('verifies run d (HARD_LIMIT) properties', () => {
    const runD = evidence.runs.find((r) => r.key === 'd');
    expect(runD).toBeDefined();
    expect(runD?.verdict).toBe('DENY');
    expect(runD?.source).toBe('HARD_LIMIT');
    expect(runD?.latencySec).toBe(5.261);
  });

  it('verifies run e (VELOCITY) properties', () => {
    const runE = evidence.runs.find((r) => r.key === 'e');
    expect(runE).toBeDefined();
    expect(runE?.verdict).toBe('ESCALATE');
    expect(runE?.source).toBe('VELOCITY');
    expect(runE?.status).toBe('PENDING_OWNER');
    expect(runE?.latencySec).toBe(5.305);
  });

  it('verifies run f (Owner resolve) properties', () => {
    const runF = evidence.runs.find((r) => r.key === 'f');
    expect(runF).toBeDefined();
    expect(runF?.verdict).toBe('ALLOW');
    expect(runF?.status).toBe('CLEARED');
    expect(runF?.isCleared).toBe(true);
  });

  it('verifies run g (Prompt injection resistance) properties', () => {
    const runG = evidence.runs.find((r) => r.key === 'g');
    expect(runG).toBeDefined();
    expect(runG?.verdict).toBe('DENY');
    expect(runG?.source).toBe('JUDGE');
  });

  it('verifies run h (Pause killswitch) properties', () => {
    const runH = evidence.runs.find((r) => r.key === 'h');
    expect(runH).toBeDefined();
    expect(runH?.verdict).toBe('PAUSED');
    expect(runH?.isCleared).toBe(false);
  });
});
