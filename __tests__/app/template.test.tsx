import { describe, it, expect } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../utils/test-utils';
import Template from '../../app/template';

describe('Template', () => {
  it('renders children unconditionally', () => {
    renderWithTheme(
      <Template>
        <div data-testid="child">content</div>
      </Template>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('does not render VerificationBanner', () => {
    renderWithTheme(
      <Template>
        <div>content</div>
      </Template>
    );

    expect(screen.queryByText('Email Not Verified')).not.toBeInTheDocument();
  });

  it('does not apply pointer-events:none to children', () => {
    renderWithTheme(
      <Template>
        <div data-testid="child">content</div>
      </Template>
    );

    const child = screen.getByTestId('child');
    // Ancestor should not have pointerEvents: none style
    expect(child.closest('[style*="pointer-events"]')).toBeNull();
  });
});
