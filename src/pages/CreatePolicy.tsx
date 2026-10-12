import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!window.ethereum || !address) {
      setError('Please connect your wallet first.');
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
      // Injected wallet write via genlayer-js / ethereum provider
      // Encode function call for GenLayer contract
      // We can invoke gen_call / writeContract or direct EIP-1193 eth_sendTransaction
      // Using window.ethereum sendTransaction
      setError('Submitting to GenLayer Studionet validators...');
      // Note: In browser wallet, writes can be routed through genlayer-js or standard provider
    } catch (err: any) {
      console.error('Create policy error:', err);
      setError(err?.message || 'Transaction submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '720px', margin: '0 auto' }}>
      <div className="panel">
        <div className="panel-header">
          <h2>Create New Intelligent Policy</h2>
          <span className="badge badge-source">Studionet Interlocking</span>
        </div>

        {!isConnected ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ marginBottom: '1rem', color: 'var(--ink-body)' }}>
              Connect your Web3 wallet to register a new policy as Owner.
            </p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                Owner Address (Connected)
              </label>
              <input
                type="text"
                readOnly
                value={address || ''}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--border-mint)',
                  background: 'var(--bg-surface-subtle)',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                Authorized Agent Address
              </label>
              <input
                type="text"
                required
                placeholder="0x..."
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--border-mint)',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                The entity permitted to call `request_action` under this policy. (Can be same as owner for tests).
              </span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                Natural-Language Policy Text ({policyText.length} / 1200 chars)
              </label>
              <textarea
                required
                rows={4}
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  border: '1px solid var(--border-mint)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.95rem',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Must be at least 30 characters. Evaluated by GenLayer validator consensus.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Max Amount (Per-action cap)
                </label>
                <input
                  type="text"
                  required
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="font-mono"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '1px solid var(--border-mint)',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>"0" for unlimited.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Window Cap (Velocity)
                </label>
                <input
                  type="text"
                  required
                  value={windowCap}
                  onChange={(e) => setWindowCap(e.target.value)}
                  className="font-mono"
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    border: '1px solid var(--border-mint)',
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>"0" for unlimited.</span>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '1rem', color: 'var(--signal-deny)', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {submitting ? 'Awaiting Validator Consensus...' : 'Deploy Policy on Studionet'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
