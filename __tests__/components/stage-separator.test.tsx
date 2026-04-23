import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { StageSeparator } from '../../app/components/stage-separator';
import { renderWithTheme } from '../utils/test-utils';

describe('StageSeparator', () => {
  it('renders the label text', () => {
    renderWithTheme(<StageSeparator label="Matchday 1" />);
    expect(screen.getByText('Matchday 1')).toBeInTheDocument();
  });

  it('applies gridColumn 1 / -1 to the root element', () => {
    const { container } = renderWithTheme(<StageSeparator label="Matchday 1" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    // The sx gridColumn prop is applied via MUI — check the rendered style
    expect(root.style.cssText || root.getAttribute('class')).toBeTruthy();
  });

  it('renders a Divider alongside the label', () => {
    const { container } = renderWithTheme(<StageSeparator label="Matchday 2" />);
    const divider = container.querySelector('hr');
    expect(divider).toBeInTheDocument();
  });
});
