import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import { DotField } from './components/DotField';
import { Landing } from './pages/Landing';
import { Evidence } from './pages/Evidence';
import { CourtExplorer } from './pages/CourtExplorer';
import { DecisionDetail } from './pages/DecisionDetail';
import { CreatePolicy } from './pages/CreatePolicy';
import { Desk } from './pages/Desk';
import { triggerDotFieldRipple } from './lib/dotfield';

const NavigationBar: React.FC = () => {
  const { pathname } = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const isLanding = pathname === '/';

  return (
    <div className="site-header-wrap">
      <header className="site-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
          <Link to="/" className="site-logo">
            <span className="site-logo-mark" aria-hidden="true">
              GC
            </span>
            <span>Guardrail Court</span>
          </Link>

          {isLanding && (
            <div className="nav-anchor-group" aria-label="Page sections">
              <a
                href="#problem"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
              >
                01 Problem
              </a>
              <a
                href="#guards"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' })}
              >
                02 Guards
              </a>
              <a
                href="#workflow"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
              >
                03 Pipeline
              </a>
              <a
                href="#metrics"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
              >
                04 Evidence
              </a>
              <a
                href="#limits"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ESCALATE' })}
              >
                05 Limits
              </a>
            </div>
          )}
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/app" className={`nav-link ${pathname === '/app' ? 'active' : ''}`}>
            Explorer
          </Link>
          <Link to="/app/desk" className={`nav-link ${pathname === '/app/desk' ? 'active' : ''}`}>
            Escalation Desk
          </Link>
          <Link to="/evidence" className={`nav-link ${pathname === '/evidence' ? 'active' : ''}`}>
            Evidence
          </Link>
          <Link to="/app/new" className={`nav-link ${pathname === '/app/new' ? 'active' : ''}`}>
            + Policy
          </Link>

          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.35rem' }}>
              <span
                className="badge font-mono"
                style={{ background: 'var(--surface)', borderColor: 'var(--ink)', color: 'var(--ink)' }}
              >
                {shortAddress}
              </span>
              <button className="btn btn-sm btn-secondary" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              style={{ marginLeft: '0.35rem' }}
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
        </nav>
      </header>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        {/* Single fixed full-viewport DotField canvas across all routes */}
        <DotField />

        <div className="app-shell">
          <NavigationBar />

          <main className="app-container" style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/app" element={<CourtExplorer />} />
              <Route path="/app/desk" element={<Desk />} />
              <Route path="/app/policy/:id" element={<CourtExplorer />} />
              <Route path="/app/decision/:id" element={<DecisionDetail />} />
              <Route path="/app/new" element={<CreatePolicy />} />
            </Routes>
          </main>

          <footer className="site-footer">
            <div
              className="app-container"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Guardrail Court</strong>
                <span style={{ opacity: 0.85, marginLeft: '0.6rem' }}>
                  On-Chain Risk & Spending Control for Autonomous Agents • GenLayer Studionet (Chain ID 61999)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  Contract:{' '}
                  <a
                    href="https://explorer-studio.genlayer.com/address/0x6C553Ba27a768D71b570a106D9D2e13553b4103c"
                    target="_blank"
                    rel="noreferrer"
                  >
                    0x6C553Ba27a768D71b570a106D9D2e13553b4103c
                  </a>
                </span>
                <a
                  href="https://github.com/huzyow155/guardrail-court-genlayer"
                  target="_blank"
                  rel="noreferrer"
                >
                  Contract Repo
                </a>
                <a
                  href="https://github.com/huzyow155/guardrail-court-app"
                  target="_blank"
                  rel="noreferrer"
                >
                  dApp Repo
                </a>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;
