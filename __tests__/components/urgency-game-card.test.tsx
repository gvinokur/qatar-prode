import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { UrgencyGameCard } from '../../app/components/urgency-game-card';
import type { ExtendedGameData } from '../../app/definitions';
import type { Team } from '../../app/db/tables-definition';

// Mock GameCountdownDisplay
vi.mock('../../app/components/game-countdown-display', () => ({
  default: ({ gameDate, compact, hideDate }: any) => (
    <div data-testid="countdown-display">
      Countdown: {gameDate.toISOString()} | Compact: {String(compact)} | HideDate: {String(hideDate)}
    </div>
  )
}));

// Mock BoostBadge (named export)
vi.mock('../../app/components/boost-badge', () => ({
  default: ({ type }: any) => <div data-testid="boost-badge">{type}</div>,
  BoostBadge: ({ type }: any) => <div data-testid="boost-badge">{type}</div>
}));

// Mock utility functions
vi.mock('../../app/utils/playoffs-rule-helper', () => ({
  getTeamDescription: (rule: any) => rule || 'TBD'
}));

vi.mock('../../app/utils/theme-utils', () => ({
  getThemeLogoUrl: (theme: any) => theme ? `https://example.com/${theme}.png` : null
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('UrgencyGameCard', () => {
  const mockTeamsMap: Record<string, Team> = {
    'team1': {
      id: 'team1',
      name: 'Argentina',
      short_name: 'ARG',
      tournament_id: 'tournament1',
      theme: 'argentina',
      group_id: null
    },
    'team2': {
      id: 'team2',
      name: 'Brasil',
      short_name: 'BRA',
      tournament_id: 'tournament1',
      theme: 'brasil',
      group_id: null
    }
  };

  const mockGame: ExtendedGameData = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date('2024-11-22T16:30:00Z'),
    location: 'Stadium 1',
    game_type: 'group',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_local_timezone: 'America/Montevideo',
    playoffStage: undefined
  };

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders team names correctly', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('ARG')).toBeInTheDocument();
      expect(screen.getByText('BRA')).toBeInTheDocument();
      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    it('renders team logos when available', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/argentina.png');
      expect(images[0]).toHaveAttribute('alt', 'ARG');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/brasil.png');
      expect(images[1]).toHaveAttribute('alt', 'BRA');
    });

    it('renders GameCountdownDisplay with correct props', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      const countdown = screen.getByTestId('countdown-display');
      expect(countdown).toBeInTheDocument();
      expect(countdown).toHaveTextContent('Compact: true');
      expect(countdown).toHaveTextContent('HideDate: true');
    });

    it('renders edit button when not disabled', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /editar predicción/i });
      expect(editButton).toBeInTheDocument();
    });

    it('hides edit button when disabled', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
          disabled={true}
        />
      );

      const editButton = screen.queryByRole('button', { name: /editar predicción/i });
      expect(editButton).not.toBeInTheDocument();
    });
  });

  describe('prediction display', () => {
    it('does not show scores when not predicted', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText(/\d+ - \d+/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('boost-badge')).not.toBeInTheDocument();
    });

    it('shows scores when predicted', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={true}
          prediction={{
            homeScore: 2,
            awayScore: 1,
            boostType: null
          }}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('2 - 1')).toBeInTheDocument();
    });

    it('shows boost badge when boost is applied', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={true}
          prediction={{
            homeScore: 2,
            awayScore: 1,
            boostType: 'silver'
          }}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('2 - 1')).toBeInTheDocument();
      expect(screen.getByTestId('boost-badge')).toHaveTextContent('silver');
    });

    it('shows golden boost badge', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={true}
          prediction={{
            homeScore: 3,
            awayScore: 0,
            boostType: 'golden'
          }}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByTestId('boost-badge')).toHaveTextContent('golden');
    });
  });

  describe('interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /editar predicción/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith('game1');
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('handles missing team logos gracefully', () => {
      const teamsWithoutLogos: Record<string, Team> = {
        'team1': { ...mockTeamsMap['team1'], theme: undefined },
        'team2': { ...mockTeamsMap['team2'], theme: undefined }
      };

      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={teamsWithoutLogos}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('ARG')).toBeInTheDocument();
      expect(screen.getByText('BRA')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders with prediction but no boost', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={true}
          prediction={{
            homeScore: 1,
            awayScore: 1,
            boostType: null
          }}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('1 - 1')).toBeInTheDocument();
      expect(screen.queryByTestId('boost-badge')).not.toBeInTheDocument();
    });

    it('renders with 0-0 score', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={true}
          prediction={{
            homeScore: 0,
            awayScore: 0,
            boostType: null
          }}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('0 - 0')).toBeInTheDocument();
    });

    it('renders with high scores', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={true}
          prediction={{
            homeScore: 10,
            awayScore: 8,
            boostType: null
          }}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('10 - 8')).toBeInTheDocument();
    });
  });

  describe('playoff games', () => {
    it('renders playoff game correctly', () => {
      const playoffGame: ExtendedGameData = {
        ...mockGame,
        game_type: 'playoff',
        playoffStage: {
          id: 'stage1',
          tournament_id: 'tournament1',
          round_name: 'Semifinal',
          round_order: 1,
          is_final: false,
          is_third_place: false
        }
      };

      renderWithTheme(
        <UrgencyGameCard
          game={playoffGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('ARG')).toBeInTheDocument();
      expect(screen.getByText('BRA')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label for edit button', () => {
      renderWithTheme(
        <UrgencyGameCard
          game={mockGame}
          teamsMap={mockTeamsMap}
          isPredicted={false}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: 'Editar predicción: ARG vs BRA' });
      expect(editButton).toBeInTheDocument();
    });
  });
});
