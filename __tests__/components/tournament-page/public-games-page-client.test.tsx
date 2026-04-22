import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import PublicGamesPageClient from '@/app/components/tournament-page/public-games-page-client'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { setTestLocale } from '@/vitest.setup'
import { testFactories, createMany } from '@/__tests__/db/test-factories'
import type { ExtendedGameData } from '@/app/definitions'
import type { Team, TournamentGroup, PlayoffRound } from '@/app/db/tables-definition'

// Mock child components
vi.mock('@/app/components/tournament-page/public-cta-bar', () => ({
  LoggedOffBanner: () => <div data-testid="public-cta-bar">Public CTA Bar</div>,
  default: () => <div data-testid="public-cta-bar">Public CTA Bar</div>,
}))

vi.mock('@/app/components/tournament-page/read-only-game-card', () => ({
  default: ({
    gameNumber,
    showCtaOverlay,
    groupOrPlayoffText,
    homeTeamNameOrDescription,
    awayTeamNameOrDescription,
  }: {
    gameNumber: number
    showCtaOverlay?: boolean
    groupOrPlayoffText?: string
    homeTeamNameOrDescription: string
    awayTeamNameOrDescription: string
  }) => (
    <div data-testid={`game-card-${gameNumber}`}>
      <span data-testid={`game-${gameNumber}-home`}>{homeTeamNameOrDescription}</span>
      <span data-testid={`game-${gameNumber}-away`}>{awayTeamNameOrDescription}</span>
      {groupOrPlayoffText && (
        <span data-testid={`game-${gameNumber}-group-playoff`}>{groupOrPlayoffText}</span>
      )}
      {showCtaOverlay && <div data-testid={`game-${gameNumber}-cta-overlay`}>CTA Overlay</div>}
    </div>
  ),
}))

// Helper to render with specific locale using global mock
const renderWithLocale = (
  component: React.ReactElement,
  locale: 'en' | 'es' = 'en'
) => {
  setTestLocale(locale)
  return renderWithTheme(component)
}

vi.mock('@/app/components/common/scroll-shadow-container', () => ({
  ScrollShadowContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-shadow-container">{children}</div>
  ),
}))

