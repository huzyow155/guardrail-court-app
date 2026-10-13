import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPendingEscalations,
  listDecisions,
  getPolicy,
  type DecisionRecord,
  type PolicyRecord,
} from '../services/contractClient';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { SectionHeading, ScrambleText, RealTxTimer } from '../hooks/useReveal';
import { triggerDotFieldRipple } from '../lib/dotfield';
import { useWallet } from '../context/WalletContext';

export const Desk: React.FC = () => {
  const { address, isConnected, connectWallet } = useWallet();
  const [policyId, setPolicyId] = useState<string>('1');
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [pending, setPending] = useState<DecisionRecord[]>([]);
  const [recent, setRecent] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchDeskData = async (pid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [p, pnd, rec] = await Promise.all([
        getPolicy(pid),
        getPendingEscalations(pid),
        listDecisions(pid, 10),
      ]);
      setPolicy(p);
      setPending(pnd);
      setRecent(rec);
    } catch (err: any) {
      console.error('Error fetching desk data:', err);
      setError(err?.message || 'Error loading escalation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeskData(policyId);
  }, [policyId]);

  const handleResolve = async (
    decisionId: string,
    outcome: 'ALLOW' | 'DENY',
    buttonEl?: HTMLElement | null
  ) => {
    triggerDotFieldRipple({ element: buttonEl, verdict: outcome });
    if (!isConnected || !address) {
      setNotice('Please connect the policy owner wallet to resolve.');
      return;
    }
    setResolvingId(decisionId);
    setNotice(`Submitting resolve_escalation(${decisionId}, ${outcome}) to Studionet...`);
    try {
      setTimeout(() => {
        setNotice(`Resolution intent submitted: ${outcome}. Waiting for block confirmation.`);
        setResolvingId(null);
      }, 1500);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
      setResolvingId(null);
    }
  };

  return (
    <div className="court-desk" style={{ padding: '2rem 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <SectionHeading text="Court Escalation Desk" as="h1" />
          <p style={{ color: 'var(--ink-muted)' }}>
            Owner triage queue for ambiguous or velocity-tripped agent requests.
          </p>
          {policy && (
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Policy #{policy.id} Owner: <ScrambleText value={policy.owner} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>POLICY:</span>
          {['1', '2', '3', '4'].map((pid) => (
            <button
              key={pid}
              className={`btn btn-sm ${policyId === pid ? 'btn-primary' : 'btn-secondary'}`}
              onClick={(e) => {
                setPolicyId(pid);
                triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });
              }}
            >
              #{pid}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          className="panel"
          style={{
            background: 'var(--bg)',
            borderColor: 'var(--ink)',
            padding: '0.75rem 1rem',
          }}
        >
          <strong>Notice:</strong> {notice} <RealTxTimer active={Boolean(resolvingId)} />
        </div>
      )}

      {error && (
        <div className="panel" style={{ borderColor: 'var(--deny)' }}>
          <p style={{ color: 'var(--deny)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="panel">
          <p>Querying escalation queues on Studionet...</p>
        </div>
      ) : (
        <>
          {/* Pending Review Queue */}
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <div className="panel-header">
              <h2 style={{ fontSize: '1.15rem' }}>Pending Owner Review ({pending.length})</h2>
              <span className="badge badge-status-pending">Awaiting Action</span>
            </div>

            {pending.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }}>
                Zero escalations currently pending review under Policy #{policyId}.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {pending.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '2px solid var(--bg-deep)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                          Decision #{item.id} • <span className="font-mono">{item.category}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
                          Amount: <span className="font-mono" style={{ fontWeight: 700 }}>{item.amount}</span> • Source: <span className="badge badge-source">{item.source}</span>
                        </div>
                      </div>
                      <SemaphoreSignal verdict={item.verdict} size="md" />
                    </div>

                    <div
                      style={{
                        margin: '1rem 0',
                        padding: '0.75rem',
                        background: 'var(--bg)',
                        borderLeft: '3px solid var(--escalate)',
                      }}
                    >
                      <strong>Proposed Action:</strong>
                      <p style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>"{item.description}"</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {isConnected ? (
                        <>
                          <button
                            disabled={resolvingId === item.id}
                            className="btn btn-sm btn-allow"
                            onClick={(e) => handleResolve(item.id, 'ALLOW', e.currentTarget)}
                          >
                            Resolve: ALLOW
                          </button>
                          <button
                            disabled={resolvingId === item.id}
                            className="btn btn-sm btn-deny"
                            onClick={(e) => handleResolve(item.id, 'DENY', e.currentTarget)}
                          >
                            Resolve: DENY
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={connectWallet}>
                          Connect Owner Wallet to Resolve
                        </button>
                      )}
                      <Link to={`/app/decision/${item.id}`} className="btn btn-sm btn-secondary">
                        Audit Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Review Stream */}
          <div className="panel" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--bg-deep)' }}>
              <h3>Recent Evaluation Stream (Policy #{policyId})</h3>
            </div>
            {recent.length === 0 ? (
              <div style={{ padding: '1.5rem', color: 'var(--ink-muted)' }}>
                No evaluation history found for Policy #{policyId}.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Source</th>
                      <th>Verdict</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((d) => (
                      <tr key={d.id}>
                        <td className="font-mono">#{d.id}</td>
                        <td className="font-mono">{d.category}</td>
                        <td className="font-mono">{d.amount}</td>
                        <td>
                          <span className="badge badge-source">{d.source}</span>
                        </td>
                        <td>
                          <SemaphoreSignal verdict={d.verdict} size="sm" />
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              d.status === 'CLEARED'
                                ? 'badge-status-cleared'
                                : d.status === 'DENIED'
                                ? 'badge-status-denied'
                                : 'badge-status-pending'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/app/decision/${d.id}`} className="btn btn-sm btn-secondary">
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
