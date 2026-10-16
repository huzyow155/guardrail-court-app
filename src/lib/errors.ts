/**
 * Canonical contract UserError mapping for Guardrail Court V2 and GuardedVaultV2
 *
 * Covers all 44 UserError occurrences across GuardrailCourtV2.py and GuardedVaultV2.py.
 */

export const CONTRACT_USER_ERRORS: Record<string, string> = {
  // Policy Creation & Configuration
  'agent must be a valid address':
    'Invalid agent address. Must be a 42-character hex address (0x...).',
  'policy text length must be between 30 and 1200 characters':
    'Policy text must be between 30 and 1,200 characters.',
  'max_amount must be a valid non-negative integer string':
    'Max amount must be a non-negative integer string (up to 18 digits).',
  'max_amount must be >= 1':
    'Max amount must be at least 1.',
  'window_cap must be a valid non-negative integer string':
    'Window cap must be a non-negative integer string (up to 18 digits).',
  'window_cap must be >= max_amount':
    'Window cap must be greater than or equal to max amount.',
  'allowed_recipients must contain between 1 and 10 items':
    'Allowed recipients must contain between 1 and 10 addresses.',
  'invalid address in allowed_recipients':
    'Invalid address in allowed recipients list.',
  'allowed_assets must contain between 1 and 10 items':
    'Allowed assets must contain between 1 and 10 items.',
  'invalid asset in allowed_assets':
    'Invalid asset specification in allowed assets list.',
  'invalid asset format':
    'Invalid asset format. Must be 2-10 characters or valid address.',

  // Policy Pause & Access
  'policy not found':
    'Policy not found on-chain. Verify the selected Policy ID.',
  'only the policy owner may pause or unpause':
    'Unauthorized: only the policy owner may pause or unpause this policy.',
  'policy is paused':
    'Policy is paused. No new actions can be requested while paused.',

  // Action Requests
  'only the registered agent may request actions':
    'Unauthorized: only the registered agent address can request actions for this policy.',
  'invalid category format':
    'Invalid category. Must be 1-30 characters containing only a-z, 0-9, _, or -.',
  'recipient must be a valid address':
    'Recipient must be a valid 42-character hex address (0x...).',
  'amount must be a valid non-negative integer string':
    'Amount must be a non-negative integer string (up to 18 digits).',
  'amount must be >= 1':
    'Amount must be at least 1.',
  'calldata_hash must be a 64-character hex string':
    'Calldata hash must be a 64-character hex string.',
  'justification length must be between 5 and 600 characters without control chars':
    'Justification must be between 5 and 600 characters without control characters.',
  'too many pending escalations':
    'Too many pending escalations. Max 10 pending escalations reached.',

  // Escalation Resolution
  'decision not found':
    'Decision not found on-chain.',
  'only the policy owner may resolve escalations':
    'Unauthorized: only the policy owner may resolve escalated decisions.',
  'decision is not pending owner resolution':
    'Decision is not pending owner resolution.',
  'decision has already been resolved':
    'Decision has already been resolved.',
  'outcome must be ALLOW or DENY':
    'Outcome must be either ALLOW or DENY.',

  // GuardedVaultV2 Execution
  'decision has already been executed':
    'Decision has already been executed on the Vault (replay prevented).',
  'clearance does not match this action':
    'Clearance mismatch: parameters do not match cleared action hash or policy is paused.',
  'execution not found':
    'Execution record not found on the Vault.',
};

/**
 * Extract human-readable error from leader_receipt payload or genvm stderr
 */
export function extractErrorMessageFromPayload(raw: string): string {
  if (!raw) return '';

  // 1. Check if raw directly contains a known contract error
  for (const [contractErr] of Object.entries(CONTRACT_USER_ERRORS)) {
    if (raw.includes(contractErr)) {
      return contractErr;
    }
  }

  // 2. Try base64 decoding if applicable
  let text = raw;
  try {
    if (typeof atob === 'function') {
      text = atob(raw);
    } else if (typeof (globalThis as any).Buffer !== 'undefined') {
      text = (globalThis as any).Buffer.from(raw, 'base64').toString('utf8');
    }
  } catch {
    text = raw;
  }

  // 3. Look for known contract UserError substring in decoded text
  for (const [contractErr] of Object.entries(CONTRACT_USER_ERRORS)) {
    if (text.includes(contractErr)) {
      return contractErr;
    }
  }

  // 4. Search for UserError pattern
  const userErrorMatch = text.match(/UserError:\s*([^\n\r"]+)/) || raw.match(/UserError:\s*([^\n\r"]+)/);
  if (userErrorMatch) {
    return userErrorMatch[1].trim();
  }

  return (text || raw).trim();
}

/**
 * Format an error message into a user-friendly UI message
 */
export function formatContractError(rawError: string): string {
  const extracted = extractErrorMessageFromPayload(rawError);
  if (CONTRACT_USER_ERRORS[extracted]) {
    return CONTRACT_USER_ERRORS[extracted];
  }
  for (const [key, msg] of Object.entries(CONTRACT_USER_ERRORS)) {
    if (rawError.includes(key) || extracted.includes(key)) {
      return msg;
    }
  }
  return extracted || rawError || 'Unknown contract execution error';
}

export const mapContractError = formatContractError;

/**
 * Custom error class carrying decoded contract error details
 */
export class ContractExecutionError extends Error {
  public readonly rawError: string;
  public readonly friendlyMessage: string;
  public readonly receipt?: any;

  constructor(rawError: string, receipt?: any) {
    const friendly = formatContractError(rawError);
    super(friendly);
    this.name = 'ContractExecutionError';
    this.rawError = rawError;
    this.friendlyMessage = friendly;
    this.receipt = receipt;
  }
}
