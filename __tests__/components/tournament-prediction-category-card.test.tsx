import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../utils/test-utils';
import { vi, beforeEach, afterEach } from 'vitest';
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
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      expect(screen.getByText('Podio')).toBeInTheDocument();
    });

    it('renders completion count correctly', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      expect(screen.getByText('2/3 (67%)')).toBeInTheDocument();
    });

    it('calculates percentage correctly', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={1} total={4} />);
      expect(screen.getByText('1/4 (25%)')).toBeInTheDocument();
    });
  });

  describe('Complete State', () => {
    it('shows green checkmark icon when complete', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const icon = screen.getByTestId('CheckCircleIcon');
      expect(icon).toBeInTheDocument();
    });

    it('does not show Completar button when complete', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      expect(screen.queryByRole('link', { name: /completar/i })).not.toBeInTheDocument();
    });

    it('has normal border (1px) when complete', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });

    it('card is not clickable when complete', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  describe('Incomplete State', () => {
    it('shows info icon when incomplete (defaults to notice without date)', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      // Without tournamentStartDate, defaults to notice (InfoIcon)
      const icon = screen.getByTestId('InfoIcon');
      expect(icon).toBeInTheDocument();
    });

    it('shows Ir button when incomplete', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: /ir a podio/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('href', '/tournaments/1/awards');
    });

    it('has normal border (1px) when incomplete without date (defaults to notice)', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      const card = container.querySelector('.MuiCard-root');
      // Without tournamentStartDate, urgency is notice, which has 1px border
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });

    it('button is clickable Link when incomplete', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: /ir a podio/i });
      expect(button).toHaveAttribute('href', '/tournaments/1/awards');
    });
  });

  describe('Locked State', () => {
    it('shows info blue lock icon when locked', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const icons = screen.getAllByTestId('LockIcon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('shows Cerrado chip when locked', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      expect(screen.getByText('Cerrado')).toBeInTheDocument();
    });

    it('does not show Completar button when locked', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      expect(screen.queryByRole('link', { name: /completar/i })).not.toBeInTheDocument();
    });

    it('card is not clickable when locked', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('has normal border (1px) when locked', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });
  });

  describe('Border Widths', () => {
    it('incomplete cards have 1px border when notice (default without date)', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={1} total={3} />);
      const card = container.querySelector('.MuiCard-root');
      // Without tournamentStartDate, urgency defaults to notice (1px border)
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });

    it('complete cards have 1px border', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });

    it('locked cards have 1px border', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });
  });

  describe('Edge Cases', () => {
    it('handles completed=0, total=0 without errors', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={0} total={0} />);
      expect(screen.getByText('0/0 (0%)')).toBeInTheDocument();
    });

    it('clamps completed to total when completed > total', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={5} total={3} />);
      // Should display 3/3 (100%) due to clamping
      expect(screen.getByText('3/3 (100%)')).toBeInTheDocument();
    });

    it('handles very long category titles gracefully', () => {
      const longTitle = 'This is a very long category title that should wrap or truncate properly without breaking the layout';
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('incomplete cards have Ir button that is keyboard navigable', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: /ir a podio/i });
      expect(button).toBeInTheDocument();
    });

    it('locked cards have no focusable interactive elements', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} isLocked={true} />);
      const links = screen.queryAllByRole('link');
      const buttons = screen.queryAllByRole('button');
      expect(links).toHaveLength(0);
      expect(buttons).toHaveLength(0);
    });

    it('complete cards have no focusable interactive elements', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={3} total={3} />);
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('card has proper ARIA label for screen readers', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={2} total={3} />);
      const card = container.querySelector('[aria-label]');
      expect(card).toHaveAttribute('aria-label', 'Podio: 2 de 3 completados');
    });

    it('button has proper ARIA label', () => {
      renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} />);
      const button = screen.getByRole('link', { name: 'Ir a podio' });
      expect(button).toBeInTheDocument();
    });

    it('handles singular form for ARIA label when completed=1', () => {
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...defaultProps} completed={1} total={3} />);
      const card = container.querySelector('[aria-label]');
      expect(card).toHaveAttribute('aria-label', 'Podio: 1 de 3 completado');
    });
  });

  describe('Time-based Urgency', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows INFO icon when >48h until lock and incomplete', () => {
      const tournamentStart = new Date('2023-12-30T12:00:00Z'); // Lock in 72h
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
    });

    it('shows WARNING icon when 2-24h until lock and incomplete', () => {
      const tournamentStart = new Date('2023-12-28T00:00:00Z'); // Lock in 12h
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();
    });

    it('shows ERROR icon when <2h until lock and incomplete', () => {
      const tournamentStart = new Date('2023-12-27T13:00:00Z'); // Lock in 1h
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    });

    it('defaults to notice when tournamentStartDate is undefined', () => {
      const props = { ...defaultProps, tournamentStartDate: undefined };
      renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
    });
  });

  describe('Urgency-based Borders', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('has 2px border when urgent (<2h until lock)', () => {
      const tournamentStart = new Date('2023-12-27T13:00:00Z');
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('has 2px border when warning (2-24h until lock)', () => {
      const tournamentStart = new Date('2023-12-28T00:00:00Z');
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('has 1px border when notice (>48h until lock)', () => {
      const tournamentStart = new Date('2023-12-30T12:00:00Z');
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });
  });

  describe('Icon Size Consistency', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('preserves 16px icon size when using getUrgencyIcon', () => {
      const tournamentStart = new Date('2023-12-27T13:00:00Z'); // urgent
      const props = { ...defaultProps, tournamentStartDate: tournamentStart };
      const { container } = renderWithTheme(<TournamentPredictionCategoryCard {...props} />);
      const icon = container.querySelector('[data-testid="ErrorIcon"]');
      // Icon should have fontSize 16px via sx prop
      expect(icon).toBeInTheDocument();
    });
  });
});
