import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import BoostCountsSummary from '../../app/components/boost-counts-summary';
import { renderWithProviders, createMockGuessesContext } from '../utils/test-utils';

describe('BoostCountsSummary', () => {
  const defaultProps = {
    tournamentId: 'tournament1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when both boost maxes are 0', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 0, max: 0 },
        golden: { used: 0, max: 0 }
      }
    });

    const { container } = renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render silver boost chip when silver max > 0', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 2, max: 5 },
        golden: { used: 0, max: 0 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(screen.getByText(/Silver: 3 \/ 5/)).toBeInTheDocument();
    expect(screen.queryByText(/Golden:/)).not.toBeInTheDocument();
  });

  it('should render golden boost chip when golden max > 0', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 0, max: 0 },
        golden: { used: 1, max: 2 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(screen.getByText(/Golden: 1 \/ 2/)).toBeInTheDocument();
    expect(screen.queryByText(/Silver:/)).not.toBeInTheDocument();
  });

  it('should render both boost chips when both maxes > 0', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 3, max: 5 },
        golden: { used: 1, max: 2 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(screen.getByText(/Silver: 2 \/ 5/)).toBeInTheDocument();
    expect(screen.getByText(/Golden: 1 \/ 2/)).toBeInTheDocument();
  });

  it('should display correct remaining counts', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 5, max: 5 },
        golden: { used: 0, max: 3 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    // Silver: all used (0 remaining)
    expect(screen.getByText(/Silver: 0 \/ 5/)).toBeInTheDocument();
    // Golden: none used (3 remaining)
    expect(screen.getByText(/Golden: 3 \/ 3/)).toBeInTheDocument();
  });

  it('should display instructions text', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 0, max: 5 },
        golden: { used: 0, max: 2 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(screen.getByText(/Select boosts when editing your predictions/)).toBeInTheDocument();
  });

  it('should handle zero used boosts', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 0, max: 10 },
        golden: { used: 0, max: 5 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(screen.getByText(/Silver: 10 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText(/Golden: 5 \/ 5/)).toBeInTheDocument();
  });

  it('should render with "Boosts Available:" label', () => {
    const context = createMockGuessesContext({
      boostCounts: {
        silver: { used: 1, max: 5 },
        golden: { used: 0, max: 2 }
      }
    });

    renderWithProviders(
      <BoostCountsSummary {...defaultProps} />,
      { guessesContext: context }
    );

    expect(screen.getByText('Boosts Available:')).toBeInTheDocument();
  });
});
