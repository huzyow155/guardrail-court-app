import { describe, it, expect, vi } from 'vitest';
import {
  createPolicy,
  setPaused,
  requestAction,
  resolveEscalation,
  vaultExecute,
  validateReceipt,
} from '../services/contractWrite';
import {
  CONTRACT_USER_ERRORS,
  mapContractError,
  extractErrorMessageFromPayload,
} from '../lib/errors';

describe('Error Mapping & Decoding', () => {
  it('maps all 30 canonical contract UserError strings to friendly messages', () => {
    const errorKeys = Object.keys(CONTRACT_USER_ERRORS);
    expect(errorKeys.length).toBe(30);
    errorKeys.forEach((err) => {
      const mapped = mapContractError(err);
      expect(mapped).toBeTruthy();
      expect(mapped).not.toBe(err); // Should provide a human-friendly explanation
    });
  });

  it('correctly extracts plain and base64 encoded errors from payload', () => {
    // Plain text
    expect(extractErrorMessageFromPayload('policy is paused')).toContain('policy is paused');

    // Base64 encoded 'policy is paused'
    const b64 = (globalThis as any).Buffer
      ? (globalThis as any).Buffer.from('policy is paused').toString('base64')
      : btoa('policy is paused');
    expect(extractErrorMessageFromPayload(b64)).toContain('policy is paused');
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
              payload: 'clearance does not match this action',
            },
          },
        ],
      },
    };

    const res = validateReceipt(mockReceipt);
    expect(res.isSuccess).toBe(false);
    expect(res.rawError).toContain('clearance does not match this action');
  });
});

describe('Contract Write Parameter Validation (V2)', () => {
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

  it('validates createPolicy input arguments including allowlists', async () => {
    await expect(
      createPolicy('invalid-addr', 'Valid long enough text policy...', '100', '400', ['0x1111111111111111111111111111111111111111'], ['USDC'], { client: mockClient })
    ).rejects.toThrow(/agent must be a valid address/i);

    await expect(
      createPolicy('0x1234567890123456789012345678901234567890', 'short', '100', '400', ['0x1111111111111111111111111111111111111111'], ['USDC'], { client: mockClient })
    ).rejects.toThrow(/between 30 and 1200/i);

    await expect(
      createPolicy('0x1234567890123456789012345678901234567890', 'The agent may buy cloud compute. Prohibit gifts.', '100', '50', ['0x1111111111111111111111111111111111111111'], ['USDC'], { client: mockClient })
    ).rejects.toThrow(/window_cap must be >= max_amount/i);

    // Valid call verifies JSON stringified allowlists passed
    const res = await createPolicy(
      '0x1234567890123456789012345678901234567890',
      'The agent may buy cloud compute. Prohibit gifts.',
      '100',
      '400',
      ['0x1111111111111111111111111111111111111111'],
      ['USDC'],
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
          JSON.stringify(['0x1111111111111111111111111111111111111111']),
          JSON.stringify(['USDC']),
        ],
      })
    );
  });

  it('validates requestAction 7 parameters', async () => {
    await expect(
      requestAction('1', 'invalid CATEGORY!', '0x1111111111111111111111111111111111111111', 'USDC', '50', 'a'.repeat(64), 'Valid justification', { client: mockClient })
    ).rejects.toThrow(/invalid category format/i);

    await expect(
      requestAction('1', 'cloud_ops', 'invalid-recipient', 'USDC', '50', 'a'.repeat(64), 'Valid justification', { client: mockClient })
    ).rejects.toThrow(/recipient must be a valid address/i);

    await expect(
      requestAction('1', 'cloud_ops', '0x1111111111111111111111111111111111111111', 'USDC', '-50', 'a'.repeat(64), 'Valid justification', { client: mockClient })
    ).rejects.toThrow(/amount must be a valid non-negative integer string/i);

    await expect(
      requestAction('1', 'cloud_ops', '0x1111111111111111111111111111111111111111', 'USDC', '50', 'invalid-hash', 'Valid justification', { client: mockClient })
    ).rejects.toThrow(/calldata_hash must be a 64-character hex string/i);

    await expect(
      requestAction('1', 'cloud_ops', '0x1111111111111111111111111111111111111111', 'USDC', '50', 'a'.repeat(64), 'too', { client: mockClient })
    ).rejects.toThrow(/justification length/i);
  });

  it('validates resolveEscalation outcome', async () => {
    await expect(
      resolveEscalation('1', 'MAYBE' as any, { client: mockClient })
    ).rejects.toThrow(/outcome must be ALLOW or DENY/i);
  });

  it('validates vaultExecute invocation targeting vault address', async () => {
    await vaultExecute(
      '1',
      '1',
      'server_ops',
      '0x1111111111111111111111111111111111111111',
      'USDC',
      '40',
      'a'.repeat(64),
      { client: mockClient }
    );
    expect(mockClient.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'execute',
        args: [
          '1',
          '1',
          'server_ops',
          '0x1111111111111111111111111111111111111111',
          'USDC',
          '40',
          'a'.repeat(64),
        ],
      })
    );
  });
});
