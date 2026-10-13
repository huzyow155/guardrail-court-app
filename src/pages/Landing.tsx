import React from 'react';
import { Link } from 'react-router-dom';
import { triggerDotFieldRipple } from '../lib/dotfield';

export const Landing: React.FC = () => {
  return (
    <div className="landing-wrap">
      {/* 1. Hero Section (<= 20 words) */}
      <section className="hero-section">
        <div className="hero-copy">
          <div
            className="badge appear appear--pop"
            style={{ '--d': '.18s' } as React.CSSProperties}
          >
            <svg
              className="badge-star"
              viewBox="0 0 24 24"
              fill="white"
              aria-hidden="true"
            >
              <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
            </svg>
            <span>On-Chain Risk Gate</span>
          </div>

          <h1 className="appear appear--mask" style={{ '--d': '.32s' } as React.CSSProperties}>
            Autonomous Agent <em>Policy Gate</em>
          </h1>

          <p className="lede appear appear--soft" style={{ '--d': '.48s' } as React.CSSProperties}>
            Multi-validator clearance protocol for autonomous AI agents.
          </p>

          <div
            className="hero-actions appear appear--btn"
            style={{ '--d': '.64s' } as React.CSSProperties}
          >
            <Link
              to="/app"
              className="btn btn-solid"
              onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' })}
            >
              Open App
            </Link>
            <Link
              to="/app/evidence"
              className="btn btn-ghost"
              onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
            >
              Evidence
            </Link>
          </div>
        </div>

        {/* Real Metrics Bar */}
        <div
          className="stats appear appear--stat"
          style={{ '--d': '.80s' } as React.CSSProperties}
        >
          <div className="stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-mono">19.02s mean latency</span>
          </div>
          <div className="stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>3 defensive layers</span>
          </div>
          <div className="stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="font-mono">29 on-chain receipts</span>
          </div>
        </div>
      </section>

      {/* 2. Protection Layers Section */}
      <section className="landing-section">
        <div className="app-container">
          <div className="section-head">
            <h2>Three Protection Layers</h2>
            <p>Deterministic bounds reject spikes before validators arbitrate qualitative intent.</p>
          </div>

          <div className="layers-grid">
            <div className="layer-card">
              <span className="layer-card-tag" style={{ color: 'var(--deny)', background: 'rgba(248,113,113,0.1)' }}>
                STAGE 01
              </span>
              <h3>Hard Limit</h3>
              <p>Instant denial when proposed spend exceeds cap.</p>
            </div>

            <div className="layer-card">
              <span className="layer-card-tag" style={{ color: 'var(--escalate)', background: 'rgba(251,191,36,0.1)' }}>
                STAGE 02
              </span>
              <h3>Velocity</h3>
              <p>Fail-closed escalation when spend reaches window cap.</p>
            </div>

            <div className="layer-card">
              <span className="layer-card-tag" style={{ color: 'var(--allow)', background: 'rgba(52,211,153,0.1)' }}>
                STAGE 03
              </span>
              <h3>Judge</h3>
              <p>Multi-validator consensus on qualitative natural policy rules.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Honest Protocol Limitations */}
      <section className="landing-section">
        <div className="app-container">
          <div className="section-head">
            <h2>Protocol Limitations</h2>
            <p>Verified constraints on GenLayer Studionet.</p>
          </div>

          <div className="limitations-wrap">
            <ul className="limitations-list">
              <li className="limitations-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Single model equivalence without multi-model arbitration.</span>
              </li>
              <li className="limitations-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Ring buffer tracks recent 15 decisions.</span>
              </li>
              <li className="limitations-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Equivalence verification takes 19 seconds average.</span>
              </li>
            </ul>

            <div style={{ textAlign: 'center' }}>
              <a
                href="https://github.com/huzyow155/guardrail-court-genlayer/blob/main/docs/LIMITATIONS.md"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                Read Full Limitations
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Closing Call to Action */}
      <section className="cta-section">
        <div className="app-container">
          <h2>Enforce Agent Boundaries</h2>
          <Link
            to="/app"
            className="btn btn-solid"
            onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' })}
          >
            Launch App
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
