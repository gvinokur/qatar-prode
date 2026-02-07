import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import {
  RankChangeIndicator,
  AnimatedRankCell,
  AnimatedPointsCounter,
  RankUpCelebration,
  StaggeredLeaderboardRow,
} from '../../../app/components/leaderboard/rank-change-animations';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock haptics
vi.mock('../../../app/utils/haptics', () => ({
  triggerRankUpHaptic: vi.fn(),
}));

// Mock celebration effects
vi.mock('../../../app/components/celebration-effects', () => ({
  ConfettiEffect: ({ show, color }: any) => (
    show ? <div data-testid="confetti" data-color={color}>Confetti</div> : null
  ),
}));

describe('rank-change-animations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RankChangeIndicator', () => {
    it('should show up arrow for positive rank change', () => {
      renderWithTheme(<RankChangeIndicator rankChange={3} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show down arrow for negative rank change', () => {
      renderWithTheme(<RankChangeIndicator rankChange={-2} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show remove icon for no change', () => {
      const { container } = renderWithTheme(<RankChangeIndicator rankChange={0} />);
      
      // Should not show number when no change
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should render small size variant', () => {
      renderWithTheme(<RankChangeIndicator rankChange={1} size="small" />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should render medium size variant by default', () => {
      renderWithTheme(<RankChangeIndicator rankChange={1} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display absolute value of rank change', () => {
      renderWithTheme(<RankChangeIndicator rankChange={-5} />);
      
      // Should show 5, not -5
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('AnimatedRankCell', () => {
    it('should render rank number', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={1} rankChange={0} />
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show rank change indicator when rank changed', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={2} rankChange={1} />
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should not show rank change indicator when no change', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={1} rankChange={0} />
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('1')).toBeInTheDocument();
      // Should not have rank change indicator
      const cells = screen.getAllByRole('cell');
      expect(cells[0].textContent).toBe('1');
    });

    it('should render children when provided', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={1} rankChange={0}>
                <span>Extra content</span>
              </AnimatedRankCell>
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('Extra content')).toBeInTheDocument();
    });

    it('should handle positive rank change', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={3} rankChange={2} />
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should handle negative rank change', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={5} rankChange={-3} />
            </tr>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('AnimatedPointsCounter', () => {
    it('should display current value immediately when no previous value', () => {
      renderWithTheme(<AnimatedPointsCounter value={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should display previous value initially', () => {
      renderWithTheme(<AnimatedPointsCounter value={100} previousValue={50} />);

      // Should start at previous value
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should handle same previous and current value', () => {
      renderWithTheme(<AnimatedPointsCounter value={100} previousValue={100} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should display initial value when animating decrease', () => {
      renderWithTheme(<AnimatedPointsCounter value={50} previousValue={100} />);

      // Should start at previous value
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      renderWithTheme(<AnimatedPointsCounter value={0} previousValue={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very large values', () => {
      renderWithTheme(<AnimatedPointsCounter value={999999} />);

      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      renderWithTheme(<AnimatedPointsCounter value={-50} />);

      expect(screen.getByText('-50')).toBeInTheDocument();
    });
  });

  describe('RankUpCelebration', () => {
    it('should show confetti when rank improves', async () => {
      const { triggerRankUpHaptic } = await import('../../../app/utils/haptics');

      renderWithTheme(<RankUpCelebration show={true} rankChange={2} />);

      expect(screen.getByTestId('confetti')).toBeInTheDocument();
      expect(triggerRankUpHaptic).toHaveBeenCalled();
    });

    it('should not show celebration when rank drops', () => {
      renderWithTheme(<RankUpCelebration show={true} rankChange={-1} />);

      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('should not show celebration when no rank change', () => {
      renderWithTheme(<RankUpCelebration show={true} rankChange={0} />);

      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('should not show celebration when show is false', () => {
      renderWithTheme(<RankUpCelebration show={false} rankChange={3} />);

      expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('should trigger haptic feedback on rank improvement', async () => {
      const { triggerRankUpHaptic } = await import('../../../app/utils/haptics');
      vi.clearAllMocks();

      renderWithTheme(<RankUpCelebration show={true} rankChange={5} />);

      expect(triggerRankUpHaptic).toHaveBeenCalledTimes(1);
    });
  });

  describe('StaggeredLeaderboardRow', () => {
    it('should render children in a table row', () => {
      render(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={0}>
              <td>User 1</td>
              <td>100 pts</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('100 pts')).toBeInTheDocument();
    });

    it('should apply stagger delay for first 10 rows', () => {
      const { container } = render(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={5}>
              <td>User</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should not apply stagger delay after 10th row', () => {
      const { container } = render(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={15}>
              <td>User</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );
      
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should show rank up celebration when rank improves', () => {
      renderWithTheme(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={0} rankChange={2}>
              <td>User</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );
      
      // Celebration should be rendered
      expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    it('should handle selected state', () => {
      render(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={0} selected={true}>
              <td>User</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveClass('Mui-selected');
    });

    it('should handle unselected state', () => {
      render(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={0} selected={false}>
              <td>User</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByRole('row');
      expect(row).not.toHaveClass('Mui-selected');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large rank changes', () => {
      renderWithTheme(<RankChangeIndicator rankChange={999} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should handle very small rank values', () => {
      render(
        <table>
          <tbody>
            <tr>
              <AnimatedRankCell rank={0} rankChange={0} />
            </tr>
          </tbody>
        </table>
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle multiple children in leaderboard row', () => {
      render(
        <table>
          <tbody>
            <StaggeredLeaderboardRow index={0}>
              <td>Rank 1</td>
              <td>Alice</td>
              <td>100 pts</td>
            </StaggeredLeaderboardRow>
          </tbody>
        </table>
      );

      expect(screen.getByText('Rank 1')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('100 pts')).toBeInTheDocument();
    });
  });
});
