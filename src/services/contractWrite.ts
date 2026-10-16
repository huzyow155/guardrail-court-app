import { createClient, chains } from 'genlayer-js';
import { COURT_ADDRESS, VAULT_ADDRESS, STUDIONET_CHAIN_ID } from './contractClient';
import { ContractExecutionError } from '../lib/errors';

export type GenLayerWriteClient = ReturnType<typeof createClient>;

export interface WriteTxOptions {
  client?: GenLayerWriteClient;
  provider?: any;
  account?: any;
  onHash?: (hash: string) => void;
  targetAddress?: string;
}

export interface WriteTxResult<T = string> {
  hash: string;
  receipt: any;
  latencySec: number;
  returnValue?: T;
}

/**
 * Asserts connected wallet is on Studionet (Chain ID 61999) and prompts switch if needed.
 */
export async function ensureStudionetNetwork(provider?: any): Promise<void> {
  const eth = provider || (typeof window !== 'undefined' ? window.ethereum : null);
  if (!eth?.request) return;

  const currentChain = (await eth.request({ method: 'eth_chainId' })) as string;
  const currentId = parseInt(currentChain, 16);
  if (currentId === STUDIONET_CHAIN_ID) return;

  const studionetHex = '0xF22F'; // 61999
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: studionetHex }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: studionetHex,
            chainName: 'GenLayer Studionet',
            rpcUrls: ['https://studio.genlayer.com/api'],
            nativeCurrency: {
              name: 'GEN',
              symbol: 'GEN',
              decimals: 18,
            },
            blockExplorerUrls: ['https://explorer-studio.genlayer.com'],
          },
        ],
      });
    } else {
      throw new Error(`Please switch your wallet network to GenLayer Studionet (Chain ID 61999). ${switchError?.message || ''}`);
    }
  }
}

/**
 * Creates an authorized write client for either injected wallet or custom test account.
 */
export async function getWriteClient(options?: WriteTxOptions): Promise<{ client: GenLayerWriteClient; accountAddress: string }> {
  if (options?.client) {
    const addr = typeof options.client.account === 'object' && options.client.account !== null
      ? (options.client.account as any).address
      : String(options.client.account || '');
    return { client: options.client, accountAddress: addr };
  }

  const provider = options?.provider || (typeof window !== 'undefined' ? window.ethereum : null);
  let account = options?.account;

  if (!account && provider?.request) {
    await ensureStudionetNetwork(provider);
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    if (!accounts || accounts.length === 0) {
      throw new Error('No account authorized in wallet');
    }
    account = accounts[0];
  }

  if (!account) {
    throw new Error('No wallet or signing account provided for write transaction');
  }

  const client = createClient({
    chain: chains.studionet,
    account,
    provider,
  });

  const accountAddress = typeof account === 'object' && account !== null ? (account as any).address : String(account);
  return { client, accountAddress };
}

/**
 * Validates transaction receipt against strict GenLayer multi-validator consensus criteria:
 * - status_name is ACCEPTED or FINALIZED
 * - result_name is MAJORITY_AGREE
 * - consensus_data.leader_receipt[0].execution_result === 'SUCCESS'
 */
export function validateReceipt(receipt: any): { isSuccess: boolean; rawError?: string; returnValue?: string } {
  if (!receipt) {
    throw new Error('No transaction receipt received');
  }

  const statusValid = receipt.status_name === 'ACCEPTED' || receipt.status_name === 'FINALIZED' || receipt.status === 'ACCEPTED';
  const resultValid = receipt.result_name === 'MAJORITY_AGREE' || receipt.result_name === 'FINALIZED' || receipt.result_name === 'AGREE';
  const leader = receipt.consensus_data?.leader_receipt?.[0];
  const executionSuccess = leader?.execution_result === 'SUCCESS';

  let returnValue: string | undefined;
  if (leader?.result?.payload) {
    const rawPayload = leader.result.payload;
    if (typeof rawPayload === 'object' && rawPayload.readable !== undefined) {
      try {
        returnValue = JSON.parse(rawPayload.readable);
      } catch {
        returnValue = String(rawPayload.readable).replace(/^"|"$/g, '');
      }
    } else if (typeof rawPayload === 'string') {
      returnValue = rawPayload;
    }
  }

  if (statusValid && resultValid && executionSuccess) {
    return { isSuccess: true, returnValue };
  }

  // Extract error
  let rawError = '';
  if (leader?.execution_result === 'ERROR') {
    const payload = leader?.result?.payload;
    if (payload) {
      if (typeof payload === 'object' && payload.readable) {
        rawError = String(payload.readable);
      } else if (typeof payload === 'string') {
        rawError = payload;
      }
    }
    if (!rawError && leader?.genvm_result?.error_description) {
      rawError = leader.genvm_result.error_description;
    }
    if (!rawError && leader?.genvm_result?.stderr) {
      rawError = leader.genvm_result.stderr;
    }
  }

  if (!rawError) {
    rawError = `Transaction failed with status: ${receipt.status_name}, consensus: ${receipt.result_name}, leader: ${leader?.execution_result || 'UNKNOWN'}`;
  }

  return { isSuccess: false, rawError, returnValue };
}

