import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { WalletProvider, useWallet } from './context/WalletContext';
import { Landing } from './pages/Landing';
import { Evidence } from './pages/Evidence';
import { CourtExplorer } from './pages/CourtExplorer';
import { DecisionDetail } from './pages/DecisionDetail';
import { CreatePolicy } from './pages/CreatePolicy';
import { Desk } from './pages/Desk';

const NavigationBar: React.FC = () => {
  const { pathname } = useLocation();
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  return (
    <header className="site-header">
      <Link to="/" className="site-logo">
        <span
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--ink-primary)',
            borderRadius: '50%',
          }}
        />
        Guardrail Court
      </Link>

      <nav className="nav-links">
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
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--ink-primary)' }}
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
  );
};

export const App: React.FC = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="app-container">
          <NavigationBar />
          <main style={{ flex: 1 }}>
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
            <div>
              <strong>Guardrail Court</strong> • Advisory Policy Gate for Autonomous Agents
            </div>
            <div>
              GenLayer Studionet (Chain ID 61999) • Contract{' '}
              <a
                href="https://explorer-studio.genlayer.com/address/0x6C553Ba27a768D71b570a106D9D2e13553b4103c"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--ink-primary)' }}
              >
                0x6C55...103c
              </a>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default App;
