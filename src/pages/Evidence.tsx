import React, { useEffect, useState } from 'react';
import initialEvidenceV2 from '../../public/evidence_v2.json';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { SectionHeading } from '../hooks/useReveal';
import { triggerDotFieldRipple, type RippleVerdict } from '../lib/dotfield';

interface EvidenceCase {
  id: string;
  title: string;
  txHash?: string;
  latencySec?: number;
  decisionId?: string;
  policyId?: string;
  category?: string;
  amount?: string;
  asset?: string;
  recipient?: string;
  verdict?: string;
  source?: string;
  status?: string;
  actionHash?: string;
  isClearedForExact?: boolean;
  subcaseB?: any;
  pauseTx?: string;
  unpauseTx?: string;
  pauseLatencySec?: number;
  unpauseLatencySec?: number;
  executeTx?: string;
  replayReverted?: boolean;
  replayError?: string;
  forgeryReverted?: boolean;
  forgeryError?: string;
  testedMalformedVectors?: number;
  rejectedToEscalate?: number;
  failClosedRatePercent?: number;
  checkedVectors?: string[];
  revertRatePercent?: number;
  adminWritesMeanSec?: number;
  guardOnlyMeanSec?: number;
  judgedMeanSec?: number;
  policies?: any;
}

interface EvidenceMatrixRow {
  caseId: string;
  name: string;
  expectedVerdict: string;
  actualVerdict: string;
  expectedSource: string;
  actualSource: string;
  match: boolean;
}

interface EvidenceV2Data {
  schema_version: string;
  network: string;
  chainId: number;
  contracts: {
    active: {
      court: { name: string; address: string; deployTx: string; sha256: string; status: string };
      vault: { name: string; address: string; deployTx: string; sha256: string; status: string };
    };
    superseded: {
      court: { name: string; address: string; status: string; reason: string };
      vault: { name: string; address: string; status: string; reason: string };
    };
  };
  findings: {
    modelEscalationRate: { policy1: string; policy2: string; interpretation: string };
    latencyByLayer: {
      adminWritesMeanSec: number;
      guardOnlyMeanSec: number;
      judgedMinSec: number;
      judgedMaxSec: number;
      judgedMeanSec: number;
    };
    velocityProof: {
      liveProven: boolean;
      case: string;
      txHash: string;
      durSec: number;
      source: string;
      note: string;
    };
  };
  cases: EvidenceCase[];
  matrix: EvidenceMatrixRow[];
}

