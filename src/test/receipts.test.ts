import { describe, it, expect } from 'vitest';
import createPolicyReceipt from '../data/fixtures/create_policy_receipt.json';
import requestActionReceipt from '../data/fixtures/request_action_receipt.json';

describe('Receipt Fixtures & Consensus Validation', () => {
  it('validates create_policy receipt on Studionet', () => {
    expect(createPolicyReceipt.status_name).toBe('ACCEPTED');
    expect(createPolicyReceipt.result_name).toBe('MAJORITY_AGREE');
    expect(createPolicyReceipt.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(createPolicyReceipt.consensus_data.leader_receipt[0].execution_result).toBe('SUCCESS');
  });

  it('validates request_action receipt on Studionet', () => {
    expect(requestActionReceipt.status_name).toBe('ACCEPTED');
    expect(requestActionReceipt.result_name).toBe('MAJORITY_AGREE');
    expect(requestActionReceipt.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(requestActionReceipt.consensus_data.leader_receipt[0].execution_result).toBe('SUCCESS');
  });
});
