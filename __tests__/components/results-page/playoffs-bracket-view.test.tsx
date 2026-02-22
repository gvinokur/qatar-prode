import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import PlayoffsBracketView from '../../../app/components/results-page/playoffs-bracket-view';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories, createMany } from '../../db/test-factories';
import { ExtendedGameData } from '../../../app/definitions';
import { PlayoffRound, Team } from '../../../app/db/tables-definition';
import * as BracketLayoutUtils from '../../../app/components/results-page/bracket-layout-utils';

// Mock BracketGameCard component
vi.mock('../../../app/components/results-page/bracket-game-card', () => ({
  default: ({ game }: { game: ExtendedGameData }) => (
    <div data-testid={`bracket-game-card-${game.id}`}>
      BracketGameCard - {game.id}
    </div>
  ),
}));

// Mock useMediaQuery hook
const mockUseMediaQuery = vi.fn();
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
  };
});

describe('PlayoffsBracketView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false); // Desktop by default
  });

  describe('Empty state', () => {
    it('should show empty state when no playoff stages exist', () => {
      renderWithTheme(
        <PlayoffsBracketView playoffStages={[]} games={[]} teamsMap={{}} />
      );

      expect(screen.getByText('Los playoffs aún no comenzaron')).toBeInTheDocument();
      expect(
        screen.getByText('El cuadro de eliminatorias se mostrará aquí cuando estén disponibles')
      ).toBeInTheDocument();
    });

    it('should not show empty state when stages exist but have no games (renders empty bracket)', () => {
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1' }),
          games: [],
        },
      ];

      const { container } = renderWithTheme(<PlayoffsBracketView playoffStages={stages} games={[]} teamsMap={{}} />);

      // Component should not show empty state message
      expect(screen.queryByText('Los playoffs aún no comenzaron')).not.toBeInTheDocument();

      // But should render an empty bracket (with SVG)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not show empty state but also not render third place game without main bracket games', () => {
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      // Component doesn't show empty state (thirdPlaceGame exists)
      expect(screen.queryByText('Los playoffs aún no comenzaron')).not.toBeInTheDocument();

      // But third place game is NOT rendered because gamePositions.length === 0
      // (third place is only shown when there are main bracket games)
      expect(screen.queryByTestId('bracket-game-card-third-place')).not.toBeInTheDocument();
    });
  });

  describe('Basic rendering', () => {
    it('should render bracket container with SVG layer', () => {
      const teams = createMany(testFactories.team, 4, (i) => ({ id: `team-${i}` }));
      const teamsMap: { [k: string]: Team } = {};
      teams.forEach((team) => {
        teamsMap[team.id] = team;
      });

      const games = createMany(testFactories.game, 2, (i) => ({
        id: `game-${i}`,
        home_team: `team-${i * 2 - 1}`,
        away_team: `team-${i * 2}`,
      }));

      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', round_name: 'Final', total_games: 1 }),
          games: [{ game_id: 'game-1' }],
        },
      ];

      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={teamsMap} />
      );

      // Check for SVG element
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render BracketGameCard for each game', () => {
      const games = createMany(testFactories.game, 3, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', round_name: 'Semifinals', total_games: 2 }),
          games: [{ game_id: 'game-1' }, { game_id: 'game-2' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByTestId('bracket-game-card-game-1')).toBeInTheDocument();
      expect(screen.getByTestId('bracket-game-card-game-2')).toBeInTheDocument();
    });

    it('should not render game card when game is missing from gamesMap', () => {
      const games = [testFactories.game({ id: 'game-1' })];
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1' }),
          games: [{ game_id: 'game-1' }, { game_id: 'missing-game' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByTestId('bracket-game-card-game-1')).toBeInTheDocument();
      expect(screen.queryByTestId('bracket-game-card-missing-game')).not.toBeInTheDocument();
    });
  });

  describe('Round labels', () => {
    it('should show "Dieciseisavos" for 16-game round (Round of 32)', () => {
      const games = createMany(testFactories.game, 16, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-32',
            round_name: 'Round of 32',
            total_games: 16,
          }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByText('Dieciseisavos')).toBeInTheDocument();
    });

    it('should show "Octavos" for 8-game round (Round of 16)', () => {
      const games = createMany(testFactories.game, 8, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-16',
            round_name: 'Round of 16',
            total_games: 8,
          }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByText('Octavos')).toBeInTheDocument();
    });

    it('should show "Cuartos" for 4-game round', () => {
      const games = createMany(testFactories.game, 4, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-4',
            round_name: 'Quarterfinals',
            total_games: 4,
          }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByText('Cuartos')).toBeInTheDocument();
    });

    it('should show "Semifinales" for 2-game round', () => {
      const games = createMany(testFactories.game, 2, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-2',
            round_name: 'Semifinals',
            total_games: 2,
          }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByText('Semifinales')).toBeInTheDocument();
    });

    it('should show "Final" for 1-game round', () => {
      const game = testFactories.game({ id: 'game-1' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-final',
            round_name: 'Final',
            total_games: 1,
            is_final: true,
          }),
          games: [{ game_id: 'game-1' }],
        },
      ];

      renderWithTheme(<PlayoffsBracketView playoffStages={stages} games={[game]} teamsMap={{}} />);

      expect(screen.getByText('Final')).toBeInTheDocument();
    });

    it('should show round label only above first game of each round', () => {
      const games = createMany(testFactories.game, 4, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-4',
            round_name: 'Quarterfinals',
            total_games: 4,
          }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Should have exactly one "Cuartos" label (not one per game)
      const labels = screen.getAllByText('Cuartos');
      expect(labels).toHaveLength(1);
    });

    it('should return empty string for unknown round size', () => {
      const games = createMany(testFactories.game, 3, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-weird',
            round_name: 'Weird Round',
            total_games: 3,
          }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Should not show any standard round label
      expect(screen.queryByText(/Dieciseisavos|Octavos|Cuartos|Semifinales|Final/)).not.toBeInTheDocument();
    });
  });

  describe('Third place game', () => {
    it('should render third place game separately below bracket', () => {
      const finalGame = testFactories.game({ id: 'final' });
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });

      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-final', is_final: true, total_games: 1 }),
          games: [{ game_id: 'final' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true, total_games: 1 }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[finalGame, thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      expect(screen.getByTestId('bracket-game-card-third-place')).toBeInTheDocument();
    });

    it('should show "3er Lugar" label for third place game', () => {
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-final', is_final: true, total_games: 1 }),
          games: [{ game_id: 'final' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true, total_games: 1 }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      const finalGame = testFactories.game({ id: 'final' });

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[finalGame, thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      expect(screen.getByText('3er Lugar')).toBeInTheDocument();
    });

    it('should not render third place game if not present', () => {
      const finalGame = testFactories.game({ id: 'final' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-final', is_final: true, total_games: 1 }),
          games: [{ game_id: 'final' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={[finalGame]} teamsMap={{}} />
      );

      expect(screen.queryByText('3er Lugar')).not.toBeInTheDocument();
    });

    it('should not render third place game when gamePositions is empty', () => {
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true, total_games: 1 }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      // Third place game should NOT render when there are no main bracket games
      // (condition: thirdPlaceGame && gamePositions.length > 0)
      expect(screen.queryByTestId('bracket-game-card-third-place')).not.toBeInTheDocument();
      expect(screen.queryByText('3er Lugar')).not.toBeInTheDocument();
    });
  });

  describe('Mobile scaling', () => {
    it('should apply MOBILE_SCALE when isMobile is true', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile

      const game = testFactories.game({ id: 'game-1' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1' }),
          games: [{ game_id: 'game-1' }],
        },
      ];

      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={[game]} teamsMap={{}} />
      );

      // Check that SVG path has scale transform applied
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Verify MOBILE_SCALE is used (0.7)
      const path = svg?.querySelector('path');
      if (path) {
        const transform = path.getAttribute('transform');
        expect(transform).toContain('scale(0.7)');
      }
    });

    it('should apply mobile scale to third place game', () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile

      const finalGame = testFactories.game({ id: 'final' });
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });

      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-final', is_final: true, total_games: 1 }),
          games: [{ game_id: 'final' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true, total_games: 1 }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[finalGame, thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      // Verify third place game is rendered with mobile scale
      expect(screen.getByTestId('bracket-game-card-third-place')).toBeInTheDocument();
      expect(screen.getByText('3er Lugar')).toBeInTheDocument();
    });

    it('should not apply mobile scale on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop

      const game = testFactories.game({ id: 'game-1' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1' }),
          games: [{ game_id: 'game-1' }],
        },
      ];

      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={[game]} teamsMap={{}} />
      );

      // Verify no mobile scale is applied (should be scale(1) or no scale at all)
      const svg = container.querySelector('svg');
      const path = svg?.querySelector('path');
      if (path) {
        const transform = path.getAttribute('transform');
        // Desktop should use scale(1)
        expect(transform).toContain('scale(1)');
      }
    });

    it('should use useMediaQuery to detect mobile breakpoint', () => {
      const game = testFactories.game({ id: 'game-1' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1' }),
          games: [{ game_id: 'game-1' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={[game]} teamsMap={{}} />
      );

      // Verify useMediaQuery was called
      expect(mockUseMediaQuery).toHaveBeenCalled();
    });
  });

  describe('SVG connections', () => {
    it('should render connection paths between rounds', () => {
      // Spy on calculateConnectionPath to verify it's called
      const calculateConnectionPathSpy = vi.spyOn(
        BracketLayoutUtils,
        'calculateConnectionPath'
      );

      const games = createMany(testFactories.game, 3, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-1',
            round_name: 'Semifinals',
            total_games: 2,
          }),
          games: [{ game_id: 'game-1' }, { game_id: 'game-2' }],
        },
        {
          ...testFactories.playoffRound({
            id: 'round-2',
            round_name: 'Final',
            total_games: 1,
            is_final: true,
          }),
          games: [{ game_id: 'game-3' }],
        },
      ];

      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Should have connection paths between semifinal games and final
      const svg = container.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Should have 2 paths (one from each semi to final)
      expect(paths?.length).toBeGreaterThan(0);

      // Verify calculateConnectionPath was called
      expect(calculateConnectionPathSpy).toHaveBeenCalled();

      calculateConnectionPathSpy.mockRestore();
    });

    it('should not render connections for the final round', () => {
      const game = testFactories.game({ id: 'game-1' });
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({
            id: 'round-final',
            round_name: 'Final',
            total_games: 1,
            is_final: true,
          }),
          games: [{ game_id: 'game-1' }],
        },
      ];

      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={[game]} teamsMap={{}} />
      );

      const svg = container.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Final round has no connections (nothing comes after it)
      expect(paths?.length).toBe(0);
    });

    it('should connect game pairs to next round game', () => {
      // Create a full bracket: 4 games -> 2 games -> 1 game
      const games = createMany(testFactories.game, 7, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', total_games: 4 }),
          games: [
            { game_id: 'game-1' },
            { game_id: 'game-2' },
            { game_id: 'game-3' },
            { game_id: 'game-4' },
          ],
        },
        {
          ...testFactories.playoffRound({ id: 'round-2', total_games: 2 }),
          games: [{ game_id: 'game-5' }, { game_id: 'game-6' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-3', total_games: 1, is_final: true }),
          games: [{ game_id: 'game-7' }],
        },
      ];

      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      const svg = container.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Should have 6 paths total:
      // - 4 paths from round 1 to round 2 (4 games -> 2 games)
      // - 2 paths from round 2 to round 3 (2 games -> 1 game)
      expect(paths?.length).toBe(6);
    });

    it('should handle missing games in connection calculation', () => {
      const games = [testFactories.game({ id: 'game-1' })];
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', total_games: 2 }),
          games: [{ game_id: 'game-1' }, { game_id: 'game-missing' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-2', total_games: 1, is_final: true }),
          games: [{ game_id: 'game-2' }],
        },
      ];

      // Should not throw error even with missing game
      const { container } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Bracket dimensions', () => {
    it('should calculate dimensions based on bracket rounds and mobile state', () => {
      const calculateBracketDimensionsSpy = vi.spyOn(
        BracketLayoutUtils,
        'calculateBracketDimensions'
      );

      const games = createMany(testFactories.game, 2, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', total_games: 2 }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Verify calculateBracketDimensions was called with correct params
      expect(calculateBracketDimensionsSpy).toHaveBeenCalled();
      const callArgs = calculateBracketDimensionsSpy.mock.calls[0];
      expect(callArgs[1]).toBe(false); // isMobile should be false (our default mock)
      expect(callArgs[2]).toBe(false); // hasThirdPlace should be false

      calculateBracketDimensionsSpy.mockRestore();
    });

    it('should recalculate dimensions when third place game exists', () => {
      const calculateBracketDimensionsSpy = vi.spyOn(
        BracketLayoutUtils,
        'calculateBracketDimensions'
      );

      const finalGame = testFactories.game({ id: 'final' });
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });

      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-final', is_final: true, total_games: 1 }),
          games: [{ game_id: 'final' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true, total_games: 1 }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[finalGame, thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      // Verify calculateBracketDimensions was called with hasThirdPlace=true
      const callArgs = calculateBracketDimensionsSpy.mock.calls[0];
      expect(callArgs[2]).toBe(true); // hasThirdPlace should be true

      calculateBracketDimensionsSpy.mockRestore();
    });
  });

  describe('Game positioning', () => {
    it('should calculate positions for all games', () => {
      const calculateGamePositionsSpy = vi.spyOn(BracketLayoutUtils, 'calculateGamePositions');

      const games = createMany(testFactories.game, 4, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', total_games: 4 }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Verify calculateGamePositions was called
      expect(calculateGamePositionsSpy).toHaveBeenCalled();

      calculateGamePositionsSpy.mockRestore();
    });

    it('should filter out third place stage from bracket rounds', () => {
      const calculateGamePositionsSpy = vi.spyOn(BracketLayoutUtils, 'calculateGamePositions');

      const finalGame = testFactories.game({ id: 'final' });
      const thirdPlaceGame = testFactories.game({ id: 'third-place' });

      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-final', is_final: true, total_games: 1 }),
          games: [{ game_id: 'final' }],
        },
        {
          ...testFactories.playoffRound({ id: 'round-3rd', is_third_place: true, total_games: 1 }),
          games: [{ game_id: 'third-place' }],
        },
      ];

      renderWithTheme(
        <PlayoffsBracketView
          playoffStages={stages}
          games={[finalGame, thirdPlaceGame]}
          teamsMap={{}}
        />
      );

      // Verify calculateGamePositions was called with only non-third-place rounds
      const callArgs = calculateGamePositionsSpy.mock.calls[0];
      const bracketRounds = callArgs[0];
      expect(bracketRounds.length).toBe(1); // Only the final round, not third place
      expect(bracketRounds[0]?.games[0]?.id).toBe('final');

      calculateGamePositionsSpy.mockRestore();
    });
  });

  describe('Memoization', () => {
    it('should memoize gamesMap creation', () => {
      const games = createMany(testFactories.game, 2, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', total_games: 2 }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      const { rerenderWithTheme } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Rerender with same games (should use memoized gamesMap)
      rerenderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByTestId('bracket-game-card-game-1')).toBeInTheDocument();
    });

    it('should memoize bracket rounds calculation', () => {
      const games = createMany(testFactories.game, 2, (i) => ({ id: `game-${i}` }));
      const stages: (PlayoffRound & { games: ReadonlyArray<{ game_id: string }> })[] = [
        {
          ...testFactories.playoffRound({ id: 'round-1', total_games: 2 }),
          games: games.map((g) => ({ game_id: g.id })),
        },
      ];

      const { rerenderWithTheme } = renderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      // Rerender with same stages (should use memoized bracket rounds)
      rerenderWithTheme(
        <PlayoffsBracketView playoffStages={stages} games={games} teamsMap={{}} />
      );

      expect(screen.getByTestId('bracket-game-card-game-1')).toBeInTheDocument();
    });
  });
});
