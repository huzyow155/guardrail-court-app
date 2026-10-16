import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import {
  isVaultExecuted,
  getVaultExecution,
  VAULT_ADDRESS,
  type VaultExecutionRecord,
} from '../services/contractClient';
import { vaultExecute } from '../services/contractWrite';
import { SectionHeading, RealTxTimer, ScrambleText } from '../hooks/useReveal';
import { triggerDotFieldRipple } from '../lib/dotfield';

export const VaultConsumer: React.FC = () => {
  const { isConnected, connectWallet, chainId, switchToStudionet } = useWallet();

  const [decisionId, setDecisionId] = useState<string>('1');
  const [policyId, setPolicyId] = useState<string>('1');
  const [category, setCategory] = useState<string>('server_ops');
  const [recipient, setRecipient] = useState<string>('0x1111111111111111111111111111111111111111');
  const [asset, setAsset] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('40');
  const [calldataHash, setCalldataHash] = useState<string>('a'.repeat(64));

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isExecuted, setIsExecuted] = useState<boolean | null>(null);
  const [execRecord, setExecRecord] = useState<VaultExecutionRecord | null>(null);

  const checkExecutionStatus = async (did: string) => {
    try {
      const executed = await isVaultExecuted(did);
      setIsExecuted(executed);
      if (executed) {
        const rec = await getVaultExecution(did);
        setExecRecord(rec);
      } else {
        setExecRecord(null);
      }
    } catch {
      setIsExecuted(null);
      setExecRecord(null);
    }
  };

  const handleExecute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setTxHash(null);

    if (!isConnected) {
      connectWallet();
      return;
    }

    if (chainId !== 61999) {
      await switchToStudionet();
    }

    setSubmitting(true);
    triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });

    try {
      await vaultExecute(
        decisionId,
        policyId,
        category,
        recipient,
        asset,
        amount,
        calldataHash,
        { onHash: (h) => setTxHash(h) }
      );
      setSuccessMsg(`Executed successfully: Decision #${decisionId}`);
      await checkExecutionStatus(decisionId);
      triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' });
    } catch (err: any) {
      console.error('Vault execution error:', err);
      setError(err?.friendlyMessage || err?.message || 'Execution failed');
      triggerDotFieldRipple({ element: e.currentTarget, verdict: 'DENY' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem 0', maxWidth: '760px', margin: '0 auto' }}>
      <SectionHeading text="Guarded Vault Consumer" as="h1" />

      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-header">
          <h3>GuardedVaultV2 Downstream Execution</h3>
          <span className="badge badge-source">Studionet 61999</span>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', margin: '0 0 1rem 0' }}>
          Demonstrates synchronous cross-contract clearance verification and replay rejection.
        </p>

        <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '1.25rem' }}>
          Vault Address: <ScrambleText value={VAULT_ADDRESS} />
        </div>

        <form onSubmit={handleExecute}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="vault-did" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                Decision ID
              </label>
              <input
                id="vault-did"
                type="text"
                required
                value={decisionId}
                onChange={(e) => {
                  setDecisionId(e.target.value);
                  checkExecutionStatus(e.target.value);
                }}
                className="font-mono"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label htmlFor="vault-pid" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                Policy ID
              </label>
              <input
                id="vault-pid"
                type="text"
                required
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="vault-cat" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                Category
              </label>
              <input
                id="vault-cat"
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label htmlFor="vault-asset" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                Asset
              </label>
              <input
                id="vault-asset"
                type="text"
                required
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="vault-rec" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
              Recipient Address
            </label>
            <input
              id="vault-rec"
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono"
              style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="vault-amt" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                Amount
              </label>
              <input
                id="vault-amt"
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label htmlFor="vault-cdh" style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                Calldata Hash
              </label>
              <input
                id="vault-cdh"
                type="text"
                required
                value={calldataHash}
                onChange={(e) => setCalldataHash(e.target.value)}
                className="font-mono"
                style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--ink)', background: 'var(--surface)', color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => checkExecutionStatus(decisionId)}
            >
              Query is_executed
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {submitting ? (
                <>
                  Executing on Vault <RealTxTimer active={submitting} />
                </>
              ) : (
                'Execute via GuardedVaultV2'
              )}
            </button>
          </div>

          {isExecuted !== null && (
            <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Execution status on Vault: <strong>{isExecuted ? 'EXECUTED' : 'NOT EXECUTED'}</strong>
            </div>
          )}

          {execRecord && (
            <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '4px', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
              <div>Caller: {execRecord.caller}</div>
              <div>Recipient: {execRecord.recipient}</div>
              <div>Amount: {execRecord.amount} {execRecord.asset}</div>
            </div>
          )}

          {txHash && (
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem' }}>
              Tx:{' '}
              <a
                href={`https://explorer-studio.genlayer.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-link"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--deny)', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.75rem' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ color: 'var(--allow)', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.75rem' }}>
              {successMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