/**
 * Executes a write contract function, polls for consensus receipt, and validates result.
 */
export async function executeWriteContract<T = any>(
  functionName: string,
  args: any[],
  options?: WriteTxOptions
): Promise<WriteTxResult<T>> {
  const { client, accountAddress } = await getWriteClient(options);
  const target = (options?.targetAddress || COURT_ADDRESS) as `0x${string}`;
  const startTime = Date.now();

  const txHash = await client.writeContract({
    address: target,
    functionName,
    args,
    value: 0n,
    account: accountAddress as any,
  });

  if (options?.onHash) {
    options.onHash(txHash);
  }

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    interval: 3000,
    retries: 120,
  });

  const latencySec = Number(((Date.now() - startTime) / 1000).toFixed(2));
  const { isSuccess, rawError, returnValue } = validateReceipt(receipt);

  if (!isSuccess) {
    throw new ContractExecutionError(rawError || 'Transaction execution failed', receipt);
  }

  return {
    hash: txHash,
    receipt,
    latencySec,
    returnValue: returnValue as unknown as T,
  };
}

/**
 * 1. create_policy(agent: str, text: str, max_amount: str, window_cap: str, allowed_recipients: str, allowed_assets: str) -> str
 */
export async function createPolicy(
  agent: string,
  text: string,
  maxAmount: string,
  windowCap: string,
  allowedRecipients: string[] | string,
  allowedAssets: string[] | string,
  options?: WriteTxOptions
): Promise<WriteTxResult<string>> {
  const cleanAgent = agent.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAgent)) {
    throw new Error('agent must be a valid address');
  }
  const cleanText = text.trim();
  if (cleanText.length < 30 || cleanText.length > 1200) {
    throw new Error('policy text length must be between 30 and 1200 characters');
  }
  const cleanMax = maxAmount.trim();
  if (!/^\d{1,18}$/.test(cleanMax)) {
    throw new Error('max_amount must be a valid non-negative integer string');
  }
  if (BigInt(cleanMax) < 1n) {
    throw new Error('max_amount must be >= 1');
  }
  const cleanWindow = windowCap.trim();
  if (!/^\d{1,18}$/.test(cleanWindow)) {
    throw new Error('window_cap must be a valid non-negative integer string');
  }
  if (BigInt(cleanWindow) < BigInt(cleanMax)) {
    throw new Error('window_cap must be >= max_amount');
  }

  // Parse recipients
  let recipientsList: string[] = [];
  if (Array.isArray(allowedRecipients)) {
    recipientsList = allowedRecipients.map((r) => r.trim().toLowerCase());
  } else {
    try {
      recipientsList = JSON.parse(allowedRecipients);
    } catch {
      recipientsList = allowedRecipients.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
    }
  }
  if (recipientsList.length < 1 || recipientsList.length > 10) {
    throw new Error('allowed_recipients must contain between 1 and 10 items');
  }
  for (const r of recipientsList) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(r)) {
      throw new Error('invalid address in allowed_recipients');
    }
  }

  // Parse assets
  let assetsList: string[] = [];
  if (Array.isArray(allowedAssets)) {
    assetsList = allowedAssets.map((a) => a.trim());
  } else {
    try {
      assetsList = JSON.parse(allowedAssets);
    } catch {
      assetsList = allowedAssets.split(',').map((a) => a.trim()).filter(Boolean);
    }
  }
  if (assetsList.length < 1 || assetsList.length > 10) {
    throw new Error('allowed_assets must contain between 1 and 10 items');
  }

  const jsonRecipients = JSON.stringify(recipientsList);
  const jsonAssets = JSON.stringify(assetsList);

  return executeWriteContract<string>(
    'create_policy',
    [cleanAgent, cleanText, cleanMax, cleanWindow, jsonRecipients, jsonAssets],
    options
  );
}

