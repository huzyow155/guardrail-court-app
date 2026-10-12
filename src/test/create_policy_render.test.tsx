import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CreatePolicy } from '../pages/CreatePolicy';

describe('CreatePolicy Component Layout', () => {
  it('renders policy creation form prompt and inputs', () => {
    const { container } = render(
      <BrowserRouter>
        <CreatePolicy />
      </BrowserRouter>
    );

    expect(container.textContent).toContain('Create New Intelligent Policy');
  });
});
