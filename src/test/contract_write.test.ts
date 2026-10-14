import { describe, it, expect, vi } from 'vitest';
import {
  createPolicy,
  setPaused,
  requestAction,
  resolveEscalation,
  validateReceipt,
} from '../services/contractWrite';
import {
  CONTRACT_USER_ERRORS,
  mapContractError,
  extractErrorMessageFromPayload,
  ContractExecutionError,
} from '../lib/errors';

describe('Error Mapping & Decoding', () => {
  it('maps all 16 canonical contract UserError strings to friendly messages', () => {
    const errorKeys = Object.keys(CONTRACT_USER_ERRORS);
    expect(errorKeys.length).toBe(16);
    errorKeys.forEach((err) => {
      const mapped = mapContractError(err);
      expect(mapped).toBeTruthy();
      expect(mapped).not.toBe(err); // Should provide a human-friendly explanation
    });
  });

  it('correctly extracts plain and base64 encoded errors from payload', () => {
    // Plain text
    expect(extractErrorMessageFromPayload('policy is paused')).toContain('policy is paused');

    // Base64 encoded 'agent not authorized' -> 'YWdlbnQgbm90IGF1dGhvcml6ZWQ='
    const b64 = (globalThis as any).Buffer
      ? (globalThis as any).Buffer.from('agent not authorized').toString('base64')
      : btoa('agent not authorized');
    expect(extractErrorMessageFromPayload(b64)).toContain('agent not authorized');
  });
});

describe('Receipt Validation', () => {
  it('extracts return value from SUCCESS receipt', () => {
    const mockReceipt: any = {
      status_name: 'ACCEPTED',
      result_name: 'FINALIZED',
      consensus_data: {
        leader_receipt: [
          {
            execution_result: 'SUCCESS',
            result: {
              payload: {
                readable: '"42"',
              },
            },
          },
        ],
      },
    };

    const res = validateReceipt(mockReceipt);
    expect(res.isSuccess).toBe(true);
    expect(res.returnValue).toBe('42');
  });

  it('extracts error from ERROR receipt', () => {
    const mockReceipt: any = {
      status_name: 'ACCEPTED',
      result_name: 'FINALIZED',
      consensus_data: {
        leader_receipt: [
          {
            execution_result: 'ERROR',
            result: {
              payload: 'amount exceeds maximum policy limit',
            },
          },
        ],
      },
    };

    const res = validateReceipt(mockReceipt);
    expect(res.isSuccess).toBe(false);
    expect(res.rawError).toContain('amount exceeds maximum policy limit');
  });
});

describe('Contract Write Parameter Validation', () => {
  const mockClient: any = {
    account: '0x1111111111111111111111111111111111111111',
    writeContract: vi.fn().mockResolvedValue('0xabcdef1234567890'),
    waitForTransactionReceipt: vi.fn().mockResolvedValue({
      status_name: 'ACCEPTED',
      result_name: 'FINALIZED',
      consensus_data: {
        leader_receipt: [
          {
            execution_result: 'SUCCESS',
            result: { payload: { readable: '"7"' } },
          },
        ],
      },
    }),
  };

  it('validates createPolicy input arguments', async () => {
    await expect(
      createPolicy('invalid-addr', 'Valid long enough text policy...', '100', '400', { client: mockClient })
    ).rejects.toThrow(/agent must be a valid 42-character hex address/i);

    await expect(
      createPolicy('0x1234567890123456789012345678901234567890', 'short', '100', '400', { client: mockClient })
    ).rejects.toThrow(/between 30 and 1200/i);

    // Valid call verifies args passed as strings
    const res = await createPolicy(
      '0x1234567890123456789012345678901234567890',
      'The agent may buy cloud compute. Prohibit gifts.',
      '100',
      '400',
      { client: mockClient }
    );
    expect(res.returnValue).toBe('7');
    expect(mockClient.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'create_policy',
        args: [
          '0x1234567890123456789012345678901234567890',
          'The agent may buy cloud compute. Prohibit gifts.',
          '100',
          '400',
        ],
      })
    );
  });

  it('validates requestAction category and amount regex', async () => {
    await expect(
      requestAction('1', 'invalid CATEGORY!', '50', 'Valid description', { client: mockClient })
    ).rejects.toThrow(/invalid category format/i);

    await expect(
      requestAction('1', 'cloud_ops', '-50', 'Valid description', { client: mockClient })
    ).rejects.toThrow(/amount must be a valid non-negative integer string/i);

    await expect(
      requestAction('1', 'cloud_ops', '50', 'too', { client: mockClient })
    ).rejects.toThrow(/description length/i);
  });

  it('validates resolveEscalation outcome', async () => {
    await expect(
      resolveEscalation('1', 'MAYBE' as any, { client: mockClient })
    ).rejects.toThrow(/outcome must be ALLOW or DENY/i);
  });
});
