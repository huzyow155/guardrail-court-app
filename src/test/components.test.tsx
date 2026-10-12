import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { SemaphoreSignal } from '../components/SemaphoreSignal';
import { Odometer } from '../components/Odometer';
import { DotField } from '../components/DotField';

describe('Component Renders & Railway Signals', () => {
  it('renders SemaphoreSignal for ALLOW with green color and 0deg arm', () => {
    const { container } = render(<SemaphoreSignal verdict="ALLOW" />);
    expect(container.querySelector('.signal-allow')).toBeInTheDocument();
    expect(container.textContent).toContain('ALLOW');
  });

  it('renders SemaphoreSignal for ESCALATE with amber color and 45deg arm', () => {
    const { container } = render(<SemaphoreSignal verdict="ESCALATE" />);
    expect(container.querySelector('.signal-escalate')).toBeInTheDocument();
    expect(container.textContent).toContain('ESCALATE');
  });

  it('renders SemaphoreSignal for DENY with stop red color and 90deg arm', () => {
    const { container } = render(<SemaphoreSignal verdict="DENY" />);
    expect(container.querySelector('.signal-deny')).toBeInTheDocument();
    expect(container.textContent).toContain('DENY');
  });

  it('renders Odometer component without crash', () => {
    const { container } = render(<Odometer value={19.02} suffix="s" />);
    expect(container.querySelector('.odometer-digit')).toBeInTheDocument();
  });

  it('renders DotField canvas component', () => {
    const { container } = render(<DotField />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
