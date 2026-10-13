import React, { useEffect, useState } from 'react';
import initialEvidenceData from '../../public/evidence.json';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { SectionHeading, ScrambleText } from '../hooks/useReveal';
import { triggerDotFieldRipple, type RippleVerdict } from '../lib/dotfield';

interface EvidenceRun {
  key: string;
  label: string;
  category: string;
  amount: string;
  description: string;
  verdict: string;
  source: string;
  status: string;
  latencySec: number;
  txHash: string;
  isCleared: boolean;
  decisionId: string;
}

interface EvidenceData {
  contractAddress: string;
  deployTxHash: string;
  chainId: number;
  network: string;
  owner: string;
  agent: string;
  runs: EvidenceRun[];
  statsSummary: {
    totalDecisions: number;
    llmDecisionsMeanLatencySec: number;
    deterministicMeanLatencySec: number;
    failClosedRatePercent: number;
  };
}

export const Evidence: React.FC = () => {
  const [data, setData] = useState<EvidenceData | null>(initialEvidenceData as EvidenceData);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'JUDGE' | 'HARD_LIMIT' | 'VELOCITY' | 'Owner'>('all');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location?.origin?.startsWith('http')) return;
    fetch(`${window.location.origin}/evidence.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => {
        if (!initialEvidenceData) {
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

  const filteredRuns =
    filter === 'all' ? data.runs : data.runs.filter((r) => r.source === filter);

  const toRippleVerdict = (v: string): RippleVerdict => {
    if (v === 'ALLOW') return 'ALLOW';
    if (v === 'DENY') return 'DENY';
    if (v === 'ESCALATE') return 'ESCALATE';
    return 'NEUTRAL';
  };

  return (
    <div className="evidence-page" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHeading text="On-Chain Verified Evidence Ledger" as="h1" />
        <p style={{ color: 'var(--ink-muted)' }}>
          Receipts and latencies executed on GenLayer Studionet (Chain ID {data.chainId}).
        </p>
      </div>

      {/* Contract & Architecture Metadata */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <h2 style={{ fontSize: '1.15rem' }}>Contract Identity & Deployment</h2>
          <span className="badge badge-source">Studionet {data.chainId}</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            fontSize: '0.88rem',
          }}
        >
          <div>
            <strong>Contract Address:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              <a
                href={`https://explorer-studio.genlayer.com/address/${data.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                <ScrambleText value={data.contractAddress} />
              </a>
            </div>
          </div>
          <div>
            <strong>Deploy Transaction:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              <a
                href={`https://explorer-studio.genlayer.com/tx/${data.deployTxHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                <ScrambleText value={data.deployTxHash} />
              </a>
            </div>
          </div>
          <div>
            <strong>Policy 1 Owner:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              <ScrambleText value={data.owner} />
            </div>
          </div>
          <div>
            <strong>Policy 1 Agent:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              <ScrambleText value={data.agent} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['all', 'JUDGE', 'HARD_LIMIT', 'VELOCITY', 'Owner'] as const).map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={(e) => {
              setFilter(cat);
              triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' });
            }}
          >
            {cat === 'all' ? `All (${data.runs.length})` : cat}
          </button>
        ))}
      </div>

      {/* Runs Table */}
      <div className="panel" style={{ padding: 0 }}>
        {filteredRuns.length === 0 ? (
          <div style={{ padding: '1.5rem', color: 'var(--ink-muted)' }}>
            No reference transactions match filter "{filter}".
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Scenario & Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Verdict</th>
                  <th>Source</th>
                  <th>Latency</th>
                  <th>Cleared</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((r) => {
                  const isExpanded = expandedRun === r.key;
                  return (
                    <React.Fragment key={r.key}>
                      <tr>
                        <td className="font-mono" style={{ fontWeight: 700 }}>
                          ({r.key})
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.label}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>
                            "{r.description}"
                          </div>
                        </td>
                        <td className="font-mono">{r.category}</td>
                        <td className="font-mono">{r.amount}</td>
                        <td>
                          <SemaphoreSignal verdict={r.verdict} size="sm" />
                        </td>
                        <td>
                          <span className="badge badge-source">{r.source}</span>
                        </td>
                        <td className="font-mono">{r.latencySec}s</td>
                        <td className="font-mono">
                          {r.isCleared ? (
                            <span style={{ color: 'var(--allow)', fontWeight: 700 }}>TRUE</span>
                          ) : (
                            <span style={{ color: 'var(--deny)', fontWeight: 700 }}>FALSE</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              setExpandedRun(isExpanded ? null : r.key);
                              triggerDotFieldRipple({
                                element: e.currentTarget,
                                verdict: toRippleVerdict(r.verdict),
                              });
                            }}
                          >
                            {isExpanded ? 'Hide' : 'Receipt'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ backgroundColor: 'var(--bg)', padding: '1rem' }}>
                            <div style={{ fontSize: '0.85rem' }}>
                              <strong>Transaction Hash:</strong>
                              <div className="font-mono" style={{ wordBreak: 'break-all', margin: '0.25rem 0' }}>
                                <a
                                  href={`https://explorer-studio.genlayer.com/tx/${r.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--accent)' }}
                                >
                                  {r.txHash}
                                </a>
                              </div>
                              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                <div>
                                  <strong>Decision ID:</strong> <span className="font-mono">{r.decisionId}</span>
                                </div>
                                <div>
                                  <strong>Status:</strong> <span className="font-mono">{r.status}</span>
                                </div>
                                <div>
                                  <strong>Latency:</strong> <span className="font-mono">{r.latencySec}s</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
