import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import { DotField } from './components/DotField';
import { Landing } from './pages/Landing';
import { Evidence } from './pages/Evidence';
import { CourtExplorer } from './pages/CourtExplorer';
import { DecisionDetail } from './pages/DecisionDetail';
import { CreatePolicy } from './pages/CreatePolicy';
import { Desk } from './pages/Desk';
import { RequestAction } from './pages/RequestAction';
import { VaultConsumer } from './pages/VaultConsumer';
import { COURT_ADDRESS } from './services/contractClient';
import { triggerDotFieldRipple } from './lib/dotfield';

const NavigationBar: React.FC = () => {
  const { pathname } = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const isLanding = pathname === '/';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`site-header-wrap ${menuOpen ? 'menu-open' : ''}`}>
      <div
        className="menu-backdrop"
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
      />
      <header className="site-header">
        <Link
          to="/"
          className="logo appear appear--scale"
          style={{ '--d': '.08s' } as React.CSSProperties}
          onClick={(e) => triggerDotFieldRipple({ element: e.currentTarget, verdict: 'NEUTRAL' })}
        >
          <svg viewBox="0 0 512 512" aria-hidden="true">
            <rect width="512" height="512" rx="112" fill="#0B0B0F" />
            <rect x="1" y="1" width="510" height="510" rx="111" fill="none" stroke="#2A2D3A" strokeWidth="16" />
            <g strokeLinecap="round" strokeWidth="36" fill="none">
              <line x1="170" y1="350" x2="170" y2="118" stroke="#34D399" />
              <line x1="170" y1="350" x2="334" y2="186" stroke="#FBBF24" />
              <line x1="170" y1="350" x2="402" y2="350" stroke="#F87171" />
              <line x1="402" y1="312" x2="402" y2="388" stroke="#F87171" />
            </g>
            <circle cx="170" cy="350" r="38" fill="#0B0B0F" stroke="#E8EAF2" strokeWidth="20" />
          </svg>
          <span>
            Guardrail <span className="logo-suffix">Court</span>
          </span>
        </Link>

        {isLanding ? (
          /* Landing page minimal header anchors */
          <nav id="site-nav" className="nav" aria-label="Page navigation">
            <a
              href="#layers"
              className="appear appear--scale"
              style={{ '--d': '.16s' } as React.CSSProperties}
            >
              Layers
            </a>
            <a
              href="#limits"
              className="appear appear--soft"
              style={{ '--d': '.24s' } as React.CSSProperties}
            >
              Limits
            </a>
          </nav>
        ) : (
          /* App pages navigation tabs */
          <nav id="site-nav" className="nav" aria-label="App navigation">
            <Link
              to="/"
              className="appear appear--scale"
              style={{ '--d': '.12s' } as React.CSSProperties}
            >
              Overview
            </Link>
            <Link
              to="/app"
              className={`appear appear--soft ${pathname === '/app' ? 'active' : ''}`}
              style={{ '--d': '.18s' } as React.CSSProperties}
            >
              Explorer
            </Link>
            <Link
              to="/app/request"
              className={`appear appear--soft ${pathname === '/app/request' ? 'active' : ''}`}
              style={{ '--d': '.22s' } as React.CSSProperties}
            >
              Request
            </Link>
            <Link
              to="/app/desk"
              className={`appear appear--scale ${pathname === '/app/desk' ? 'active' : ''}`}
              style={{ '--d': '.26s' } as React.CSSProperties}
            >
              Desk
            </Link>
            <Link
              to="/app/vault"
              className={`appear appear--scale ${pathname === '/app/vault' ? 'active' : ''}`}
              style={{ '--d': '.28s' } as React.CSSProperties}
            >
              Vault
            </Link>
            <Link
              to="/app/evidence"
              className={`appear appear--soft ${pathname.startsWith('/app/evidence') ? 'active' : ''}`}
              style={{ '--d': '.30s' } as React.CSSProperties}
            >
              Evidence
            </Link>
            <Link
              to="/app/new"
              className={`appear appear--scale ${pathname === '/app/new' ? 'active' : ''}`}
              style={{ '--d': '.36s' } as React.CSSProperties}
            >
              + Policy
            </Link>
          </nav>
        )}

        <div className="header-cta">
          {isLanding ? (
            <Link
              to="/app"
              className="btn btn-solid appear appear--scale"
              style={{ '--d': '.34s' } as React.CSSProperties}
            >
              Open App
            </Link>
          ) : isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="badge font-mono"
                style={{ marginBottom: 0, padding: '6px 12px' }}
              >
                {shortAddress}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={disconnectWallet}
                title="Disconnect"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn btn-solid appear appear--scale"
              style={{ '--d': '.34s' } as React.CSSProperties}
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}

          <button
            className="burger appear appear--scale"
            style={{ '--d': '.34s' } as React.CSSProperties}
            type="button"
            aria-controls="site-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="burger-lines">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        {/* Full-viewport atmospheric aurora (z:0) & DotField canvas (z:1) */}
        <div className="ambient-backdrop" aria-hidden="true" />
        <DotField />

        <div className="app-shell">
          <NavigationBar />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/evidence" element={<Navigate to="/app/evidence" replace />} />
              <Route
                path="/app"
                element={
                  <div className="app-content-wrap">
                    <CourtExplorer />
                  </div>
                }
              />
              <Route
                path="/app/request"
                element={
                  <div className="app-content-wrap">
                    <RequestAction />
                  </div>
                }
              />
              <Route
                path="/app/desk"
                element={
                  <div className="app-content-wrap">
                    <Desk />
                  </div>
                }
              />
              <Route
                path="/app/vault"
                element={
                  <div className="app-content-wrap">
                    <VaultConsumer />
                  </div>
                }
              />
              <Route
                path="/app/evidence"
                element={
                  <div className="app-content-wrap">
                    <Evidence />
                  </div>
                }
              />
              <Route
                path="/app/policy/:id"
                element={
                  <div className="app-content-wrap">
                    <CourtExplorer />
                  </div>
                }
              />
              <Route
                path="/app/decision/:id"
                element={
                  <div className="app-content-wrap">
                    <DecisionDetail />
                  </div>
                }
              />
              <Route
                path="/app/new"
                element={
                  <div className="app-content-wrap">
                    <CreatePolicy />
                  </div>
                }
              />
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
                gap: '16px',
              }}
            >
              <div>
                <strong style={{ color: '#ffffff' }}>Guardrail Court</strong>
                <span style={{ marginLeft: '10px' }}>
                  Policy Gate & Consensus Clearance Protocol • GenLayer Studionet (61999)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <a
                  href={`https://explorer-studio.genlayer.com/address/${COURT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono"
                  style={{ color: 'var(--muted)' }}
                >
                  {COURT_ADDRESS.slice(0, 6)}...{COURT_ADDRESS.slice(-4)}
                </a>
                <a
                  href="https://github.com/huzyow155/guardrail-court-genlayer"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted)' }}
                >
                  Contract Repo
                </a>
                <a
                  href="https://github.com/huzyow155/guardrail-court-app"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted)' }}
                >
                  App Repo
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
