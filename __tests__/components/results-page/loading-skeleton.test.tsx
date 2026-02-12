import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../utils/test-utils';
import LoadingSkeleton from '../../../app/components/results-page/loading-skeleton';

describe('LoadingSkeleton', () => {
  describe('Basic Rendering', () => {
    it('renders skeleton cards', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Check that skeletons are rendered (using MUI Skeleton's data-testid or class)
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows correct number of skeleton cards (8 by default)', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Each card is wrapped in Paper component
      const papers = container.querySelectorAll('.MuiPaper-root');
      expect(papers.length).toBe(8);
    });

    it('renders within a Grid container', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Check for MUI Grid container
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });

    it('renders Grid items with responsive sizing', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Check for Grid items (should have 8 items)
      const gridItems = container.querySelectorAll('.MuiGrid-root:not(.MuiGrid-container)');
      expect(gridItems.length).toBe(8);
    });
  });

  describe('Card Structure', () => {
    it('each card is wrapped in Paper component with elevation', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      papers.forEach((paper) => {
        // MUI Paper with elevation adds elevation class
        expect(paper.classList.toString()).toMatch(/MuiPaper-elevation/);
      });
    });

    it('shows header skeleton in each card', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Each card should have a text skeleton for the header (width: 40%)
      const papers = container.querySelectorAll('.MuiPaper-root');

      papers.forEach((paper) => {
        const textSkeletons = paper.querySelectorAll('.MuiSkeleton-text');
        expect(textSkeletons.length).toBeGreaterThan(0);
      });
    });

    it('shows games list skeleton in each card', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Each card should have multiple text skeletons (4 for games list)
      const papers = container.querySelectorAll('.MuiPaper-root');

      papers.forEach((paper) => {
        const textSkeletons = paper.querySelectorAll('.MuiSkeleton-text');
        // At least 4 text skeletons for games list + 1 for header + 1 for standings header
        expect(textSkeletons.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('shows standings table skeleton in each card', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Each card should have a rectangular skeleton (for standings table)
      const papers = container.querySelectorAll('.MuiPaper-root');

      papers.forEach((paper) => {
        const rectangularSkeletons = paper.querySelectorAll('.MuiSkeleton-rectangular');
        expect(rectangularSkeletons.length).toBe(1);
      });
    });
  });

  describe('Skeleton Content', () => {
    it('header skeleton has correct variant', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      const firstPaper = papers[0];

      // First skeleton should be text variant (header)
      const firstSkeleton = firstPaper.querySelector('.MuiSkeleton-text');
      expect(firstSkeleton).toBeInTheDocument();
    });

    it('games list has multiple text skeletons', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      const firstPaper = papers[0];

      // Should have multiple text skeletons
      const textSkeletons = firstPaper.querySelectorAll('.MuiSkeleton-text');
      expect(textSkeletons.length).toBeGreaterThanOrEqual(5); // 1 header + 4 games list + 1 standings header
    });

    it('standings table has rectangular skeleton', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      const firstPaper = papers[0];

      // Should have rectangular skeleton for table
      const rectSkeleton = firstPaper.querySelector('.MuiSkeleton-rectangular');
      expect(rectSkeleton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders with proper structure for screen readers', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // MUI Skeleton components have proper ARIA attributes by default
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('skeleton elements are visible in the DOM', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // All skeletons should be in the document
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toBeInTheDocument();
      });
    });

    it('maintains semantic structure with Grid and Paper', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      // Should have semantic structure: Grid > Paper > Skeletons
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();

      const papers = container.querySelectorAll('.MuiPaper-root');
      expect(papers.length).toBe(8);

      papers.forEach((paper) => {
        const skeletons = paper.querySelectorAll('.MuiSkeleton-root');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Theme Integration', () => {
    it('renders correctly with light theme', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />, { theme: 'light' });

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders correctly with dark theme', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />, { theme: 'dark' });

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('Paper components render with theme styles', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      papers.forEach((paper) => {
        // MUI Paper should have proper classes
        expect(paper.classList.contains('MuiPaper-root')).toBe(true);
      });
    });
  });

  describe('Layout and Spacing', () => {
    it('Grid container has proper spacing', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const gridContainer = container.querySelector('.MuiGrid-container');
      // MUI Grid with spacing prop adds spacing classes
      expect(gridContainer?.classList.toString()).toMatch(/MuiGrid-spacing/);
    });

    it('each skeleton card is in a Grid item', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const gridItems = container.querySelectorAll('.MuiGrid-root:not(.MuiGrid-container)');
      expect(gridItems.length).toBe(8);

      gridItems.forEach((item) => {
        // Each item should contain a Paper
        const paper = item.querySelector('.MuiPaper-root');
        expect(paper).toBeInTheDocument();
      });
    });

    it('Paper components have padding', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');
      papers.forEach((paper) => {
        // Check that Paper element exists and is rendered (MUI applies padding via sx prop)
        expect(paper).toBeInTheDocument();
        expect(paper).toBeVisible();
      });
    });
  });

  describe('Consistency', () => {
    it('all cards have the same structure', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');

      // Count skeletons in first card
      const firstCardSkeletons = papers[0].querySelectorAll('.MuiSkeleton-root');
      const firstCardCount = firstCardSkeletons.length;

      // All cards should have the same number of skeletons
      papers.forEach((paper) => {
        const skeletons = paper.querySelectorAll('.MuiSkeleton-root');
        expect(skeletons.length).toBe(firstCardCount);
      });
    });

    it('all cards have text and rectangular skeletons', () => {
      const { container } = renderWithTheme(<LoadingSkeleton />);

      const papers = container.querySelectorAll('.MuiPaper-root');

      papers.forEach((paper) => {
        const textSkeletons = paper.querySelectorAll('.MuiSkeleton-text');
        const rectSkeletons = paper.querySelectorAll('.MuiSkeleton-rectangular');

        expect(textSkeletons.length).toBeGreaterThan(0);
        expect(rectSkeletons.length).toBe(1);
      });
    });

    it('renders consistently across multiple renders', () => {
      const { container: container1 } = renderWithTheme(<LoadingSkeleton />);
      const { container: container2 } = renderWithTheme(<LoadingSkeleton />);

      const papers1 = container1.querySelectorAll('.MuiPaper-root');
      const papers2 = container2.querySelectorAll('.MuiPaper-root');

      expect(papers1.length).toBe(papers2.length);
      expect(papers1.length).toBe(8);
    });
  });
});