export const Evidence: React.FC = () => {
  const [data, setData] = useState<EvidenceV2Data | null>(initialEvidenceV2 as EvidenceV2Data);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'JUDGE' | 'HARD_LIMIT' | 'VELOCITY' | 'RECIPIENT_GUARD' | 'ASSET_GUARD'>('all');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location?.origin?.startsWith('http')) return;
    fetch(`${window.location.origin}/evidence_v2.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => {
        if (!initialEvidenceV2) {
          setError(err?.message || 'Failed to load evidence ledger');
        }
      });
  }, []);

  if (error) {
    return (
      <div className="panel" style={{ marginTop: '2rem', borderColor: 'var(--deny)' }}>
        <p style={{ color: 'var(--deny)', fontWeight: 600 }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel" style={{ marginTop: '2rem' }}>
        <p>Loading verified on-chain evidence ledger...</p>
      </div>
    );
  }

  const filteredCases =
    filter === 'all'
      ? data.cases
      : data.cases.filter((c) => c.source === filter || c.subcaseB?.source === filter);

  const toRippleVerdict = (v?: string): RippleVerdict => {
    if (v === 'ALLOW') return 'ALLOW';
    if (v === 'DENY') return 'DENY';
    if (v === 'ESCALATE') return 'ESCALATE';
    return 'NEUTRAL';
  };

  return (
    <div className="evidence-page" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHeading text="On-Chain Verified Evidence Ledger (V2)" as="h1" />
        <p style={{ color: 'var(--ink-muted)' }}>
          Raw execution receipts recorded on GenLayer Studionet (Chain ID {data.chainId}).
        </p>
      </div>

      {/* Active Contract Identity & Deployments */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <h2 style={{ fontSize: '1.15rem' }}>Active V2 Contracts</h2>
          <span className="badge badge-source">Studionet {data.chainId}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{data.contracts.active.court.name}</div>
            <div className="font-mono" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>
              <a
                href={`https://explorer-studio.genlayer.com/address/${data.contracts.active.court.address}`}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                {data.contracts.active.court.address}
              </a>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Deploy Tx:{' '}
              <a
                href={`https://explorer-studio.genlayer.com/tx/${data.contracts.active.court.deployTx}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-link"
              >
                {data.contracts.active.court.deployTx.slice(0, 10)}...{data.contracts.active.court.deployTx.slice(-8)}
              </a>
            </div>
            <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              SHA256: {data.contracts.active.court.sha256}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{data.contracts.active.vault.name}</div>
            <div className="font-mono" style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>
              <a
                href={`https://explorer-studio.genlayer.com/address/${data.contracts.active.vault.address}`}
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                {data.contracts.active.vault.address}
              </a>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              Deploy Tx:{' '}
              <a
                href={`https://explorer-studio.genlayer.com/tx/${data.contracts.active.vault.deployTx}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-link"
              >
                {data.contracts.active.vault.deployTx.slice(0, 10)}...{data.contracts.active.vault.deployTx.slice(-8)}
              </a>
            </div>
            <div className="font-mono" style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
              SHA256: {data.contracts.active.vault.sha256}
            </div>
          </div>
        </div>

        {/* Superseded v1 Contracts Block */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>
            Superseded Legacy Deployments (v1 - Read Only)
          </div>
          <div>
            Court v1: <span className="font-mono">{data.contracts.superseded.court.address}</span> • Vault v1: <span className="font-mono">{data.contracts.superseded.vault.address}</span>
          </div>
          <div style={{ marginTop: '0.2rem' }}>
            Reason: {data.contracts.superseded.court.reason}
          </div>
        </div>
      </div>

      {/* Honest Operational Findings */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <h2 style={{ fontSize: '1.15rem' }}>Live Empirical Findings</h2>
          <span className="badge badge-source">Recorded Evidence</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 700, color: 'var(--escalate)' }}>Model Escalation Tendency</div>
            <div style={{ marginTop: '0.35rem' }}>• Policy 1: {data.findings.modelEscalationRate.policy1}</div>
            <div>• Policy 2: {data.findings.modelEscalationRate.policy2}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              {data.findings.modelEscalationRate.interpretation}
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 700, color: 'var(--allow)' }}>Latency By Layer</div>
            <div style={{ marginTop: '0.35rem' }}>• Pure Deterministic: ~{data.findings.latencyByLayer.guardOnlyMeanSec}s</div>
            <div>• Admin Operations: ~{data.findings.latencyByLayer.adminWritesMeanSec}s</div>
            <div>• LLM Consensus: {data.findings.latencyByLayer.judgedMinSec}s - {data.findings.latencyByLayer.judgedMaxSec}s</div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 700, color: 'var(--deny)' }}>Velocity Guard Evidence</div>
            <div style={{ marginTop: '0.35rem' }}>• Live Proof: {data.findings.velocityProof.case} ({data.findings.velocityProof.durSec}s)</div>
            <div className="font-mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
              Tx: {data.findings.velocityProof.txHash.slice(0, 10)}...{data.findings.velocityProof.txHash.slice(-8)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              {data.findings.velocityProof.note}
            </div>
          </div>
        </div>
      </div>

      {/* Case Ledger */}
      <div className="panel" style={{ marginBottom: '1.5rem', padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.15rem' }}>Verified Cases (1-12 & 4b)</h2>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {(['all', 'JUDGE', 'HARD_LIMIT', 'VELOCITY', 'RECIPIENT_GUARD', 'ASSET_GUARD'] as const).map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                onClick={(e) => {
                  setFilter(s);
                  triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Verdict</th>
                <th>Source</th>
                <th>Latency</th>
                <th>Tx Hash</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => {
                const tx = c.txHash || c.pauseTx || c.executeTx;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>
                      {c.verdict ? (
                        <SemaphoreSignal verdict={c.verdict as any} size="sm" showLabel={true} />
                      ) : (
                        <span className="font-mono">-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-source">{c.source || 'SYSTEM'}</span>
                    </td>
                    <td className="font-mono">
                      {c.latencySec ? `${c.latencySec}s` : c.pauseLatencySec ? `${c.pauseLatencySec}s` : '-'}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                      {tx ? (
                        <a
                          href={`https://explorer-studio.genlayer.com/tx/${tx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-link"
                          onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: toRippleVerdict(c.verdict) })}
                        >
                          {tx.slice(0, 10)}...{tx.slice(-8)}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${c.status === 'CLEARED' ? 'badge-status-cleared' : c.status === 'DENIED' ? 'badge-status-denied' : 'badge-status-pending'}`}>
                        {c.status || (c.replayReverted ? 'REVERTED' : 'RECORDED')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.15rem' }}>Expected vs Actual Matrix</h2>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Scenario</th>
                <th>Expected Verdict</th>
                <th>Actual Verdict</th>
                <th>Expected Source</th>
                <th>Actual Source</th>
                <th>Match</th>
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((m) => (
                <tr key={m.caseId}>
                  <td className="font-mono">#{m.caseId}</td>
                  <td>{m.name}</td>
                  <td className="font-mono">{m.expectedVerdict}</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>{m.actualVerdict}</td>
                  <td className="font-mono">{m.expectedSource}</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>{m.actualSource}</td>
                  <td style={{ color: m.match ? 'var(--allow)' : 'var(--deny)', fontWeight: 700 }}>
                    {m.match ? 'MATCH' : 'DIVERGED'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
