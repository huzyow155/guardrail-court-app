import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getPolicy,
  getPolicyStats,
  listDecisions,
  getPendingEscalations,
  type PolicyRecord,
  type PolicyStats,
  type DecisionRecord,
} from '../services/contractClient';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { Odometer } from '../components/Odometer';
import { SectionHeading, ScrambleText, RealTxTimer } from '../hooks/useReveal';
import { triggerDotFieldRipple } from '../lib/dotfield';
import { useWallet } from '../context/WalletContext';
import { setPaused } from '../services/contractWrite';

// Recorded fallback data from on-chain evidence (docs/evidence_v2/case_12_stats.json)
const RECORDED_FALLBACK_STATS: Record<string, PolicyStats> = {
  '1': {
    schema_version: '2',
    policy_id: '1',
    total_decisions: 10,
    cleared_count: 2,
    pending_owner_count: 3,
    verdicts: { ALLOW: 2, DENY: 5, ESCALATE: 3 },
    sources: { HARD_LIMIT: 1, RECIPIENT_GUARD: 1, ASSET_GUARD: 1, VELOCITY: 0, JUDGE: 7 },
  },
  '2': {
    schema_version: '2',
    policy_id: '2',
    total_decisions: 11,
    cleared_count: 0,
    pending_owner_count: 10,
    verdicts: { ALLOW: 0, DENY: 1, ESCALATE: 10 },
    sources: { HARD_LIMIT: 0, RECIPIENT_GUARD: 0, ASSET_GUARD: 0, VELOCITY: 0, JUDGE: 11 },
  },
  '3': {
    schema_version: '2',
    policy_id: '3',
    total_decisions: 4,
    cleared_count: 3,
    pending_owner_count: 0,
    verdicts: { ALLOW: 3, DENY: 1, ESCALATE: 0 },
    sources: { HARD_LIMIT: 1, RECIPIENT_GUARD: 0, ASSET_GUARD: 0, VELOCITY: 1, JUDGE: 2 },
  },
};

