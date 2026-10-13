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
import { triggerDotFieldRipple } from './lib/dotfield';

const NavigationBar: React.FC = () => {
  const { pathname } = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

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
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <g transform="rotate(-30 12 12)">
              <circle cx="7.3" cy="3.2" r="1.45" />
              <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <circle cx="16.7" cy="20.8" r="1.45" />
            </g>
          </svg>
          <span>
            Guardrail <span className="logo-suffix">Court</span>
          </span>
        </Link>

        <nav id="site-nav" className="nav" aria-label="Main">
          <Link
            to="/"
            className={`appear appear--scale ${pathname === '/' ? 'active' : ''}`}
            style={{ '--d': '.16s' } as React.CSSProperties}
          >
            Overview
          </Link>
          <Link
            to="/app"
            className={`appear appear--soft ${pathname === '/app' ? 'active' : ''}`}
            style={{ '--d': '.24s' } as React.CSSProperties}
          >
            Explorer
          </Link>
          <Link
            to="/app/desk"
            className={`appear appear--scale ${pathname === '/app/desk' ? 'active' : ''}`}
            style={{ '--d': '.32s' } as React.CSSProperties}
          >
            Desk
          </Link>
          <Link
            to="/app/evidence"
            className={`appear appear--soft ${pathname.startsWith('/app/evidence') ? 'active' : ''}`}
            style={{ '--d': '.40s' } as React.CSSProperties}
          >
            Evidence
          </Link>
          <Link
            to="/app/new"
            className={`appear appear--scale ${pathname === '/app/new' ? 'active' : ''}`}
            style={{ '--d': '.48s' } as React.CSSProperties}
          >
            + Policy
          </Link>
        </nav>

        <div className="header-cta">
          {isConnected ? (
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
        {/* Full-viewport canvas and atmospheric aurora background */}
        <DotField />
        <div className="ambient-backdrop" aria-hidden="true" />

        <div className="app-shell">
          <NavigationBar />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/evidence" element={<Navigate to="/app/evidence" replace />} />
              <Route path="/app" element={<CourtExplorer />} />
              <Route path="/app/desk" element={<Desk />} />
              <Route path="/app/evidence" element={<Evidence />} />
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
                  href="https://explorer-studio.genlayer.com/address/0x6C553Ba27a768D71b570a106D9D2e13553b4103c"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono"
                  style={{ color: 'var(--muted)' }}
                >
                  0x6C55...103c
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
