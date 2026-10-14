import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { SectionHeading, RealTxTimer } from '../hooks/useReveal';
import { triggerDotFieldRipple } from '../lib/dotfield';
import { createPolicy } from '../services/contractWrite';

export const CreatePolicy: React.FC = () => {
  const { address, isConnected, connectWallet, chainId, switchToStudionet } = useWallet();

  const [agentAddress, setAgentAddress] = useState<string>('');
  const [policyText, setPolicyText] = useState<string>(
    'The agent may purchase dev infrastructure and tools. Prohibit gifts and tokens. Ambiguous requests escalate.'
  );
  const [maxAmount, setMaxAmount] = useState<string>('100');
  const [windowCap, setWindowCap] = useState<string>('400');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [createdPolicyId, setCreatedPolicyId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setCreatedPolicyId(null);
    triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' });

    if (!window.ethereum || !address) {
      setError('Please connect your wallet prior to submitting.');
      return;
    }

    if (chainId !== 61999) {
      await switchToStudionet();
    }

    if (policyText.length < 30 || policyText.length > 1200) {
      setError('Policy text must be between 30 and 1200 characters.');
      return;
    }

    if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
      setError('Invalid agent address format (must be 0x followed by 40 hex chars).');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createPolicy(agentAddress, policyText, maxAmount, windowCap);
      setTxHash(result.hash);
      setCreatedPolicyId(result.returnValue || 'Success');
    } catch (err: any) {
      console.error('Create policy error:', err);
      setError(err?.message || 'Transaction submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '720px', margin: '0 auto' }}>
      <SectionHeading text="Create New Intelligent Policy" as="h1" />

      <div className="panel">
        <div className="panel-header">
          <h3>Policy Registration</h3>
          <span className="badge badge-source">Studionet 61999</span>
        </div>

        {!isConnected ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--ink)' }}>
              Connect your Web3 wallet to register a new policy as Owner.
            </p>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });
                connectWallet();
              }}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="owner-addr" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Owner Address (Connected)
              </label>
              <input
                id="owner-addr"
                type="text"
                readOnly
                value={address || ''}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--ink)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label htmlFor="agent-addr" style={{ fontWeight: 600 }}>
                  Authorized Agent Address
                </label>
                {address && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    onClick={() => setAgentAddress(address)}
                  >
                    Use Connected
                  </button>
                )}
              </div>
              <input
                id="agent-addr"
                type="text"
                required
                placeholder="0x..."
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--ink)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Permitted to call `request_action` under this policy.
              </span>
            </div>

            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="policy-text" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Natural-Language Policy Text ({policyText.length} / 1200 chars)
              </label>
              <textarea
                id="policy-text"
                required
                rows={4}
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--ink)',
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Minimum 30 characters.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label htmlFor="max-amount" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Max Amount (Per-action cap)
                </label>
                <input
                  id="max-amount"
                  type="text"
                  required
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="font-mono"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '1px solid var(--ink)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>"0" disables cap.</span>
              </div>

              <div>
                <label htmlFor="window-cap" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Window Cap (Velocity)
                </label>
                <input
                  id="window-cap"
                  type="text"
                  required
                  value={windowCap}
                  onChange={(e) => setWindowCap(e.target.value)}
                  className="font-mono"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '1px solid var(--ink)',
                    background: 'var(--surface)',
                    color: 'var(--ink)',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>"0" disables cap.</span>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '1rem', color: 'var(--deny)', fontSize: '0.9rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {submitting ? (
                <>
                  Awaiting Validator Consensus <RealTxTimer active={submitting} />
                </>
              ) : (
                'Deploy Policy on Studionet'
              )}
            </button>

            {createdPolicyId && (
              <div
                className="panel"
                style={{
                  marginTop: '1.25rem',
                  borderColor: 'var(--allow)',
                  background: 'rgba(52, 211, 153, 0.05)',
                }}
              >
                <div style={{ color: 'var(--allow)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Policy #{createdPolicyId} Deployed
                </div>
                {txHash && (
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
                    Tx:{' '}
                    <a
                      href={`https://explorer-studio.genlayer.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-link"
                    >
                      {txHash}
                    </a>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to={`/app/request?policyId=${createdPolicyId}`} className="btn btn-sm btn-allow">
                    Request Action Now
                  </Link>
                  <Link to={`/app/policy/${createdPolicyId}`} className="btn btn-sm btn-secondary">
                    View in Explorer
                  </Link>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
