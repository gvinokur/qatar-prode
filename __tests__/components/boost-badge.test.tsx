import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BoostBadge, BoostCountBadge } from '../../app/components/boost-badge';

describe('BoostBadge', () => {
  describe('Silver Boost', () => {
    it('renders silver boost badge with icon and multiplier', () => {
      render(<BoostBadge type="silver" />);

      expect(screen.getByText('2x')).toBeInTheDocument();
      // Icon should be present
      const chip = screen.getByText('2x').closest('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });

    it('renders without icon when showIcon is false', () => {
      render(<BoostBadge type="silver" showIcon={false} />);

      expect(screen.getByText('2x')).toBeInTheDocument();
      const chip = screen.getByText('2x').closest('.MuiChip-root');
      // Check that icon slot is not present
      expect(chip?.querySelector('.MuiChip-icon')).not.toBeInTheDocument();
    });

    it('applies correct silver styling', () => {
      render(<BoostBadge type="silver" />);

      const chip = screen.getByText('2x').closest('.MuiChip-root');
      const style = window.getComputedStyle(chip!);

      // Check for silver colors in style (exact values depend on MUI theme)
      expect(chip).toHaveStyle({ color: '#C0C0C0' });
    });
  });

  describe('Golden Boost', () => {
    it('renders golden boost badge with icon and multiplier', () => {
      render(<BoostBadge type="golden" />);

      expect(screen.getByText('3x')).toBeInTheDocument();
      const chip = screen.getByText('3x').closest('.MuiChip-root');
      expect(chip).toBeInTheDocument();
    });

    it('renders without icon when showIcon is false', () => {
      render(<BoostBadge type="golden" showIcon={false} />);

      expect(screen.getByText('3x')).toBeInTheDocument();
      const chip = screen.getByText('3x').closest('.MuiChip-root');
      expect(chip?.querySelector('.MuiChip-icon')).not.toBeInTheDocument();
    });

    it('applies correct golden styling', () => {
      render(<BoostBadge type="golden" />);

      const chip = screen.getByText('3x').closest('.MuiChip-root');
      expect(chip).toHaveStyle({ color: '#FFD700' });
    });
  });

  describe('Size Variants', () => {
    it('renders with small size by default', () => {
      render(<BoostBadge type="silver" />);

      const chip = screen.getByText('2x').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });

    it('renders with medium size when specified', () => {
      render(<BoostBadge type="silver" size="medium" />);

      const chip = screen.getByText('2x').closest('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
    });
  });
});

describe('BoostCountBadge', () => {
  describe('Silver Boost Count', () => {
    it('renders silver boost count in X/Y format', () => {
      render(<BoostCountBadge type="silver" used={3} max={5} />);

      expect(screen.getByText('2x: 3/5')).toBeInTheDocument();
    });

    it('shows correct count when all used', () => {
      render(<BoostCountBadge type="silver" used={5} max={5} />);

      expect(screen.getByText('2x: 5/5')).toBeInTheDocument();
    });

    it('shows correct count when none used', () => {
      render(<BoostCountBadge type="silver" used={0} max={5} />);

      expect(screen.getByText('2x: 0/5')).toBeInTheDocument();
    });

    it('applies correct silver styling', () => {
      render(<BoostCountBadge type="silver" used={3} max={5} />);

      const chip = screen.getByText('2x: 3/5').closest('.MuiChip-root');
      expect(chip).toHaveStyle({ color: '#C0C0C0' });
    });
  });

  describe('Golden Boost Count', () => {
    it('renders golden boost count in X/Y format', () => {
      render(<BoostCountBadge type="golden" used={1} max={2} />);

      expect(screen.getByText('3x: 1/2')).toBeInTheDocument();
    });

    it('shows correct count when all used', () => {
      render(<BoostCountBadge type="golden" used={2} max={2} />);

      expect(screen.getByText('3x: 2/2')).toBeInTheDocument();
    });

    it('shows correct count when none used', () => {
      render(<BoostCountBadge type="golden" used={0} max={2} />);

      expect(screen.getByText('3x: 0/2')).toBeInTheDocument();
    });

    it('applies correct golden styling', () => {
      render(<BoostCountBadge type="golden" used={1} max={2} />);

      const chip = screen.getByText('3x: 1/2').closest('.MuiChip-root');
      expect(chip).toHaveStyle({ color: '#FFD700' });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      render(<BoostCountBadge type="silver" used={99} max={100} />);

      expect(screen.getByText('2x: 99/100')).toBeInTheDocument();
    });

    it('handles zero max (tournament without boosts)', () => {
      render(<BoostCountBadge type="silver" used={0} max={0} />);

      expect(screen.getByText('2x: 0/0')).toBeInTheDocument();
    });

    it('handles used > max (should not happen but graceful)', () => {
      render(<BoostCountBadge type="golden" used={5} max={2} />);

      expect(screen.getByText('3x: 5/2')).toBeInTheDocument();
    });
  });

  describe('Consistency with BoostBadge', () => {
    it('uses same silver color as BoostBadge', () => {
      const { container: badgeContainer } = render(<BoostBadge type="silver" />);
      const { container: countContainer } = render(<BoostCountBadge type="silver" used={1} max={5} />);

      const badge = badgeContainer.querySelector('.MuiChip-root');
      const count = countContainer.querySelector('.MuiChip-root');

      expect(badge).toHaveStyle({ color: '#C0C0C0' });
      expect(count).toHaveStyle({ color: '#C0C0C0' });
    });

    it('uses same golden color as BoostBadge', () => {
      const { container: badgeContainer } = render(<BoostBadge type="golden" />);
      const { container: countContainer } = render(<BoostCountBadge type="golden" used={1} max={2} />);

      const badge = badgeContainer.querySelector('.MuiChip-root');
      const count = countContainer.querySelector('.MuiChip-root');

      expect(badge).toHaveStyle({ color: '#FFD700' });
      expect(count).toHaveStyle({ color: '#FFD700' });
    });
  });
});
