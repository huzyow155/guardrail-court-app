import { createClient, chains } from 'genlayer-js';
import {
  DEPLOYMENTS,
  COURT_V2_ADDRESS,
  VAULT_V2_ADDRESS,
  ACTIVE_COURT_ADDRESS,
  ACTIVE_VAULT_ADDRESS,
} from '../config/deployments';

export { DEPLOYMENTS, COURT_V2_ADDRESS, VAULT_V2_ADDRESS, ACTIVE_COURT_ADDRESS, ACTIVE_VAULT_ADDRESS };

export const COURT_ADDRESS = ACTIVE_COURT_ADDRESS;
export const VAULT_ADDRESS = ACTIVE_VAULT_ADDRESS;
export const STUDIONET_CHAIN_ID = 61999;
export const RPC_URL = 'https://studio.genlayer.com/api';

/**
 * Public anonymous client for reading state
 */
export const publicClient = createClient({
  chain: chains.studionet,
});

export interface PolicyRecord {
  schema_version: string;
  id: string;
  owner: string;
  agent: string;
  text: string;
  policy_sha: string;
  max_amount: string;
  window_cap: string;
  allowed_recipients: string[];
  allowed_assets: string[];
  paused: boolean;
  seq: string;
}

export interface DecisionRecord {
  schema_version: string;
  id: string;
  policy_id: string;
  seq: string;
  category: string;
  recipient: string;
  asset: string;
  amount: string;
  calldata_hash: string;
  action_hash: string;
  justification: string;
  verdict: 'ALLOW' | 'DENY' | 'ESCALATE';
  source: 'HARD_LIMIT' | 'RECIPIENT_GUARD' | 'ASSET_GUARD' | 'VELOCITY' | 'JUDGE';
  status: 'CLEARED' | 'DENIED' | 'PENDING_OWNER';
  resolved_by_owner: boolean;
}

export interface PolicyStats {
  schema_version: string;
  policy_id: string;
  total_decisions: number;
  cleared_count: number;
  pending_owner_count: number;
  verdicts: {
    ALLOW: number;
    DENY: number;
    ESCALATE: number;
  };
  sources: {
    HARD_LIMIT: number;
    RECIPIENT_GUARD: number;
    ASSET_GUARD: number;
    VELOCITY: number;
    JUDGE: number;
  };
}

export interface VaultExecutionRecord {
  schema_version: string;
  decision_id: string;
  recipient: string;
  asset: string;
  amount: string;
  calldata_hash: string;
  caller: string;
}

/**
 * Read policy from contract (args must be string)
 */
export async function getPolicy(policyId: string): Promise<PolicyRecord> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_policy',
    args: [String(policyId)],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as PolicyRecord;
}

/**
 * Read policy stats (args must be string)
 */
export async function getPolicyStats(policyId: string): Promise<PolicyStats> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_policy_stats',
    args: [String(policyId)],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as PolicyStats;
}

/**
 * Read decisions under policy
 */
export async function listDecisions(policyId: string, limit: number = 20): Promise<DecisionRecord[]> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'list_decisions',
    args: [String(policyId), limit],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as DecisionRecord[];
}

/**
 * Read single decision
 */
export async function getDecision(decisionId: string): Promise<DecisionRecord> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_decision',
    args: [String(decisionId)],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as DecisionRecord;
}

/**
 * Read pending escalations for policy
 */
export async function getPendingEscalations(policyId: string): Promise<DecisionRecord[]> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'pending_escalations',
    args: [String(policyId)],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as DecisionRecord[];
}

/**
 * Read latest decision ID for policy
 */
export async function latestDecisionId(policyId: string): Promise<string> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'latest_decision_id',
    args: [String(policyId)],
  });
  return String(raw || '');
}

/**
 * List policies by owner
 */
export async function listPoliciesByOwner(owner: string, limit: number = 10): Promise<PolicyRecord[]> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'list_policies_by_owner',
    args: [String(owner), limit],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as PolicyRecord[];
}

/**
 * List policies by agent
 */
export async function listPoliciesByAgent(agent: string, limit: number = 10): Promise<PolicyRecord[]> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'list_policies_by_agent',
    args: [String(agent), limit],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as PolicyRecord[];
}

/**
 * Compute action hash on-chain
 */
export async function getActionHash(
  policyId: string,
  category: string,
  recipient: string,
  asset: string,
  amount: string,
  calldataHash: string
): Promise<string> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'get_action_hash',
    args: [
      String(policyId),
      String(category),
      String(recipient),
      String(asset),
      String(amount),
      String(calldataHash),
    ],
  });
  return String(raw || '');
}

/**
 * Check if decision is cleared for specific parameters (V2 action-bound clearance check)
 */
export async function isClearedFor(
  decisionId: string,
  policyId: string,
  category: string,
  recipient: string,
  asset: string,
  amount: string,
  calldataHash: string
): Promise<boolean> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'is_cleared_for',
    args: [
      String(decisionId),
      String(policyId),
      String(category),
      String(recipient),
      String(asset),
      String(amount),
      String(calldataHash),
    ],
  });
  return Boolean(raw);
}

/**
 * Check if decision has been executed on GuardedVaultV2
 */
export async function isVaultExecuted(decisionId: string): Promise<boolean> {
  const raw = await publicClient.readContract({
    address: VAULT_ADDRESS,
    functionName: 'is_executed',
    args: [String(decisionId)],
  });
  return Boolean(raw);
}

/**
 * Read execution details from GuardedVaultV2
 */
export async function getVaultExecution(decisionId: string): Promise<VaultExecutionRecord> {
  const raw = await publicClient.readContract({
    address: VAULT_ADDRESS,
    functionName: 'get_execution',
    args: [String(decisionId)],
  });
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as VaultExecutionRecord;
}
