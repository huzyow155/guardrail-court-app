import { createClient, chains } from 'genlayer-js';

export const COURT_ADDRESS = '0x6C553Ba27a768D71b570a106D9D2e13553b4103c';
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
  paused: boolean;
  seq: string;
}

export interface DecisionRecord {
  schema_version: string;
  id: string;
  policy_id: string;
  category: string;
  amount: string;
  description: string;
  verdict: 'ALLOW' | 'DENY' | 'ESCALATE';
  source: 'HARD_LIMIT' | 'VELOCITY' | 'JUDGE';
  status: 'CLEARED' | 'DENIED' | 'PENDING_OWNER';
  resolved_by_owner: boolean;
  seq: string;
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
    VELOCITY: number;
    JUDGE: number;
  };
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
 * Check if decision is cleared
 */
export async function isCleared(decisionId: string): Promise<boolean> {
  const raw = await publicClient.readContract({
    address: COURT_ADDRESS,
    functionName: 'is_cleared',
    args: [String(decisionId)],
  });
  return Boolean(raw);
}