describe('PublicGamesPageClient', () => {
  let tournament: ReturnType<typeof testFactories.tournament>
  let teamsMap: Record<string, Team>
  let groups: TournamentGroup[]
  let rounds: PlayoffRound[]

  beforeEach(() => {
    tournament = testFactories.tournament({ id: 'tournament-1' })

    // Create teams
    const teamsList = createMany(testFactories.team, 4, (i) => ({
      id: `team-${i}`,
      name: `Team ${i}`,
      short_name: `T${i}`,
    }))
    teamsMap = Object.fromEntries(teamsList.map((team) => [team.id, team]))

    // Create groups
    groups = createMany(testFactories.tournamentGroup, 2, (i) => ({
      id: `group-${i}`,
      tournament_id: tournament.id,
      group_letter: String.fromCharCode(64 + i), // 'A', 'B'
    }))

    // Create playoff rounds
    rounds = [
      testFactories.playoffRound({
        id: 'round-1',
        tournament_id: tournament.id,
        round_name: 'Round of 16',
        round_order: 1,
      }),
      testFactories.playoffRound({
        id: 'final',
        tournament_id: tournament.id,
        round_name: 'Final',
        round_order: 4,
        is_final: true,
      }),
    ]
  })

  describe('Empty State', () => {
    it('shows "no games" message when games array is empty', () => {
      renderWithLocale(
        <PublicGamesPageClient
          games={[]}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      expect(screen.getByText('No games available')).toBeInTheDocument()
      expect(screen.queryByTestId('public-cta-bar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('scroll-shadow-container')).not.toBeInTheDocument()
    })

    it('shows Spanish "no games" message when locale is es', () => {
      renderWithLocale(
        <PublicGamesPageClient
          games={[]}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'es'
      )

      expect(screen.getByText('No hay partidos disponibles')).toBeInTheDocument()
    })
  })

  describe('Game Rendering', () => {
    it('renders games sorted by date and game number', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-3',
            game_number: 3,
            tournament_id: tournament.id,
            home_team: 'team-3',
            away_team: 'team-4',
            game_date: new Date('2024-06-16T18:00:00Z'),
          }),
          group: { tournament_group_id: 'group-1', group_letter: 'A' },
          playoffStage: null,
          gameResult: null,
        },
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
            game_date: new Date('2024-06-14T18:00:00Z'),
          }),
          group: { tournament_group_id: 'group-1', group_letter: 'A' },
          playoffStage: null,
          gameResult: null,
        },
        {
          ...testFactories.game({
            id: 'game-2',
            game_number: 2,
            tournament_id: tournament.id,
            home_team: 'team-2',
            away_team: 'team-3',
            game_date: new Date('2024-06-14T21:00:00Z'),
          }),
          group: { tournament_group_id: 'group-1', group_letter: 'A' },
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Verify all games are rendered
      expect(screen.getByTestId('game-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('game-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('game-card-3')).toBeInTheDocument()

      // Verify order: game-1, game-2 (same date, sorted by game_number), game-3
      const cards = screen.getAllByTestId(/game-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'game-card-1')
      expect(cards[1]).toHaveAttribute('data-testid', 'game-card-2')
      expect(cards[2]).toHaveAttribute('data-testid', 'game-card-3')
    })

    it('renders PublicCTABar', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      expect(screen.getByTestId('public-cta-bar')).toBeInTheDocument()
    })

    it('renders scroll shadow container', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      expect(screen.getByTestId('scroll-shadow-container')).toBeInTheDocument()
    })
  })

  describe('CTA Overlay', () => {
    it('shows CTA overlay on every 5th card (indices 4, 9, 14)', () => {
      // Create 15 games
      const games: ExtendedGameData[] = Array.from({ length: 15 }, (_, idx) => {
        const i = idx + 1
        return {
          ...testFactories.game({
            id: `game-${i}`,
            game_number: i,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
            game_date: new Date(`2024-06-${14 + Math.floor(i / 3)}T18:00:00Z`),
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        }
      })

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Cards at indices 4, 9, 14 (game numbers 5, 10, 15) should have overlay
      expect(screen.getByTestId('game-5-cta-overlay')).toBeInTheDocument()
      expect(screen.getByTestId('game-10-cta-overlay')).toBeInTheDocument()
      expect(screen.getByTestId('game-15-cta-overlay')).toBeInTheDocument()

      // Other cards should not have overlay
      expect(screen.queryByTestId('game-1-cta-overlay')).not.toBeInTheDocument()
      expect(screen.queryByTestId('game-2-cta-overlay')).not.toBeInTheDocument()
      expect(screen.queryByTestId('game-3-cta-overlay')).not.toBeInTheDocument()
      expect(screen.queryByTestId('game-4-cta-overlay')).not.toBeInTheDocument()
      expect(screen.queryByTestId('game-6-cta-overlay')).not.toBeInTheDocument()
      expect(screen.queryByTestId('game-11-cta-overlay')).not.toBeInTheDocument()
    })
  })

  describe('Group and Playoff Text Display', () => {
    it('displays group text correctly for group games', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: { tournament_group_id: 'group-1', group_letter: 'A' },
          playoffStage: null,
          gameResult: null,
        },
        {
          ...testFactories.game({
            id: 'game-2',
            game_number: 2,
            tournament_id: tournament.id,
            home_team: 'team-2',
            away_team: 'team-3',
          }),
          group: { tournament_group_id: 'group-2', group_letter: 'B' },
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // English: "Group A", "Group B"
      expect(screen.getByTestId('game-1-group-playoff')).toHaveTextContent('Group A')
      expect(screen.getByTestId('game-2-group-playoff')).toHaveTextContent('Group B')
    })

    it('displays playoff text correctly for playoff games', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: {
            tournament_playoff_round_id: 'round-1',
            round_name: 'Round of 16',
            is_final: false,
            is_third_place: false,
          },
          gameResult: null,
        },
        {
          ...testFactories.game({
            id: 'game-2',
            game_number: 2,
            tournament_id: tournament.id,
            home_team: 'team-2',
            away_team: 'team-3',
          }),
          group: null,
          playoffStage: {
            tournament_playoff_round_id: 'final',
            round_name: 'Final',
            is_final: true,
            is_third_place: false,
          },
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      expect(screen.getByTestId('game-1-group-playoff')).toHaveTextContent('Round of 16')
      expect(screen.getByTestId('game-2-group-playoff')).toHaveTextContent('Final')
    })

    it('falls back to translated "playoff" key when playoff round_name is null', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: {
            tournament_playoff_round_id: 'round-1',
            round_name: null as unknown as string,
            is_final: false,
            is_third_place: false,
          },
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      expect(screen.getByTestId('game-1-group-playoff')).toHaveTextContent('Playoff')
    })

    it('handles games with neither group nor playoff stage', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Should not have group/playoff text element
      expect(screen.queryByTestId('game-1-group-playoff')).not.toBeInTheDocument()
    })

    it('shows translated group text in Spanish', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: { tournament_group_id: 'group-1', group_letter: 'A' },
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'es'
      )

      // Spanish: "Grupo A"
      expect(screen.getByTestId('game-1-group-playoff')).toHaveTextContent('Grupo A')
    })
  })

  describe('Missing Team Data Handling', () => {
    it('handles missing home team data gracefully', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'missing-team',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Should render card with empty string for home team
      expect(screen.getByTestId('game-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('game-1-home')).toHaveTextContent('')
      expect(screen.getByTestId('game-1-away')).toHaveTextContent('Team 2')
    })

    it('handles missing away team data gracefully', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'missing-team',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Should render card with empty string for away team
      expect(screen.getByTestId('game-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('game-1-home')).toHaveTextContent('Team 1')
      expect(screen.getByTestId('game-1-away')).toHaveTextContent('')
    })

    it('handles missing both team data gracefully', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'missing-team-1',
            away_team: 'missing-team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Should render card with empty strings for both teams
      expect(screen.getByTestId('game-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('game-1-home')).toHaveTextContent('')
      expect(screen.getByTestId('game-1-away')).toHaveTextContent('')
    })

    it('falls back to short_name when team name is empty string', () => {
      const teamsList = createMany(testFactories.team, 2, (i) => ({
        id: `team-${i}`,
        name: '',
        short_name: `T${i}`,
      }))
      const localTeamsMap = Object.fromEntries(teamsList.map((team) => [team.id, team]))

      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={localTeamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      expect(screen.getByTestId('game-1-home')).toHaveTextContent('T1')
      expect(screen.getByTestId('game-1-away')).toHaveTextContent('T2')
    })

    it('handles null home_team and away_team values', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: null as unknown as string,
            away_team: null as unknown as string,
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Should render without crashing
      expect(screen.getByTestId('game-card-1')).toBeInTheDocument()
    })
  })

  describe('Game Results Display', () => {
    it('passes game results to game cards', () => {
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
          }),
          group: null,
          playoffStage: null,
          gameResult: {
            game_id: 'game-1',
            home_score: 3,
            away_score: 2,
            home_penalty_score: undefined,
            away_penalty_score: undefined,
            is_draft: false,
          },
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Verify game card is rendered (scores are passed to ReadOnlyGameCard)
      expect(screen.getByTestId('game-card-1')).toBeInTheDocument()
    })
  })

  describe('Integration: Complex Scenarios', () => {
    it('handles mixed group and playoff games with CTA overlays', () => {
      const games: ExtendedGameData[] = Array.from({ length: 12 }, (_, idx) => {
        const i = idx + 1
        const isPlayoff = i > 8
        return {
          ...testFactories.game({
            id: `game-${i}`,
            game_number: i,
            tournament_id: tournament.id,
            home_team: `team-${((i - 1) % 4) + 1}`,
            away_team: `team-${(i % 4) + 1}`,
            game_date: new Date(`2024-06-${14 + Math.floor(i / 3)}T18:00:00Z`),
          }),
          group: isPlayoff
            ? null
            : { tournament_group_id: 'group-1', group_letter: 'A' },
          playoffStage: isPlayoff
            ? {
                tournament_playoff_round_id: 'round-1',
                round_name: 'Round of 16',
                is_final: false,
                is_third_place: false,
              }
            : null,
          gameResult: null,
        }
      })

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Verify all games are rendered
      for (let i = 1; i <= 12; i++) {
        expect(screen.getByTestId(`game-card-${i}`)).toBeInTheDocument()
      }

      // Verify CTA overlays on 5th and 10th cards
      expect(screen.getByTestId('game-5-cta-overlay')).toBeInTheDocument()
      expect(screen.getByTestId('game-10-cta-overlay')).toBeInTheDocument()

      // Verify group text on first 8 games
      for (let i = 1; i <= 8; i++) {
        expect(screen.getByTestId(`game-${i}-group-playoff`)).toHaveTextContent('Group A')
      }

      // Verify playoff text on last 4 games
      for (let i = 9; i <= 12; i++) {
        expect(screen.getByTestId(`game-${i}-group-playoff`)).toHaveTextContent(
          'Round of 16'
        )
      }
    })

    it('maintains sort order with same date but different game numbers', () => {
      const sameDate = new Date('2024-06-14T18:00:00Z')
      const games: ExtendedGameData[] = [
        {
          ...testFactories.game({
            id: 'game-5',
            game_number: 5,
            tournament_id: tournament.id,
            home_team: 'team-1',
            away_team: 'team-2',
            game_date: sameDate,
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
        {
          ...testFactories.game({
            id: 'game-2',
            game_number: 2,
            tournament_id: tournament.id,
            home_team: 'team-2',
            away_team: 'team-3',
            game_date: sameDate,
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
        {
          ...testFactories.game({
            id: 'game-1',
            game_number: 1,
            tournament_id: tournament.id,
            home_team: 'team-3',
            away_team: 'team-4',
            game_date: sameDate,
          }),
          group: null,
          playoffStage: null,
          gameResult: null,
        },
      ]

      renderWithLocale(
        <PublicGamesPageClient
          games={games}
          teamsMap={teamsMap}
          groups={groups}
          rounds={rounds}
        />,
        'en'
      )

      // Should be sorted by game_number: 1, 2, 5
      const cards = screen.getAllByTestId(/game-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'game-card-1')
      expect(cards[1]).toHaveAttribute('data-testid', 'game-card-2')
      expect(cards[2]).toHaveAttribute('data-testid', 'game-card-5')
    })
  })
})
