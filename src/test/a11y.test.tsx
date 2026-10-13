import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import axe from 'axe-core';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from '../context/WalletContext';
import { Landing } from '../pages/Landing';
import { CourtExplorer } from '../pages/CourtExplorer';
import { Evidence } from '../pages/Evidence';

describe('Accessibility Standards (axe-core on /, /app, /evidence)', () => {
  it('Landing (/) has 0 serious or critical axe-core violations', async () => {
    const { container } = render(
      <WalletProvider>
        <BrowserRouter>
          <Landing />
        </BrowserRouter>
      </WalletProvider>
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toHaveLength(0);
  });

  it('CourtExplorer (/app) has 0 serious or critical axe-core violations', async () => {
    const { container } = render(
      <WalletProvider>
        <BrowserRouter>
          <CourtExplorer />
        </BrowserRouter>
      </WalletProvider>
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toHaveLength(0);
  });

  it('Evidence (/evidence) has 0 serious or critical axe-core violations', async () => {
    const { container } = render(
      <WalletProvider>
        <BrowserRouter>
          <Evidence />
        </BrowserRouter>
      </WalletProvider>
    );
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(seriousOrCritical).toHaveLength(0);
  });
});
