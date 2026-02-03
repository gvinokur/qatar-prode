import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoostBadge, BoostCountBadge } from '../../app/components/boost-badge';
import { renderWithTheme } from '../utils/test-utils';

describe('BoostBadge', () => {
  describe('Silver Boost', () => {
    it('renders silver boost badge with icon and multiplier', () => {
      renderWithTheme(<BoostBadge type="silver" />);

      expect(screen.getByText('2x')).toBeInTheDocument();
      // Icon should be present
      const chip = screen.getByText('2x').closest('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });

    it('renders without icon when showIcon is false', () => {
      renderWithTheme(<BoostBadge type="silver" showIcon={false} />);

      expect(screen.getByText('2x')).toBeInTheDocument();
      const chip = screen.getByText('2x').closest('.MuiChip-root');
      // Check that icon slot is not present
      expect(chip?.querySelector('.MuiChip-icon')).not.toBeInTheDocument();
    });

    it('applies correct silver styling', () => {
      renderWithTheme(<BoostBadge type="silver" />);

      const chip = screen.getByText('2x').closest('.MuiChip-root');
      const style = window.getComputedStyle(chip!);

      // Check for silver colors in style (exact values depend on MUI theme)
      expect(chip).toHaveStyle({ color: 'rgb(192, 192, 192)' });
    });
  });

  describe('Golden Boost', () => {
    it('renders golden boost badge with icon and multiplier', () => {
      renderWithTheme(<BoostBadge type="golden" />);

      expect(screen.getByText('3x')).toBeInTheDocument();
      const chip = screen.getByText('3x').closest('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });

    it('renders without icon when showIcon is false', () => {
      renderWithTheme(<BoostBadge type="golden" showIcon={false} />);

      expect(screen.getByText('3x')).toBeInTheDocument();
      const chip = screen.getByText('3x').closest('.MuiChip-root');
      expect(chip?.querySelector('.MuiChip-icon')).not.toBeInTheDocument();
    });

    it('applies correct golden styling', () => {
      renderWithTheme(<BoostBadge type="golden" />);

      const chip = screen.getByText('3x').closest('.MuiChip-root');
      expect(chip).toHaveStyle({ color: 'rgb(255, 193, 7)' });
    });
  });

  describe('Size Variants', () => {
    it('renders with small size by default', () => {
      renderWithTheme(<BoostBadge type="silver" />);

      const chip = screen.getByText('2x').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });

    it('renders with medium size when specified', () => {
      renderWithTheme(<BoostBadge type="silver" size="medium" />);

      const chip = screen.getByText('2x').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
    });
  });
});

describe('BoostCountBadge', () => {
  describe('Silver Boost Count', () => {
    it('renders silver boost count in X/Y format', () => {
      renderWithTheme(<BoostCountBadge type="silver" used={3} max={5} />);

      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('shows correct count when all used', () => {
      renderWithTheme(<BoostCountBadge type="silver" used={5} max={5} />);

      expect(screen.getByText('5/5')).toBeInTheDocument();
    });

    it('shows correct count when none used', () => {
      renderWithTheme(<BoostCountBadge type="silver" used={0} max={5} />);

      expect(screen.getByText('0/5')).toBeInTheDocument();
    });

    it('applies correct silver styling', () => {
      renderWithTheme(<BoostCountBadge type="silver" used={3} max={5} />);

      const chip = screen.getByText('3/5').closest('.MuiChip-root');
      expect(chip).toHaveStyle({ color: 'rgb(192, 192, 192)' });
    });
  });

  describe('Golden Boost Count', () => {
    it('renders golden boost count in X/Y format', () => {
      renderWithTheme(<BoostCountBadge type="golden" used={1} max={2} />);

      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('shows correct count when all used', () => {
      renderWithTheme(<BoostCountBadge type="golden" used={2} max={2} />);

      expect(screen.getByText('2/2')).toBeInTheDocument();
    });

    it('shows correct count when none used', () => {
      renderWithTheme(<BoostCountBadge type="golden" used={0} max={2} />);

      expect(screen.getByText('0/2')).toBeInTheDocument();
    });

    it('applies correct golden styling', () => {
      renderWithTheme(<BoostCountBadge type="golden" used={1} max={2} />);

      const chip = screen.getByText('1/2').closest('.MuiChip-root');
      expect(chip).toHaveStyle({ color: 'rgb(255, 193, 7)' });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      renderWithTheme(<BoostCountBadge type="silver" used={99} max={100} />);

      expect(screen.getByText('99/100')).toBeInTheDocument();
    });

    it('handles zero max (tournament without boosts)', () => {
      renderWithTheme(<BoostCountBadge type="silver" used={0} max={0} />);

      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('handles used > max (should not happen but graceful)', () => {
      renderWithTheme(<BoostCountBadge type="golden" used={5} max={2} />);

      expect(screen.getByText('5/2')).toBeInTheDocument();
    });
  });

  describe('Consistency with BoostBadge', () => {
    it('uses same silver color as BoostBadge', () => {
      const { container: badgeContainer } = renderWithTheme(<BoostBadge type="silver" />);
      const { container: countContainer } = renderWithTheme(<BoostCountBadge type="silver" used={1} max={5} />);

      const badge = badgeContainer.querySelector('.MuiChip-root');
      const count = countContainer.querySelector('.MuiChip-root');

      expect(badge).toHaveStyle({ color: 'rgb(192, 192, 192)' });
      expect(count).toHaveStyle({ color: 'rgb(192, 192, 192)' });
    });

    it('uses same golden color as BoostBadge', () => {
      const { container: badgeContainer } = renderWithTheme(<BoostBadge type="golden" />);
      const { container: countContainer } = renderWithTheme(<BoostCountBadge type="golden" used={1} max={2} />);

      const badge = badgeContainer.querySelector('.MuiChip-root');
      const count = countContainer.querySelector('.MuiChip-root');

      expect(badge).toHaveStyle({ color: 'rgb(255, 193, 7)' });
      expect(count).toHaveStyle({ color: 'rgb(255, 193, 7)' });
    });
  });
});
