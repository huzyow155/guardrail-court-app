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
import { resolveEscalation, setPaused } from '../services/contractWrite';

function renderSourceBadge(source: string) {
  let shapeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    border: '1px solid currentColor',
  };
  let symbol = '•';

  switch (source) {
    case 'HARD_LIMIT':
      shapeStyle = { ...shapeStyle, borderRadius: '0px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--deny)' };
      symbol = '■';
      break;
    case 'RECIPIENT_GUARD':
      shapeStyle = { ...shapeStyle, borderRadius: '8px 0px 8px 0px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--escalate)' };
      symbol = '◆';
      break;
    case 'ASSET_GUARD':
      shapeStyle = { ...shapeStyle, borderRadius: '0px 8px 0px 8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--escalate)' };
      symbol = '▲';
      break;
    case 'VELOCITY':
      shapeStyle = { ...shapeStyle, borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--deny)' };
      symbol = '⚡';
      break;
    case 'JUDGE':
      shapeStyle = { ...shapeStyle, borderRadius: '4px', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--allow)' };
      symbol = '⚖';
      break;
    default:
      shapeStyle = { ...shapeStyle, borderRadius: '4px', background: 'var(--surface)' };
      symbol = '•';
      break;
  }

  return (
    <span style={shapeStyle} title={`Source: ${source}`}>
      <span>{symbol}</span>
      <span>{source}</span>
    </span>
  );
}

export const Desk: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [policyId, setPolicyId] = useState<string>('1');
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [pending, setPending] = useState<DecisionRecord[]>([]);
  const [recent, setRecent] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [togglingPause, setTogglingPause] = useState<boolean>(false);
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

  const handleTogglePause = async () => {
    if (!policy) return;
    if (!isConnected || !address) {
      setNotice('Please connect the policy owner wallet to toggle pause.');
      return;
    }
    if (address.toLowerCase() !== policy.owner.toLowerCase()) {
      setNotice('Unauthorized: Only policy owner can pause or unpause.');
      return;
    }
    const nextPaused = !policy.paused;
    setTogglingPause(true);
    setNotice(`Submitting set_paused(${policyId}, ${nextPaused}) to Studionet...`);
    try {
      const res = await setPaused(policyId, nextPaused);
      setNotice(`Policy #${policyId} is now ${nextPaused ? 'PAUSED' : 'ACTIVE'}! (Tx: ${res.hash})`);
      await fetchDeskData(policyId);
    } catch (err: any) {
      setNotice(`Pause toggle failed: ${err?.message || err}`);
    } finally {
      setTogglingPause(false);
    }
  };

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
    if (policy && address.toLowerCase() !== policy.owner.toLowerCase()) {
      setNotice(
        `Unauthorized: Only policy owner (${policy.owner.slice(0, 6)}...${policy.owner.slice(-4)}) can resolve.`
      );
      return;
    }
    setResolvingId(decisionId);
    setNotice(`Submitting resolve_escalation(#${decisionId}, ${outcome}) to Studionet...`);
    try {
      const result = await resolveEscalation(decisionId, outcome);
      setNotice(`Resolved decision #${decisionId} as ${outcome}! (Tx: ${result.hash})`);
      await fetchDeskData(policyId);
    } catch (err: any) {
      setNotice(`Error: ${err?.message || 'Transaction submission failed'}`);
    } finally {
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
              Policy #{policy.id} Owner: <ScrambleText value={policy.owner} /> • Status:{' '}
              <span style={{ color: policy.paused ? 'var(--deny)' : 'var(--allow)', fontWeight: 700 }}>
                {policy.paused ? 'PAUSED' : 'ACTIVE'}
              </span>
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
          {policy && isConnected && (
            <button
              type="button"
              disabled={togglingPause}
              className={`btn btn-sm ${policy.paused ? 'btn-allow' : 'btn-deny'}`}
              style={{ marginLeft: '0.5rem' }}
              onClick={handleTogglePause}
            >
              {togglingPause ? (
                <>
                  Updating <RealTxTimer active={togglingPause} />
                </>
              ) : policy.paused ? (
                'Unpause Policy'
              ) : (
                'Pause Policy'
              )}
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div
          className="panel"
          style={{
            background: 'var(--bg)',
            borderColor: 'var(--ink)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
          }}
        >
          <strong>Notice:</strong> {notice} <RealTxTimer active={Boolean(resolvingId || togglingPause)} />
        </div>
      )}

      {error && (
        <div className="panel" style={{ borderColor: 'var(--deny)', marginBottom: '1.25rem' }}>
          <p style={{ color: 'var(--deny)', fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="panel">
          <p>Loading escalations for Policy #{policyId}...</p>
        </div>
      ) : (
        <>
          {/* Pending Escalations Section */}
          <div className="panel" style={{ marginBottom: '2rem' }}>
            <div className="panel-header">
              <h3>Pending Owner Escalations ({pending.length})</h3>
              <span className="badge badge-source">Owner Action Required</span>
            </div>

            {pending.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }}>
                No actions currently pending owner triage for Policy #{policyId}.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pending.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Link
                          to={`/app/decision/${d.id}`}
                          className="font-mono text-link"
                          style={{ fontWeight: 700 }}
                        >
                          Decision #{d.id}
                        </Link>
                        {renderSourceBadge(d.source)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          disabled={Boolean(resolvingId)}
                          className="btn btn-sm btn-allow"
                          onClick={(e) => handleResolve(d.id, 'ALLOW', e.currentTarget)}
                        >
                          {resolvingId === d.id ? 'Resolving...' : 'Resolve ALLOW'}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(resolvingId)}
                          className="btn btn-sm btn-deny"
                          onClick={(e) => handleResolve(d.id, 'DENY', e.currentTarget)}
                        >
                          {resolvingId === d.id ? 'Resolving...' : 'Resolve DENY'}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      "{d.justification || '(no justification)'}"
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                      Category: <strong>{d.category}</strong> • Amount: <strong>{d.amount} {d.asset}</strong> • Recipient:{' '}
                      <span className="font-mono">{d.recipient}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Decisions Audit */}
          <div className="panel">
            <div className="panel-header">
              <h3>Recent Policy Decisions</h3>
              <span className="badge badge-source">Policy #{policyId}</span>
            </div>

            {recent.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }}>No recorded decisions yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>ID</th>
                      <th style={{ padding: '0.5rem' }}>Verdict</th>
                      <th style={{ padding: '0.5rem' }}>Source (Shaped)</th>
                      <th style={{ padding: '0.5rem' }}>Amount</th>
                      <th style={{ padding: '0.5rem' }}>Recipient</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--bg)' }}>
                        <td style={{ padding: '0.5rem' }}>
                          <Link to={`/app/decision/${d.id}`} className="font-mono text-link">
                            #{d.id}
                          </Link>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <SemaphoreSignal verdict={d.verdict} size="sm" showLabel={true} />
                        </td>
                        <td style={{ padding: '0.5rem' }}>{renderSourceBadge(d.source)}</td>
                        <td style={{ padding: '0.5rem' }} className="font-mono">
                          {d.amount} {d.asset}
                        </td>
                        <td style={{ padding: '0.5rem' }} className="font-mono">
                          {d.recipient ? `${d.recipient.slice(0, 6)}...${d.recipient.slice(-4)}` : '-'}
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span className={`badge ${d.status === 'CLEARED' ? 'badge-status-cleared' : d.status === 'DENIED' ? 'badge-status-denied' : 'badge-status-pending'}`}>
                            {d.status}
                          </span>
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
