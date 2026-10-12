import React from 'react';
import { Link } from 'react-router-dom';
import { DotField } from '../components/DotField';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { Odometer } from '../components/Odometer';

export const Landing: React.FC = () => {
  return (
    <div className="landing-page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Canvas */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '420px',
          opacity: 0.18,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <DotField />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '3rem 0 2rem 0' }}>
        {/* Hero Section */}
        <div style={{ maxWidth: '800px', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#FFFFFF',
              border: '1px solid #001FEB',
              padding: '0.2rem 0.6rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              marginBottom: '1rem',
            }}
          >
            <span>STUDIONET: CHAIN ID 61999</span>
            <span>•</span>
            <span>ADVISORY INTELLIGENCE GATE</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginBottom: '1rem' }}>
            Guardrail Court
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--ink-body)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            An on-chain policy gate and multi-validator clearance protocol for autonomous AI agents.
            Human owners specify plain-language boundaries; GenLayer validators evaluate proposed actions.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/app" className="btn btn-primary">
              Enter Court Desk
            </Link>
            <Link to="/evidence" className="btn btn-secondary">
              View Verified Evidence
            </Link>
          </div>
        </div>

        {/* 3-Way Signal Mechanics Card */}
        <div className="panel" style={{ marginBottom: '2rem' }}>
          <div className="panel-header">
            <h3>Three-Way Signal Mechanics</h3>
            <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>gl.eq_principle.strict_eq</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ borderLeft: '3px solid var(--signal-allow)', paddingLeft: '1rem' }}>
              <SemaphoreSignal verdict="ALLOW" size="md" />
              <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>
                Action complies with natural-language policy and passes all numeric spending limits.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--signal-escalate)', paddingLeft: '1rem' }}>
              <SemaphoreSignal verdict="ESCALATE" size="md" />
              <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>
                Ambiguous requests, velocity threshold trips, or unparseable outputs route to the human owner inbox.
              </p>
            </div>

            <div style={{ borderLeft: '3px solid var(--signal-deny)', paddingLeft: '1rem' }}>
              <SemaphoreSignal verdict="DENY" size="md" />
              <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>
                Clear violations of policy guidelines or hard spending limits are definitively rejected.
              </p>
            </div>
          </div>
        </div>

        {/* Verified Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="panel" style={{ padding: '1rem', margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', color: 'var(--ink-primary)' }}>
              <Odometer value={10} duration={600} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Reference Runs
            </div>
          </div>

          <div className="panel" style={{ padding: '1rem', margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', color: 'var(--ink-primary)' }}>
              <Odometer value={19.02} duration={800} suffix="s" />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Consensus Latency
            </div>
          </div>

          <div className="panel" style={{ padding: '1rem', margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', color: 'var(--ink-primary)' }}>
              <Odometer value={5.28} duration={600} suffix="s" />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Pre-LLM Numeric Guards
            </div>
          </div>

          <div className="panel" style={{ padding: '1rem', margin: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', color: 'var(--ink-primary)' }}>
              <Odometer value={100} duration={600} suffix="%" />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Fail-Closed Posture
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
