import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import PointBreakdownTooltip from '../../app/components/point-breakdown-tooltip';
import { renderWithTheme } from '../utils/test-utils';

describe('PointBreakdownTooltip', () => {
  const mockAnchorEl = document.createElement('div');
  const mockOnClose = vi.fn();

  const defaultProps = {
    anchorEl: mockAnchorEl,
    open: true,
    onClose: mockOnClose,
    baseScore: 2,
    multiplier: 1,
    finalScore: 2,
    scoreDescription: 'Exact score',
    boostType: null as null,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render breakdown title', () => {
    renderWithTheme(<PointBreakdownTooltip {...defaultProps} />);

    expect(screen.getByText('Desglose de Puntos')).toBeInTheDocument();
  });

  it('should display base score with description', () => {
    renderWithTheme(<PointBreakdownTooltip {...defaultProps} />);

    expect(screen.getByText('Base:')).toBeInTheDocument();
    expect(screen.getByText(/\(Exact score\)/i)).toBeInTheDocument();
  });

  it('should display final total', () => {
    renderWithTheme(<PointBreakdownTooltip {...defaultProps} />);

    expect(screen.getByText('Total:')).toBeInTheDocument();
    // Check the total section contains 2 puntos
    const totalSection = screen.getByText('Total:').parentElement;
    expect(totalSection).toHaveTextContent('2 puntos');
  });

  it('should not render content when open is false', () => {
    const { container } = renderWithTheme(<PointBreakdownTooltip {...defaultProps} open={false} />);

    // MUI Popover still renders in DOM but with display:none or aria-hidden when closed
    const popoverPaper = container.querySelector('.MuiPopover-paper');
    expect(popoverPaper).not.toBeInTheDocument();
  });

  it('should display singular "punto" for base score of 1', () => {
    renderWithTheme(
      <PointBreakdownTooltip
        {...defaultProps}
        baseScore={1}
        finalScore={1}
        scoreDescription="Correct winner"
      />
    );

    // Check that both "1 punto" instances appear (Base and Total sections)
    expect(screen.getByText(/Correct winner/i)).toBeInTheDocument();
    // The component should show "1 punto" in both base and total sections
    const allText = document.body.textContent || '';
    expect(allText.match(/1 punto/g)).toHaveLength(2); // Base section and Total section
  });

  describe('with silver boost', () => {
    it('should display boost multiplier', () => {
      renderWithTheme(
        <PointBreakdownTooltip
          {...defaultProps}
          boostType="silver"
          multiplier={2}
          finalScore={4}
        />
      );

      expect(screen.getByText('Multiplicador:')).toBeInTheDocument();
      expect(screen.getByText(/2x \(Plateado\)/i)).toBeInTheDocument();
    });

    it('should display correct final total with boost', () => {
      renderWithTheme(
        <PointBreakdownTooltip
          {...defaultProps}
          boostType="silver"
          multiplier={2}
          finalScore={4}
        />
      );

      expect(screen.getByText('Total:')).toBeInTheDocument();
      // Check the total section contains 4 puntos
      const totalSection = screen.getByText('Total:').parentElement;
      expect(totalSection).toHaveTextContent('4 puntos');
    });
  });

  describe('with golden boost', () => {
    it('should display boost multiplier', () => {
      renderWithTheme(
        <PointBreakdownTooltip
          {...defaultProps}
          boostType="golden"
          multiplier={3}
          finalScore={6}
        />
      );

      expect(screen.getByText('Multiplicador:')).toBeInTheDocument();
      expect(screen.getByText(/3x \(Dorado\)/i)).toBeInTheDocument();
    });

    it('should display correct final total with boost', () => {
      renderWithTheme(
        <PointBreakdownTooltip
          {...defaultProps}
          boostType="golden"
          multiplier={3}
          finalScore={6}
        />
      );

      expect(screen.getByText('Total:')).toBeInTheDocument();
      // Check the total section contains 6 puntos
      const totalSection = screen.getByText('Total:').parentElement;
      expect(totalSection).toHaveTextContent('6 puntos');
    });
  });

  describe('without boost', () => {
    it('should not display boost row', () => {
      renderWithTheme(<PointBreakdownTooltip {...defaultProps} boostType={null} />);

      expect(screen.queryByText('Multiplicador:')).not.toBeInTheDocument();
    });
  });
});
