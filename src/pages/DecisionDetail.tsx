import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDecision, isCleared, type DecisionRecord } from '../services/contractClient';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { SectionHeading, ScrambleText } from '../hooks/useReveal';

export const DecisionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [clearedStatus, setClearedStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([getDecision(id), isCleared(id)])
      .then(([dec, clr]) => {
        setDecision(dec);
        setClearedStatus(clr);
      })
      .catch((err) => {
        console.error('Failed to load decision:', err);
        setError(err?.message || 'Error fetching decision from contract');
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

  if (error) {
    return (
      <div className="panel" style={{ marginTop: '2rem', borderColor: 'var(--deny)' }}>
        <p style={{ color: 'var(--deny)', fontWeight: 600 }}>{error}</p>
        <Link to="/app" className="btn btn-sm btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Court Explorer
        </Link>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="panel" style={{ marginTop: '2rem' }}>
        <p style={{ color: 'var(--ink-muted)' }}>No decision record found for ID #{id}.</p>
        <Link to="/app" className="btn btn-sm btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Court Explorer
        </Link>
      </div>
    );
  }

  return (
    <div className="decision-detail" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to={`/app/policy/${decision.policy_id}`} className="btn btn-sm btn-secondary">
          ← Policy #{decision.policy_id}
        </Link>
        <span className="badge badge-source">Schema v{decision.schema_version}</span>
      </div>

      <SectionHeading text={`Decision #${decision.id}`} as="h1" />

      <div className="panel">
        <div className="panel-header">
          <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
            Policy #<ScrambleText value={decision.policy_id} /> • Sequence #<ScrambleText value={decision.seq} />
          </div>
          <SemaphoreSignal verdict={decision.verdict} size="lg" />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Action Description</h3>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--bg-deep)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.98rem',
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
              <ScrambleText value={decision.amount} />
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
            <strong>Advisory `is_cleared`:</strong>
            <div className="font-mono" style={{ marginTop: '0.2rem', fontWeight: 700 }}>
              {clearedStatus ? (
                <span style={{ color: 'var(--allow)' }}>TRUE</span>
              ) : (
                <span style={{ color: 'var(--deny)' }}>FALSE</span>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--bg-deep)',
            paddingTop: '1rem',
            fontSize: '0.85rem',
            color: 'var(--ink-muted)',
          }}
        >
          Downstream consumer check (verify fields + `is_cleared`):
          <code
            className="font-mono"
            style={{
              display: 'block',
              margin: '0.5rem 0 0 0',
              padding: '0.5rem',
              background: 'var(--bg)',
              color: 'var(--ink)',
            }}
          >
            court.view().is_cleared("{decision.id}") -&gt; {String(clearedStatus)}
          </code>
        </div>
      </div>
    </div>
  );
};
