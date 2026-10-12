import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDecision, isCleared, type DecisionRecord } from '../services/contractClient';
import { SemaphoreSignal } from '../components/SemaphoreSignal';

export const DecisionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [clearedStatus, setClearedStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getDecision(id), isCleared(id)])
      .then(([dec, clr]) => {
        setDecision(dec);
        setClearedStatus(clr);
      })
      .catch((err) => {
        console.error('Failed to load decision:', err);
        setError(err.message || 'Error fetching decision from contract');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="panel" style={{ marginTop: '2rem' }}>
        <p>Querying Decision #{id} from Studionet...</p>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="panel" style={{ marginTop: '2rem', borderColor: 'var(--signal-deny)' }}>
        <p style={{ color: 'var(--signal-deny)' }}>{error || 'Decision not found'}</p>
        <Link to="/app" className="btn btn-sm btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Court Desk
        </Link>
      </div>
    );
  }

  return (
    <div className="decision-detail" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/app/policy/${decision.policy_id}`} className="btn btn-sm btn-secondary">
          ← Back to Policy #{decision.policy_id}
        </Link>
        <span className="badge badge-source">Schema v{decision.schema_version}</span>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Decision #{decision.id}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Policy #{decision.policy_id} • Sequence #{decision.seq}
            </div>
          </div>
          <SemaphoreSignal verdict={decision.verdict} size="lg" />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Action Description</h4>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-mint)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
            }}
          >
            "{decision.description}"
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <strong>Category:</strong>
            <div className="font-mono" style={{ marginTop: '0.2rem' }}>
              {decision.category}
            </div>
          </div>

          <div>
            <strong>Amount:</strong>
            <div className="font-mono" style={{ marginTop: '0.2rem' }}>
              {decision.amount}
            </div>
          </div>

          <div>
            <strong>Evaluation Source:</strong>
            <div style={{ marginTop: '0.2rem' }}>
              <span className="badge badge-source">{decision.source}</span>
            </div>
          </div>

          <div>
            <strong>Status:</strong>
            <div style={{ marginTop: '0.2rem' }}>
              <span
                className={`badge ${
                  decision.status === 'CLEARED'
                    ? 'badge-status-cleared'
                    : decision.status === 'DENIED'
                    ? 'badge-status-denied'
                    : 'badge-status-pending'
                }`}
              >
                {decision.status}
              </span>
            </div>
          </div>

          <div>
            <strong>Resolved by Owner:</strong>
            <div className="font-mono" style={{ marginTop: '0.2rem' }}>
              {decision.resolved_by_owner ? 'TRUE' : 'FALSE'}
            </div>
          </div>

          <div>
            <strong>Synchronous `is_cleared`:</strong>
            <div className="font-mono" style={{ marginTop: '0.2rem', fontWeight: 700 }}>
              {clearedStatus ? (
                <span style={{ color: 'var(--signal-allow)' }}>TRUE</span>
              ) : (
                <span style={{ color: 'var(--signal-deny)' }}>FALSE</span>
              )}
            </div>
          </div>
        </div>

        {/* Consumer hook info */}
        <div
          style={{
            borderTop: '1px solid var(--border-mint)',
            paddingTop: '1rem',
            fontSize: '0.85rem',
            color: 'var(--ink-muted)',
          }}
        >
          Downstream smart contracts verify clearance via synchronous view call:
          <code style={{ display: 'block', margin: '0.5rem 0', padding: '0.5rem', background: '#F8FAFC' }}>
            court.view().is_cleared("{decision.id}") -&gt; {String(clearedStatus)}
          </code>
        </div>
      </div>
    </div>
  );
};
