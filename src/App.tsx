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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <Link to="/" className="site-logo">
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                backgroundColor: 'var(--accent)',
                borderRadius: '50%',
              }}
            />
            Guardrail Court
          </Link>

          {isLanding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }} aria-label="Page sections">
              <a
                href="#guards"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ALLOW' })}
              >
                #guards
              </a>
              <a
                href="#metrics"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
              >
                #metrics
              </a>
              <a
                href="#limits"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'ESCALATE' })}
              >
                #limits
              </a>
              <a
                href="#cta"
                className="nav-anchor"
                onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
              >
                #cta
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <button className="btn btn-sm btn-primary" onClick={connectWallet}>
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
                gap: '1rem',
              }}
            >
              <div>
                <strong>Guardrail Court</strong> • Advisory Policy Gate on GenLayer Studionet (Chain ID 61999)
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.82rem' }}>
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