/**
 * 2. set_paused(policy_id: str, paused: bool)
 */
export async function setPaused(
  policyId: string,
  paused: boolean,
  options?: WriteTxOptions
): Promise<WriteTxResult<void>> {
  const cleanId = String(policyId).trim();
  if (!cleanId) {
    throw new Error('policy_id must be provided');
  }
  return executeWriteContract<void>(
    'set_paused',
    [cleanId, Boolean(paused)],
    options
  );
}

/**
 * 3. request_action(policy_id: str, category: str, recipient: str, asset: str, amount: str, calldata_hash: str, justification: str) -> str
 */
export async function requestAction(
  policyId: string,
  category: string,
  recipient: string,
  asset: string,
  amount: string,
  calldataHash: string,
  justification: string,
  options?: WriteTxOptions
): Promise<WriteTxResult<string>> {
  const cleanId = String(policyId).trim();
  if (!cleanId) {
    throw new Error('policy_id must be provided');
  }
  const cleanCategory = category.trim();
  if (!/^[a-z0-9_-]{1,30}$/.test(cleanCategory)) {
    throw new Error('invalid category format');
  }
  const cleanRecipient = recipient.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(cleanRecipient)) {
    throw new Error('recipient must be a valid address');
  }
  const cleanAsset = asset.trim();
  if (!cleanAsset) {
    throw new Error('invalid asset format');
  }
  const cleanAmount = amount.trim();
  if (!/^\d{1,18}$/.test(cleanAmount)) {
    throw new Error('amount must be a valid non-negative integer string');
  }
  if (BigInt(cleanAmount) < 1n) {
    throw new Error('amount must be >= 1');
  }
  const cleanCdh = calldataHash.trim();
  if (!/^[a-fA-F0-9]{64}$/.test(cleanCdh)) {
    throw new Error('calldata_hash must be a 64-character hex string');
  }
  const cleanJustification = justification.trim();
  if (cleanJustification.length < 5 || cleanJustification.length > 600) {
    throw new Error('justification length must be between 5 and 600 characters without control chars');
  }

  return executeWriteContract<string>(
    'request_action',
    [cleanId, cleanCategory, cleanRecipient, cleanAsset, cleanAmount, cleanCdh, cleanJustification],
    options
  );
}

/**
 * 4. resolve_escalation(decision_id: str, outcome: str) ('ALLOW' | 'DENY')
 */
export async function resolveEscalation(
  decisionId: string,
  outcome: 'ALLOW' | 'DENY',
  options?: WriteTxOptions
): Promise<WriteTxResult<void>> {
  const cleanId = String(decisionId).trim();
  if (!cleanId) {
    throw new Error('decision_id must be provided');
  }
  const normOutcome = outcome.trim().toUpperCase();
  if (normOutcome !== 'ALLOW' && normOutcome !== 'DENY') {
    throw new Error('outcome must be ALLOW or DENY');
  }

  return executeWriteContract<void>(
    'resolve_escalation',
    [cleanId, normOutcome],
    options
  );
}

/**
 * 5. vaultExecute(decision_id: str, policy_id: str, category: str, recipient: str, asset: str, amount: str, calldata_hash: str) -> str
 */
export async function vaultExecute(
  decisionId: string,
  policyId: string,
  category: string,
  recipient: string,
  asset: string,
  amount: string,
  calldataHash: string,
  options?: WriteTxOptions
): Promise<WriteTxResult<string>> {
  const cleanDid = String(decisionId).trim();
  const cleanPid = String(policyId).trim();
  const cleanCategory = String(category).trim();
  const cleanRecipient = String(recipient).trim();
  const cleanAsset = String(asset).trim();
  const cleanAmount = String(amount).trim();
  const cleanCdh = String(calldataHash).trim();

  return executeWriteContract<string>(
    'execute',
    [cleanDid, cleanPid, cleanCategory, cleanRecipient, cleanAsset, cleanAmount, cleanCdh],
    {
      ...options,
      targetAddress: VAULT_ADDRESS,
    }
  );
}
