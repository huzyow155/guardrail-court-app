import React from 'react';
import { Link } from 'react-router-dom';
import evidenceData from '../../public/evidence.json';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { Odometer } from '../components/Odometer';
import { WordMaskHeading, SectionHeading, ScrambleText } from '../hooks/useReveal';
import { triggerDotFieldRipple } from '../lib/dotfield';

export const Landing: React.FC = () => {
  const { statsSummary, contractAddress, chainId } = evidenceData;

  return (
    <div className="landing-page">
      {/* 1. HERO SECTION */}
      <section id="hero" className="landing-section">
        <div className="panel" style={{ maxWidth: '820px', padding: '2.5rem' }}>
          <div
            className="badge font-mono"
            style={{ marginBottom: '1.25rem', color: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            STUDIONET CHAIN ID {chainId} • ADVISORY POLICY GATE
          </div>

          <WordMaskHeading
            text="Guardrail Court"
            stepMs={50}
            style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', lineHeight: 1.08, marginBottom: '1.25rem' }}
          />

          <p style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '1.75rem', maxWidth: '64ch' }}>
            Deterministic spending guards and multi-validator consensus evaluate autonomous AI agent actions against plain-language owner policies before execution.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/app"
              className="btn btn-primary"
              onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' })}
            >
              Open app
            </Link>
            <Link
              to="/evidence"
              className="btn btn-secondary"
              onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
            >
              Read evidence
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THREE PROTECTION LAYERS: HARD_LIMIT -> VELOCITY -> JUDGE */}
      <section id="guards" className="landing-section">
        <SectionHeading text="Three Protection Layers" rippleVerdict="ALLOW" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div className="panel" style={{ margin: 0, borderTop: '4px solid var(--deny)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge font-mono">1. HARD_LIMIT</span>
              <SemaphoreSignal verdict="DENY" size="sm" />
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
              Deterministic pre-check rejects any action where amount exceeds policy max_amount without calling validator models.
            </p>
          </div>

          <div className="panel" style={{ margin: 0, borderTop: '4px solid var(--escalate)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge font-mono">2. VELOCITY</span>
              <SemaphoreSignal verdict="ESCALATE" size="sm" />
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
              Reads the 15 newest policy decisions, filters by category, takes up to 10, and escalates when cleared sum plus amount exceeds window_cap.
            </p>
          </div>

          <div className="panel" style={{ margin: 0, borderTop: '4px solid var(--allow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge font-mono">3. JUDGE</span>
              <SemaphoreSignal verdict="ALLOW" size="sm" />
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>
              Multi-validator LLM evaluation under gl.eq_principle.strict_eq returns ALLOW, DENY, or ESCALATE to the owner inbox.
            </p>
          </div>
        </div>
      </section>

      {/* 3. MEASURED ON-CHAIN METRICS */}
      <section id="metrics" className="landing-section">
        <SectionHeading text="Measured On-Chain Latency" rippleVerdict="NEUTRAL" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="panel" style={{ margin: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
              JUDGE Consensus (n={statsSummary.llmDecisionsCount})
            </div>
            <div style={{ fontSize: '2.2rem', color: 'var(--ink)', margin: '0.35rem 0' }}>
              <Odometer value={statsSummary.llmDecisionsMeanLatencySec} duration={750} suffix="s" />
            </div>
            <div className="font-mono" style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
              Range: {statsSummary.llmDecisionsMinLatencySec.toFixed(1)}–{statsSummary.llmDecisionsMaxLatencySec.toFixed(1)} s mean
            </div>
          </div>

          <div className="panel" style={{ margin: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
              Deterministic Guards (n=2)
            </div>
            <div style={{ fontSize: '2.2rem', color: 'var(--ink)', margin: '0.35rem 0' }}>
              <Odometer value={statsSummary.deterministicGuardSummarySec} duration={650} suffix="s" />
            </div>
            <div className="font-mono" style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
              HARD_LIMIT 5.26s • VELOCITY 5.31s
            </div>
          </div>

          <div className="panel" style={{ margin: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
              Reference Decisions
            </div>
            <div style={{ fontSize: '2.2rem', color: 'var(--ink)', margin: '0.35rem 0' }}>
              <Odometer value={statsSummary.totalDecisions} duration={600} />
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <Link to="/evidence" className="btn btn-sm btn-secondary">
                Inspect /evidence →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HONEST LIMITATIONS */}
      <section id="limits" className="landing-section">
        <SectionHeading text="Known Contract Boundaries" rippleVerdict="ESCALATE" />

        <div className="panel" style={{ margin: 0 }}>
          <ul style={{ listStyle: 'none', display: 'grid', gap: '1.1rem' }}>
            <li style={{ borderLeft: '3px solid var(--deny)', paddingLeft: '1rem' }}>
              <strong>Parser Fallback Substring Match:</strong>{' '}
              <span>
                In the immutable deployed contract, non-JSON prose containing the substring{' '}
                <code className="font-mono">"verdict": "ALLOW"</code> matches the fallback branch and returns{' '}
                <code className="font-mono">ALLOW</code>.
              </span>
            </li>
            <li style={{ borderLeft: '3px solid var(--escalate)', paddingLeft: '1rem' }}>
              <strong>15-Decision Policy Slice (No Time Dimension):</strong>{' '}
              <span>
                Velocity inspects the 15 most recent decisions of the policy, filters by category, takes at most 10, and sums cleared amounts without time windows.
              </span>
            </li>
            <li style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
              <strong>Advisory Clearance Flag:</strong>{' '}
              <span>
                <code className="font-mono">is_cleared(decision_id)</code> is an advisory boolean; downstream contracts must verify decision fields and caller permissions.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* 5. FINAL CTA & CONTRACT IDENTITY */}
      <section id="cta" className="landing-section">
        <div className="panel-dark">
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.85rem' }}>Inspect Live Studionet State</h2>
          <p style={{ marginBottom: '1rem', fontSize: '0.98rem', opacity: 0.92 }}>
            Deployed Contract:{' '}
            <ScrambleText value={contractAddress} className="font-mono" />
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            <Link to="/app" className="btn btn-secondary">
              Launch Court Explorer
            </Link>
            <Link to="/evidence" className="btn btn-secondary">
              Verified Receipts
            </Link>
            <a
              href="https://github.com/huzyow155/guardrail-court-genlayer"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Contract GitHub
            </a>
            <a
              href="https://github.com/huzyow155/guardrail-court-app"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              dApp GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
