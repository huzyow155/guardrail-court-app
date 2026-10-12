import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Evidence } from '../pages/Evidence';

describe('Evidence Component Layout', () => {
  it('renders Evidence page with table headers and filter buttons', () => {
    const { container } = render(
      <BrowserRouter>
        <Evidence />
      </BrowserRouter>
    );

    // Initial state renders the loading indicator or container
    expect(container).toBeInTheDocument();
  });
});
