import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Desk } from '../pages/Desk';

describe('Desk Component Layout', () => {
  it('renders Escalation Desk header and policy selector controls', () => {
    const { container } = render(
      <BrowserRouter>
        <Desk />
      </BrowserRouter>
    );

    expect(container.textContent).toContain('Court Escalation Desk');
  });
});
