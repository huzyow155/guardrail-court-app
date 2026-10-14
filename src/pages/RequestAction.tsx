import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { getPolicy, getDecision, listDecisions, type PolicyRecord, type DecisionRecord } from '../services/contractClient';
import { requestAction } from '../services/contractWrite';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { SectionHeading, RealTxTimer, ScrambleText } from '../hooks/useReveal';
import { triggerDotFieldRipple } from '../lib/dotfield';

export const RequestAction: React.FC = () => {
  const { address, isConnected, connectWallet, chainId, switchToStudionet } = useWallet();

  const [policyId, setPolicyId] = useState<string>('1');
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);

  const [category, setCategory] = useState<string>('cloud_ops');
  const [amount, setAmount] = useState<string>('50');
  const [description, setDescription] = useState<string>('Cloud server compute instance allocation');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<DecisionRecord | null>(null);

  useEffect(() => {
    let active = true;
    getPolicy(policyId)
      .then((p) => {
        if (active) setPolicy(p);
      })
      .catch(() => {
        if (active) setPolicy(null);
      });
    return () => {
      active = false;
    };
  }, [policyId]);

  const isAgent = Boolean(
    policy && address && policy.agent.toLowerCase() === address.toLowerCase()
  );
  const isPaused = Boolean(policy?.paused);
  const canSubmit = isConnected && isAgent && !isPaused && !submitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setDecision(null);
    setTxHash(null);

    if (!isConnected || !address) {
      setError('Please connect your agent wallet.');
      return;
    }

    if (chainId !== 61999) {
      await switchToStudionet();
    }

    if (!isAgent) {
      setError('Connected wallet does not match registered policy agent.');
      return;
    }

    if (isPaused) {
      setError('Policy is paused. No new actions can be requested.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestAction(policyId, category, amount, description, {
        onHash: (h) => setTxHash(h),
      });

      let dec: DecisionRecord | null = null;
      if (res.returnValue) {
        try {
          dec = await getDecision(res.returnValue);
        } catch {}
      }

      if (!dec) {
        const recent = await listDecisions(policyId, 5);
        dec = recent.find((d) => d.category === category && d.amount === amount) || recent[0] || null;
      }

      setDecision(dec);
      triggerDotFieldRipple({
        element: e.currentTarget,
        verdict: dec?.verdict || 'NEUTRAL',
      });
    } catch (err: any) {
      console.error('Request action failed:', err);
      setError(err?.friendlyMessage || err?.message || 'Action request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '720px', margin: '0 auto' }}>
      <SectionHeading text="Agent Action Request" as="h1" />

      <div className="panel">
        <div className="panel-header">
          <h3>Request Clearance</h3>
          <span className="badge badge-source">Studionet 61999</span>
        </div>

        {/* Policy Selector Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>TARGET POLICY:</span>
          {['1', '2', '3', '4', '5'].map((pid) => (
            <button
              key={pid}
              type="button"
              className={`btn btn-sm ${policyId === pid ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPolicyId(pid)}
            >
              #{pid}
            </button>
          ))}
        </div>

        {policy && (
          <div style={{ background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <div>Agent: <ScrambleText value={policy.agent} /></div>
            <div style={{ color: policy.paused ? 'var(--deny)' : 'var(--allow)', marginTop: '0.2rem' }}>
              Status: {policy.paused ? 'PAUSED' : 'ACTIVE'} • Max: {policy.max_amount} • Cap: {policy.window_cap}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="req-cat" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Category (1-30 chars: a-z, 0-9, _, -)
            </label>
            <input
              id="req-cat"
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="font-mono"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
            />
          </div>

          <div style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="req-amount" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Amount (Integer)
            </label>
            <input
              id="req-amount"
              type="text"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
            />
          </div>

          <div style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="req-desc" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
              Description ({description.length} / 600 chars)
            </label>
            <textarea
              id="req-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          {!isConnected ? (
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : !isAgent ? (
            <div style={{ padding: '0.75rem', background: 'var(--surface-elevated)', border: '1px solid var(--escalate)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--escalate)' }}>
              Connected wallet is not authorized agent for Policy #{policyId}.
            </div>
          ) : isPaused ? (
            <div style={{ padding: '0.75rem', background: 'var(--surface-elevated)', border: '1px solid var(--deny)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--deny)' }}>
              Policy #{policyId} is currently paused by owner.
            </div>
          ) : (
            <button type="submit" disabled={!canSubmit} className="btn btn-primary" style={{ width: '100%' }}>
              {submitting ? (
                <>
                  Evaluating Clearance <RealTxTimer active={submitting} />
                </>
              ) : (
                'Request Clearance'
              )}
            </button>
          )}

          {txHash && (
            <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              Tx:{' '}
              <a
                href={`https://explorer-studio.genlayer.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono"
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
              {submitting && ' (Waiting for validators)'}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '1rem', color: 'var(--deny)', fontSize: '0.88rem', fontWeight: 600 }}>
              {error}
            </div>
          )}
        </form>

        {decision && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700 }}>Decision #{decision.id}</span>
              <SemaphoreSignal verdict={decision.verdict} size="sm" showLabel={true} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div>Verdict: <strong>{decision.verdict}</strong></div>
              <div>Source: <span className="badge badge-source">{decision.source}</span></div>
              <div>Status: <strong>{decision.status}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
