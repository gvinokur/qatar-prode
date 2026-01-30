import React from 'react';
import { render, screen } from '@testing-library/react';
import { TournamentPredictionCategoryCard } from '../../app/components/tournament-prediction-category-card';

describe('TournamentPredictionCategoryCard', () => {
  const defaultProps = {
    title: 'Podio',
    completed: 2,
    total: 3,
    link: '/tournaments/1/awards',
    isLocked: false
  };

  describe('Rendering', () => {
    it('renders title correctly', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      expect(screen.getByText('Podio')).toBeInTheDocument();
    });

    it('renders completion count correctly', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      expect(screen.getByText('2/3 (67%)')).toBeInTheDocument();
    });

    it('calculates percentage correctly', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={1} total={4} />);
      expect(screen.getByText('1/4 (25%)')).toBeInTheDocument();
    });
  });

  describe('Complete State', () => {
    it('shows green checkmark icon when complete', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const icon = screen.getByTestId('CheckCircleIcon');
      expect(icon).toBeInTheDocument();
    });

    it('does not show Completar button when complete', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      expect(screen.queryByRole('link', { name: /completar/i })).not.toBeInTheDocument();
    });

    it('has normal border (1px) when complete', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });

    it('card is not clickable when complete', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  describe('Incomplete State', () => {
    it('shows orange warning icon when incomplete', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      const icon = screen.getByTestId('WarningIcon');
      expect(icon).toBeInTheDocument();
    });

    it('shows Completar button when incomplete', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: /completar podio/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/tournaments/1/awards');
    });

    it('has thicker border (2px) when incomplete', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('button is clickable Link when incomplete', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: /completar podio/i });
      expect(button).toHaveAttribute('href', '/tournaments/1/awards');
    });
  });

  describe('Locked State', () => {
    it('shows gray lock icon when locked', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const icons = screen.getAllByTestId('LockIcon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('shows Cerrado chip when locked', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      expect(screen.getByText('Cerrado')).toBeInTheDocument();
    });

    it('does not show Completar button when locked', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      expect(screen.queryByRole('link', { name: /completar/i })).not.toBeInTheDocument();
    });

    it('card is not clickable when locked', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('has normal border (1px) when locked', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });
  });

  describe('Border Widths', () => {
    it('incomplete cards have 2px border', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} completed={1} total={3} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('complete cards have 1px border', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });

    it('locked cards have 1px border', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });
  });

  describe('Edge Cases', () => {
    it('handles completed=0, total=0 without errors', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={0} total={0} />);
      expect(screen.getByText('0/0 (0%)')).toBeInTheDocument();
    });

    it('clamps completed to total when completed > total', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={5} total={3} />);
      // Should display 3/3 (100%) due to clamping
      expect(screen.getByText('3/3 (100%)')).toBeInTheDocument();
    });

    it('handles very long category titles gracefully', () => {
      const longTitle = 'This is a very long category title that should wrap or truncate properly without breaking the layout';
      render(<TournamentPredictionCategoryCard {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('incomplete cards have Completar button that is keyboard navigable', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: /completar podio/i });
      expect(button).toBeInTheDocument();
    });

    it('locked cards have no focusable interactive elements', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const links = screen.queryAllByRole('link');
      const buttons = screen.queryAllByRole('button');
      expect(links).toHaveLength(0);
      expect(buttons).toHaveLength(0);
    });

    it('complete cards have no focusable interactive elements', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('card has proper ARIA label for screen readers', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} completed={2} total={3} />);
      const card = container.querySelector('[aria-label]');
      expect(card).toHaveAttribute('aria-label', 'Podio: 2 de 3 completados');
    });

    it('button has proper ARIA label', () => {
      render(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: 'Completar podio' });
      expect(button).toBeInTheDocument();
    });

    it('handles singular form for ARIA label when completed=1', () => {
      const { container } = render(<TournamentPredictionCategoryCard {...defaultProps} completed={1} total={3} />);
      const card = container.querySelector('[aria-label]');
      expect(card).toHaveAttribute('aria-label', 'Podio: 1 de 3 completado');
    });
  });
});
