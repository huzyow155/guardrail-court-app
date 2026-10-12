import React, { useEffect, useState } from 'react';
import { SemaphoreSignal } from '../components/SemaphoreSignal';

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
  const [data, setData] = useState<EvidenceData | null>(null);
  const [filter, setFilter] = useState<'all' | 'JUDGE' | 'HARD_LIMIT' | 'VELOCITY' | 'Owner'>('all');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    fetch('/evidence.json')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load evidence.json:', err));
  }, []);

  if (!data) {
    return (
      <div className="panel" style={{ marginTop: '2rem' }}>
        <p>Loading verified on-chain evidence ledger...</p>
      </div>
    );
  }

  const filteredRuns =
    filter === 'all' ? data.runs : data.runs.filter((r) => r.source === filter);

  return (
    <div className="evidence-page" style={{ padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>On-Chain Verified Evidence Ledger</h2>
        <p style={{ color: 'var(--ink-body)', marginTop: '0.25rem' }}>
          Exact records and receipts executed and validated on GenLayer Studionet (Chain ID {data.chainId}).
        </p>
      </div>

      {/* Contract & Architecture Metadata */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <h3>Contract Identity & Deployment</h3>
          <span className="badge badge-source">GenLayer Studionet</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
          <div>
            <strong>Contract Address:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              <a
                href={`https://explorer-studio.genlayer.com/address/${data.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--ink-primary)' }}
              >
                {data.contractAddress}
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
                style={{ color: 'var(--ink-primary)' }}
              >
                {data.deployTxHash}
              </a>
            </div>
          </div>
          <div>
            <strong>Policy 1 Owner:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              {data.owner}
            </div>
          </div>
          <div>
            <strong>Policy 1 Agent:</strong>
            <div className="font-mono" style={{ wordBreak: 'break-all', marginTop: '0.2rem' }}>
              {data.agent}
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
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All Transactions (8)' : cat}
          </button>
        ))}
      </div>

      {/* Runs Table */}
      <div className="panel" style={{ padding: 0 }}>
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
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>
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
                          <span style={{ color: 'var(--signal-allow)', fontWeight: 700 }}>TRUE</span>
                        ) : (
                          <span style={{ color: 'var(--signal-deny)', fontWeight: 700 }}>FALSE</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setExpandedRun(isExpanded ? null : r.key)}
                        >
                          {isExpanded ? 'Hide' : 'Receipt'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ backgroundColor: 'var(--bg-surface-subtle)', padding: '1rem' }}>
                          <div style={{ fontSize: '0.85rem' }}>
                            <strong>Transaction Hash:</strong>
                            <div className="font-mono" style={{ wordBreak: 'break-all', margin: '0.25rem 0' }}>
                              <a
                                href={`https://explorer-studio.genlayer.com/tx/${r.txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--ink-primary)' }}
                              >
                                {r.txHash}
                              </a>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                              <div><strong>Decision ID:</strong> <span className="font-mono">{r.decisionId}</span></div>
                              <div><strong>Final Status:</strong> <span className="font-mono">{r.status}</span></div>
                              <div><strong>Measured Latency:</strong> <span className="font-mono">{r.latencySec}s</span></div>
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
      </div>
    </div>
  );
};
