import React from 'react';
import { Link } from 'react-router-dom';
import { triggerDotFieldRipple } from '../lib/dotfield';

export const Landing: React.FC = () => {
  return (
    <div className="landing-wrap">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-copy">
          <div
            className="badge appear appear--pop"
            style={{ '--d': '.18s' } as React.CSSProperties}
          >
            <svg
              className="badge-star"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>On-Chain Risk Gate</span>
          </div>

          <h1 className="appear appear--mask" style={{ '--d': '.32s' } as React.CSSProperties}>
            Autonomous Agent <em>Policy Gate</em>
          </h1>

          <p className="lede appear appear--soft" style={{ '--d': '.48s' } as React.CSSProperties}>
            Action-bound consensus clearance protocol for autonomous AI agents.
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
            <span className="font-mono">8.87s guard latency</span>
          </div>
          <div className="stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Action-bound V2</span>
          </div>
          <div className="stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="font-mono">51 verified tests</span>
          </div>
        </div>
      </section>

      {/* 2. Protection Layers Section */}
      <section className="landing-section" id="layers">
        <div className="app-container">
          <div className="section-head">
            <h2>Five Protection Layers</h2>
            <p>Deterministic allowlists and velocity reject bad requests before validator arbitration.</p>
          </div>

          <div className="layers-grid">
            <div className="layer-card">
              <span className="layer-card-tag" style={{ color: 'var(--deny)', background: 'rgba(248,113,113,0.1)' }}>
                STAGE 01
              </span>
              <h3>Allowlists</h3>
              <p>Rejects unauthorized recipient addresses and asset symbols.</p>
            </div>

            <div className="layer-card">
              <span className="layer-card-tag" style={{ color: 'var(--escalate)', background: 'rgba(251,191,36,0.1)' }}>
                STAGE 02
              </span>
              <h3>Hard Limit</h3>
              <p>Rejects requests exceeding the per-action max cap.</p>
            </div>

            <div className="layer-card">
              <span className="layer-card-tag" style={{ color: 'var(--allow)', background: 'rgba(52,211,153,0.1)' }}>
                STAGE 03
              </span>
              <h3>Judge Consensus</h3>
              <p>Multi-validator LLM consensus on natural language policy intent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Honest Protocol Limitations */}
      <section className="landing-section" id="limits">
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
                <span>Clearance has no expiry; blocked only when policy is paused.</span>
              </li>
              <li className="limitations-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Velocity counts across recent 30 decisions, not by clock time.</span>
              </li>
              <li className="limitations-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Calldata hash is supplied by requester without on-chain execution inspection.</span>
              </li>
            </ul>

            <div style={{ textAlign: 'center' }}>
              <a
                href="https://github.com/huzyow155/guardrail-court-genlayer/blob/main/docs/LIMITATIONS_V2.md"
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