export const CourtExplorer: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const initialId = id || '1';
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(initialId);
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [stats, setStats] = useState<PolicyStats | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [escalations, setEscalations] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecorded, setIsRecorded] = useState<boolean>(false);

  const { address } = useWallet();

  const loadPolicyData = async (pId: string) => {
    setLoading(true);
    setError(null);
    setIsRecorded(false);

    try {
      const [p, s, d, e] = await Promise.all([
        getPolicy(pId),
        getPolicyStats(pId),
        listDecisions(pId, 20),
        getPendingEscalations(pId),
      ]);
      setPolicy(p);
      setStats(s);
      setDecisions(d);
      setEscalations(e);
    } catch (err: any) {
      console.warn(`RPC fetch failed for Policy #${pId}, using recorded fallback if available:`, err);
      if (RECORDED_FALLBACK_STATS[pId]) {
        setStats(RECORDED_FALLBACK_STATS[pId]);
        setIsRecorded(true);
      } else {
        setError(err?.message || 'Error loading policy from contract');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicyData(selectedPolicyId);
  }, [selectedPolicyId]);

  const [togglingPause, setTogglingPause] = useState<boolean>(false);
  const [pauseNotice, setPauseNotice] = useState<string | null>(null);

  const isOwner =
    Boolean(policy && address && policy.owner.toLowerCase() === address.toLowerCase());

  const handleTogglePause = async () => {
    if (!policy) return;
    setTogglingPause(true);
    setPauseNotice(null);
    try {
      const nextPaused = !policy.paused;
      await setPaused(policy.id, nextPaused);
      setPauseNotice(`Policy #${policy.id} ${nextPaused ? 'paused' : 'unpaused'} successfully.`);
      await loadPolicyData(selectedPolicyId);
    } catch (err: any) {
      setPauseNotice(`Error: ${err?.message || 'Failed to update pause state'}`);
    } finally {
      setTogglingPause(false);
    }
  };

  return (
    <div className="court-explorer" style={{ padding: '0', minHeight: '800px' }}>
      <SectionHeading text="Court Policy Explorer" as="h1" />

      {/* Policy Switching Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', letterSpacing: '0.05em' }}>POLICY:</span>
          {['1', '2', '3', '4', '5'].map((pid) => (
            <button
              key={pid}
              className={`btn btn-sm ${selectedPolicyId === pid ? 'btn-primary' : 'btn-secondary'}`}
              onClick={(e) => {
                setSelectedPolicyId(pid);
                triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });
              }}
            >
              #{pid}
            </button>
          ))}
          {isRecorded && (
            <span className="badge badge-source" style={{ color: 'var(--escalate)', borderColor: 'var(--escalate)' }}>
              recorded
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/app/new" className="btn btn-sm btn-secondary">
            + New Policy
          </Link>
          <button
            className="btn btn-sm btn-secondary"
            onClick={(e) => {
              triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });
              loadPolicyData(selectedPolicyId);
            }}
          >
            Refresh State
          </button>
        </div>
      </div>

      {pauseNotice && (
        <div
          className="panel"
          style={{
            marginBottom: '1rem',
            background: 'var(--bg)',
            borderColor: 'var(--ink)',
            padding: '0.75rem 1rem',
          }}
        >
          <strong>Notice:</strong> {pauseNotice}
        </div>
      )}

      {loading && !policy && (
        <div className="panel" style={{ minHeight: '240px' }}>
          <p>Querying Policy #{selectedPolicyId} on Studionet...</p>
        </div>
      )}

      {error && (
        <div className="panel" style={{ borderColor: 'var(--deny)' }}>
          <p style={{ color: 'var(--deny)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {!loading && !error && !policy && (
        <div className="panel">
          <p style={{ color: 'var(--ink-muted)' }}>No policy found for ID #{selectedPolicyId}.</p>
        </div>
      )}

      {policy && (
        <>
          {/* Policy Overview Header */}
          <div className="panel" style={{ minHeight: '190px' }}>
            <div className="panel-header">
              <div>
                <h2 style={{ fontSize: '1.15rem' }}>Policy #{policy.id}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                  SHA256: <ScrambleText value={policy.policy_sha} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SemaphoreSignal
                  verdict={policy.paused ? 'PAUSED' : 'ALLOW'}
                  size="sm"
                  showLabel={true}
                />
                {isOwner && (
                  <button
                    disabled={togglingPause}
                    className={`btn btn-sm ${policy.paused ? 'btn-allow' : 'btn-deny'}`}
                    onClick={handleTogglePause}
                    style={{ marginLeft: '6px' }}
                  >
                    {togglingPause ? (
                      <>
                        Updating <RealTxTimer active={togglingPause} />
                      </>
                    ) : policy.paused ? (
                      'Unpause'
                    ) : (
                      'Pause'
                    )}
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem', fontStyle: 'italic', fontSize: '0.95rem', minHeight: '44px', lineHeight: '1.45' }}>
              "{policy.text}"
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <strong>Owner:</strong>
                <div style={{ wordBreak: 'break-all' }}>
                  <ScrambleText value={policy.owner} />
                </div>
              </div>
              <div>
                <strong>Agent:</strong>
                <div style={{ wordBreak: 'break-all' }}>
                  <ScrambleText value={policy.agent} />
                </div>
              </div>
              <div>
                <strong>Max Amount:</strong>
                <div className="font-mono">{policy.max_amount}</div>
              </div>
              <div>
                <strong>Window Cap:</strong>
                <div className="font-mono">{policy.window_cap}</div>
              </div>
            </div>

            {policy.allowed_recipients && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                Allowlist: {policy.allowed_recipients.length} recipients, {policy.allowed_assets?.length || 0} assets
              </div>
            )}
          </div>

          {/* Stats Bar */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
                minHeight: '88px',
              }}
            >
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>
                  <Odometer value={stats.total_decisions} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>TOTAL DECISIONS</div>
              </div>
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--allow)' }}>
                  <Odometer value={stats.cleared_count} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>CLEARED</div>
              </div>
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--escalate)' }}>
                  <Odometer value={stats.pending_owner_count} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>PENDING OWNER</div>
              </div>
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--deny)' }}>
                  <Odometer value={stats.verdicts?.DENY || 0} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)' }}>DENIED</div>
              </div>
            </div>
          )}

          {/* Escalation Desk (Pending Owner) */}
          <div className="panel">
            <div className="panel-header">
              <h2 style={{ fontSize: '1.15rem' }}>Escalation Desk (Pending Owner)</h2>
              <span className="badge badge-status-pending">
                {escalations.length} Pending
              </span>
            </div>

            {escalations.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
                No actions waiting for owner review under Policy #{policy.id}.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {escalations.map((esc) => (
                  <div
                    key={esc.id}
                    style={{
                      border: '1px solid var(--border)',
                      padding: '1rem',
                      background: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        Decision #{esc.id} • <span className="font-mono">{esc.category}</span> • Amount: <span className="font-mono">{esc.amount} {esc.asset}</span>
                      </div>
                      <span className="badge badge-source">{esc.source}</span>
                    </div>

                    <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                      "{esc.justification || (esc as any).description}"
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link
                        to={`/app/decision/${esc.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Inspect Decision
                      </Link>
                      {isOwner && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--allow)', fontWeight: 600 }}>
                          Owner Connected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decisions Ledger */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.15rem' }}>Decisions Ledger</h2>
            </div>
            {decisions.length === 0 ? (
              <div style={{ padding: '1.5rem', color: 'var(--ink-muted)' }}>
                No decisions recorded under Policy #{policy.id}.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Justification</th>
                      <th>Source</th>
                      <th>Verdict</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((dec) => (
                      <tr key={dec.id}>
                        <td className="font-mono" style={{ fontWeight: 700 }}>
                          #{dec.id}
                        </td>
                        <td className="font-mono">{dec.category}</td>
                        <td className="font-mono">{dec.amount} {dec.asset}</td>
                        <td style={{ maxWidth: '300px' }}>{dec.justification || (dec as any).description}</td>
                        <td>
                          <span className="badge badge-source">{dec.source}</span>
                        </td>
                        <td>
                          <SemaphoreSignal verdict={dec.verdict} size="sm" />
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              dec.status === 'CLEARED'
                                ? 'badge-status-cleared'
                                : dec.status === 'DENIED'
                                ? 'badge-status-denied'
                                : 'badge-status-pending'
                            }`}
                          >
                            {dec.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/app/decision/${dec.id}`} className="btn btn-sm btn-secondary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
