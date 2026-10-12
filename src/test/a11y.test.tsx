import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import axe from 'axe-core';
import { Landing } from '../pages/Landing';
import { BrowserRouter } from 'react-router-dom';

describe('Accessibility Standards (axe-core)', () => {
  it('landing page conforms to basic accessibility rules', async () => {
    const { container } = render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    const results = await axe.run(container);
    // Filter out color contrast in jsdom mock if necessary, but check general violations
    const violations = results.violations.filter(
      (v) => v.id !== 'color-contrast' // jsdom cannot compute rendered CSS background colors accurately
    );
    expect(violations).toHaveLength(0);
  });
});
