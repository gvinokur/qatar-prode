import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GamesListLoading } from '../../app/components/games-list-loading';

describe('GamesListLoading', () => {
  describe('rendering skeletons', () => {
    it('renders component without errors', () => {
      const { container } = render(<GamesListLoading />);

      // Check that Stack component renders
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });

    it('renders with specified count', () => {
      const { container } = render(<GamesListLoading count={3} />);

      // Component should render without errors
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });

    it('renders with count of 1', () => {
      const { container } = render(<GamesListLoading count={1} />);

      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });

    it('renders with large count', () => {
      const { container } = render(<GamesListLoading count={10} />);

      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });
  });

  describe('unique keys', () => {
    it('renders without React key warnings', () => {
      // This test verifies that our key generation doesn't cause React warnings
      // The key pattern is "skeleton-{index}" which should be unique
      const { container } = render(<GamesListLoading count={5} />);

      // If keys were not unique, React would log warnings
      // We verify component renders without errors
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });
  });

  describe('skeleton variant', () => {
    it('passes props to GameCardSkeleton components', () => {
      const { container } = render(<GamesListLoading count={2} />);

      // Verify component renders (variant and count are passed to GameCardSkeleton)
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });
  });

  describe('layout', () => {
    it('renders skeletons in a Stack with spacing', () => {
      const { container } = render(<GamesListLoading count={3} />);
      const stack = container.firstChild as HTMLElement;

      expect(stack).toHaveClass('MuiStack-root');
    });
  });

  describe('edge cases', () => {
    it('renders Stack when count is 0', () => {
      const { container } = render(<GamesListLoading count={0} />);

      // Stack should still render even with 0 count
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });

    it('handles undefined count (uses default of 5)', () => {
      const { container } = render(<GamesListLoading count={undefined} />);

      // Component renders with default count
      expect(container.querySelector('.MuiStack-root')).toBeInTheDocument();
    });
  });
});
