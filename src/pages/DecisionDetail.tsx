import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getDecision,
  isClearedFor,
  type DecisionRecord,
} from '../services/contractClient';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { SectionHeading, ScrambleText } from '../hooks/useReveal';

export const DecisionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verification state (6 action parameters)
  const [vPolicyId, setVPolicyId] = useState<string>('');
  const [vCategory, setVCategory] = useState<string>('');
  const [vRecipient, setVRecipient] = useState<string>('');
  const [vAsset, setVAsset] = useState<string>('');
  const [vAmount, setVAmount] = useState<string>('');
  const [vCalldataHash, setVCalldataHash] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [clearanceResult, setClearanceResult] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getDecision(id)
      .then((dec) => {
        setDecision(dec);
        setVPolicyId(dec.policy_id);
        setVCategory(dec.category);
        setVRecipient(dec.recipient);
        setVAsset(dec.asset);
        setVAmount(dec.amount);
        setVCalldataHash(dec.calldata_hash);
        // Initial automatic check
        isClearedFor(
          dec.id,
          dec.policy_id,
          dec.category,
          dec.recipient,
          dec.asset,
          dec.amount,
          dec.calldata_hash
        ).then((res) => setClearanceResult(res)).catch(() => {});
      })
      .catch((err) => {
        console.error('Failed to load decision:', err);
        setError(err?.message || 'Error fetching decision from contract');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setVerifying(true);
    try {
      const res = await isClearedFor(
        id,
        vPolicyId,
        vCategory,
        vRecipient,
        vAsset,
        vAmount,
        vCalldataHash
      );
      setClearanceResult(res);
    } catch (err: any) {
      console.error('Clearance check error:', err);
      setClearanceResult(false);
    } finally {
      setVerifying(false);
    }
  };

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
    <div className="decision-detail" style={{ padding: '2rem 0', maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to={`/app/policy/${decision.policy_id}`} className="btn btn-sm btn-secondary">
          ← Policy #{decision.policy_id}
        </Link>
        <span className="badge badge-source">Schema v{decision.schema_version}</span>
      </div>

      <SectionHeading text={`Decision #${decision.id}`} as="h1" />

      {/* Decision Summary Panel */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
            Policy #<ScrambleText value={decision.policy_id} /> • Sequence #<ScrambleText value={decision.seq} />
          </div>
          <SemaphoreSignal verdict={decision.verdict} size="lg" />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.92rem' }}>Agent Justification</h3>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
            }}
          >
            "{decision.justification}"
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <strong>Category:</strong>
            <div className="font-mono">{decision.category}</div>
          </div>
          <div>
            <strong>Amount:</strong>
            <div className="font-mono">{decision.amount} {decision.asset}</div>
          </div>
          <div>
            <strong>Source:</strong>
            <div><span className="badge badge-source">{decision.source}</span></div>
          </div>
          <div>
            <strong>Status:</strong>
            <div><span className={`badge ${decision.status === 'CLEARED' ? 'badge-status-cleared' : decision.status === 'DENIED' ? 'badge-status-denied' : 'badge-status-pending'}`}>{decision.status}</span></div>
          </div>
          <div>
            <strong>Recipient:</strong>
            <div className="font-mono" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{decision.recipient}</div>
          </div>
          <div>
            <strong>Resolved by Owner:</strong>
            <div className="font-mono">{decision.resolved_by_owner ? 'TRUE' : 'FALSE'}</div>
          </div>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '4px', fontSize: '0.78rem', border: '1px solid var(--border)' }}>
          <div>Stored Action Hash (SHA-256):</div>
          <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>{decision.action_hash}</div>
        </div>
      </div>

      {/* Action-Bound Clearance Verification Box */}
      <div className="panel" style={{ borderColor: 'var(--accent)' }}>
        <div className="panel-header">
          <h3>Verify Clearance (Action-Bound Gate)</h3>
          <span className="badge badge-source">is_cleared_for</span>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
          Test action-bound clearance: modifying any field fails verification immediately.
        </p>

        <form onSubmit={handleVerify}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label htmlFor="v-pid" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Policy ID</label>
              <input
                id="v-pid"
                type="text"
                value={vPolicyId}
                onChange={(e) => setVPolicyId(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label htmlFor="v-cat" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
              <input
                id="v-cat"
                type="text"
                value={vCategory}
                onChange={(e) => setVCategory(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label htmlFor="v-rec" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Recipient</label>
              <input
                id="v-rec"
                type="text"
                value={vRecipient}
                onChange={(e) => setVRecipient(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label htmlFor="v-ast" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Asset</label>
              <input
                id="v-ast"
                type="text"
                value={vAsset}
                onChange={(e) => setVAsset(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label htmlFor="v-amt" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Amount</label>
              <input
                id="v-amt"
                type="text"
                value={vAmount}
                onChange={(e) => setVAmount(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="v-cdh" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600 }}>Calldata Hash</label>
            <input
              id="v-cdh"
              type="text"
              value={vCalldataHash}
              onChange={(e) => setVCalldataHash(e.target.value)}
              className="font-mono"
              style={{ width: '100%', padding: '0.45rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={verifying}
              className="btn btn-primary btn-sm"
            >
              {verifying ? 'Querying is_cleared_for...' : 'Call is_cleared_for on-chain'}
            </button>

            {clearanceResult !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>Contract Verification:</span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: clearanceResult ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: clearanceResult ? 'var(--allow)' : 'var(--deny)',
                  }}
                >
                  {clearanceResult ? 'TRUE (CLEARED)' : 'FALSE (MISMATCH / NOT CLEARED)'}
                </span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
