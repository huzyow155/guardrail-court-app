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
import { useWallet } from '../context/WalletContext';

export const CourtExplorer: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(id || '1');
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [stats, setStats] = useState<PolicyStats | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [escalations, setEscalations] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { address } = useWallet();

  const loadPolicyData = async (pId: string) => {
    setLoading(true);
    setError(null);
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
      console.error('Failed to load court data:', err);
      setError(err?.message || 'Error loading policy from contract');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicyData(selectedPolicyId);
  }, [selectedPolicyId]);

  const isOwner =
    policy && address && policy.owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="court-explorer" style={{ padding: '2rem 0' }}>
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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>POLICY:</span>
          {['1', '2', '3'].map((pid) => (
            <button
              key={pid}
              className={`btn btn-sm ${selectedPolicyId === pid ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedPolicyId(pid)}
            >
              Policy #{pid} {pid === '1' ? '(Demo)' : ''}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/app/new" className="btn btn-sm btn-secondary">
            + New Policy
          </Link>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => loadPolicyData(selectedPolicyId)}
          >
            ↻ Refresh State
          </button>
        </div>
      </div>

      {loading && (
        <div className="panel">
          <p>Querying contract state on Studionet...</p>
        </div>
      )}

      {error && (
        <div className="panel" style={{ borderColor: 'var(--signal-deny)' }}>
          <p style={{ color: 'var(--signal-deny)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {policy && !loading && (
        <>
          {/* Policy Overview Header */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Policy #{policy.id}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                  SHA256: <span className="font-mono">{policy.policy_sha}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SemaphoreSignal
                  verdict={policy.paused ? 'PAUSED' : 'ALLOW'}
                  size="sm"
                  showLabel={true}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem', fontStyle: 'italic', fontSize: '0.95rem' }}>
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
                <div className="font-mono" style={{ wordBreak: 'break-all' }}>
                  {policy.owner}
                </div>
              </div>
              <div>
                <strong>Agent:</strong>
                <div className="font-mono" style={{ wordBreak: 'break-all' }}>
                  {policy.agent}
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
          </div>

          {/* Stats Bar */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>
                  <Odometer value={stats.total_decisions} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>TOTAL DECISIONS</div>
              </div>
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--signal-allow)' }}>
                  <Odometer value={stats.cleared_count} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>CLEARED</div>
              </div>
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--signal-escalate)' }}>
                  <Odometer value={stats.pending_owner_count} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>PENDING ESCALATIONS</div>
              </div>
              <div className="panel" style={{ margin: 0, textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', color: 'var(--signal-deny)' }}>
                  <Odometer value={stats.verdicts.DENY || 0} />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>DENIED</div>
              </div>
            </div>
          )}

          {/* Escalation Desk (Pending Owner) */}
          <div className="panel">
            <div className="panel-header">
              <h3>Escalation Desk (Pending Owner Review)</h3>
              <span className="badge badge-status-pending">
                {escalations.length} Pending
              </span>
            </div>

            {escalations.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
                No actions currently waiting for owner review under this policy.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {escalations.map((esc) => (
                  <div
                    key={esc.id}
                    style={{
                      border: '1px solid var(--border-mint)',
                      padding: '1rem',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        Decision #{esc.id} • Category: <span className="font-mono">{esc.category}</span> • Amount: <span className="font-mono">{esc.amount}</span>
                      </div>
                      <span className="badge badge-source">{esc.source}</span>
                    </div>

                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                      "{esc.description}"
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <Link
                        to={`/app/decision/${esc.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Inspect Full Decision
                      </Link>
                      {isOwner && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--signal-allow)', fontWeight: 600 }}>
                          Owner Connected: Can resolve on-chain
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
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-mint)' }}>
              <h3>Decisions Ledger</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Description</th>
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
                      <td className="font-mono">{dec.amount}</td>
                      <td style={{ maxWidth: '300px' }}>{dec.description}</td>
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
          </div>
        </>
      )}
    </div>
  );
};
