/* eslint-disable max-lines-per-function */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import EmptyTournamentsState from '../empty-tournaments-state';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import type { Tournament } from '@/app/db/tables-definition';

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

// Mock tournament actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getPastTournaments: vi.fn(),
}));

import { getTranslations } from 'next-intl/server';
import { getPastTournaments } from '@/app/actions/tournament-actions';

const mockGetTranslations = vi.mocked(getTranslations);
const mockGetPastTournaments = vi.mocked(getPastTournaments);

describe('EmptyTournamentsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockTranslations = (translations: Record<string, string>) => {
    return vi.fn((key: string) => translations[key] || key) as any;
  };

  const createMockTournament = (overrides?: Partial<Tournament>): Tournament => ({
    id: 'tournament-1',
    short_name: 'WC 2022',
    long_name: 'FIFA World Cup 2022',
    is_active: false,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    dev_only: false,
    display_name: true,
    theme: null,
    ...overrides,
  });

  describe('Empty state rendering', () => {
    it('should render the trophy icon', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      const component = await EmptyTournamentsState();
      const { container } = renderWithTheme(component);

      expect(container.textContent).toContain('🏆');
    });

    it('should display the empty state title', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      expect(screen.getByText('No Active Tournaments')).toBeInTheDocument();
    });

    it('should display the empty state description', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      expect(
        screen.getByText('There are no active tournaments at the moment.')
      ).toBeInTheDocument();
    });
  });

  describe('Past tournaments section', () => {
    it('should call getPastTournaments with limit of 5', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      await EmptyTournamentsState();

      expect(mockGetPastTournaments).toHaveBeenCalledWith(5);
    });

    it('should not render past tournaments section when there are no past tournaments', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
          'pastTournaments.heading': 'Past Tournaments',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      expect(screen.queryByText('Past Tournaments')).not.toBeInTheDocument();
    });

    it('should display past tournaments heading when tournaments are available', async () => {
      const mockTournaments = [createMockTournament()];

      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
          'pastTournaments.heading': 'Past Tournaments',
        })
      );
      mockGetPastTournaments.mockResolvedValue(mockTournaments);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      expect(screen.getByText('Past Tournaments')).toBeInTheDocument();
    });

    it('should display tournament names correctly', async () => {
      const mockTournaments = [
        createMockTournament({
          id: 'tournament-1',
          long_name: 'FIFA World Cup 2022',
        }),
        createMockTournament({
          id: 'tournament-2',
          long_name: 'Copa América 2021',
        }),
        createMockTournament({
          id: 'tournament-3',
          long_name: 'UEFA Euro 2020',
        }),
      ];

      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
          'pastTournaments.heading': 'Past Tournaments',
        })
      );
      mockGetPastTournaments.mockResolvedValue(mockTournaments);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      expect(screen.getByText('• FIFA World Cup 2022')).toBeInTheDocument();
      expect(screen.getByText('• Copa América 2021')).toBeInTheDocument();
      expect(screen.getByText('• UEFA Euro 2020')).toBeInTheDocument();
    });

    it('should display up to 5 past tournaments', async () => {
      const mockTournaments = Array.from({ length: 5 }, (_, i) =>
        createMockTournament({
          id: `tournament-${i + 1}`,
          long_name: `Tournament ${i + 1}`,
        })
      );

      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
          'pastTournaments.heading': 'Past Tournaments',
        })
      );
      mockGetPastTournaments.mockResolvedValue(mockTournaments);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      mockTournaments.forEach((tournament) => {
        expect(screen.getByText(`• ${tournament.long_name}`)).toBeInTheDocument();
      });
    });
  });

  describe('Translation keys', () => {
    it('should request translations from the correct namespace', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      await EmptyTournamentsState();

      expect(mockGetTranslations).toHaveBeenCalledWith('tournament.emptyState');
    });

    it('should use the correct translation keys', async () => {
      const mockT = vi.fn((key: string) => key) as any;
      mockGetTranslations.mockResolvedValue(mockT);
      mockGetPastTournaments.mockResolvedValue([
        createMockTournament({ long_name: 'Test Tournament' }),
      ]);

      const component = await EmptyTournamentsState();
      renderWithTheme(component);

      expect(mockT).toHaveBeenCalledWith('title');
      expect(mockT).toHaveBeenCalledWith('description');
      expect(mockT).toHaveBeenCalledWith('pastTournaments.heading');
    });
  });

  describe('Component structure', () => {
    it('should have proper spacing and layout', async () => {
      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
        })
      );
      mockGetPastTournaments.mockResolvedValue([]);

      const component = await EmptyTournamentsState();
      const { container } = renderWithTheme(component);

      const boxElement = container.firstChild as HTMLElement;
      expect(boxElement).toBeTruthy();
    });

    it('should render all elements in correct order', async () => {
      const mockTournaments = [createMockTournament()];

      mockGetTranslations.mockResolvedValue(
        createMockTranslations({
          title: 'No Active Tournaments',
          description: 'There are no active tournaments at the moment.',
          'pastTournaments.heading': 'Past Tournaments',
        })
      );
      mockGetPastTournaments.mockResolvedValue(mockTournaments);

      const component = await EmptyTournamentsState();
      const { container } = renderWithTheme(component);

      const text = container.textContent || '';

      // Trophy should come first
      expect(text.indexOf('🏆')).toBeLessThan(text.indexOf('No Active Tournaments'));

      // Title should come before description
      expect(text.indexOf('No Active Tournaments')).toBeLessThan(
        text.indexOf('There are no active tournaments at the moment.')
      );

      // Description should come before past tournaments
      expect(
        text.indexOf('There are no active tournaments at the moment.')
      ).toBeLessThan(text.indexOf('Past Tournaments'));
    });
  });
});
