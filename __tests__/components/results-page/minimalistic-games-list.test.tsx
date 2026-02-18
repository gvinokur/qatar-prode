import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import { ExtendedGameData } from '@/app/definitions'
import { Team } from '@/app/db/tables-definition'
import MinimalisticGamesList from '@/app/components/results-page/minimalistic-games-list'

// Mock only the playoffs-rule-helper module (formatGameScore is simple enough to test without mocking)
vi.mock('@/app/utils/playoffs-rule-helper', () => ({
  getTeamDescription: vi.fn((rule: any, t: any, useShort: boolean = false) => {
    if (!rule) return ''
    if (rule.position && rule.group) {
      if (rule.position === 1) return `Primero Grupo ${rule.group}`
      if (rule.position === 2) return `Segundo Grupo ${rule.group}`
      if (rule.position === 3) return `Tercero Grupo(s) ${rule.group}`
    }
    if (rule.winner !== undefined && rule.game) {
      return rule.winner ? `Ganador #${rule.game}` : `Perdedor #${rule.game}`
    }
    return ''
  }),
  isGroupFinishRule: vi.fn(),
  isTeamWinnerRule: vi.fn(),
}))

import * as playoffsHelper from '@/app/utils/playoffs-rule-helper'

describe('MinimalisticGamesList', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.mocked(playoffsHelper.getTeamDescription).mockClear()
  })

  const createTeam = (id: string, name: string): Team =>
    testFactories.team({ id, name, short_name: id.toUpperCase().slice(0, 3) })

  const createGame = (overrides?: Partial<ExtendedGameData>): ExtendedGameData => {
    const game = testFactories.game(overrides)
    return {
      ...game,
      group: undefined,
      playoffStage: undefined,
      gameResult: null,
      ...overrides,
    }
  }

  describe('Basic rendering', () => {
    it('renders all games in the list', async () => {
      const team1 = createTeam('argentina', 'Argentina')
      const team2 = createTeam('brazil', 'Brazil')
      const team3 = createTeam('chile', 'Chile')
      const team4 = createTeam('uruguay', 'Uruguay')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
        [team3.id]: team3,
        [team4.id]: team4,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false },
        }),
        createGame({
          id: 'game-2',
          game_number: 2,
          home_team: team3.id,
          away_team: team4.id,
          gameResult: { game_id: 'game-2', home_score: 0, away_score: 0, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Verify all teams are displayed
      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Brazil')).toBeInTheDocument()
      expect(screen.getByText('Chile')).toBeInTheDocument()
      expect(screen.getByText('Uruguay')).toBeInTheDocument()
    })

    it('shows team names from teamsMap', async () => {
      const team1 = createTeam('germany', 'Germany')
      const team2 = createTeam('spain', 'Spain')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 1, away_score: 1, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      expect(screen.getByText('Germany')).toBeInTheDocument()
      expect(screen.getByText('Spain')).toBeInTheDocument()
    })

    it('shows scores (home_score - away_score)', async () => {
      const team1 = createTeam('france', 'France')
      const team2 = createTeam('italy', 'Italy')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 3, away_score: 2, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      expect(screen.getByText('3 - 2')).toBeInTheDocument()
    })
  })

  describe('Game sorting', () => {
    it('sorts games by game_number ascending', async () => {
      const team1 = createTeam('argentina', 'Argentina')
      const team2 = createTeam('brazil', 'Brazil')
      const team3 = createTeam('chile', 'Chile')
      const team4 = createTeam('uruguay', 'Uruguay')
      const team5 = createTeam('colombia', 'Colombia')
      const team6 = createTeam('peru', 'Peru')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
        [team3.id]: team3,
        [team4.id]: team4,
        [team5.id]: team5,
        [team6.id]: team6,
      }

      // Create games in random order
      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-3',
          game_number: 3,
          home_team: team5.id,
          away_team: team6.id,
          gameResult: { game_id: 'game-3', home_score: 1, away_score: 0, is_draft: false },
        }),
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false },
        }),
        createGame({
          id: 'game-2',
          game_number: 2,
          home_team: team3.id,
          away_team: team4.id,
          gameResult: { game_id: 'game-2', home_score: 0, away_score: 0, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      const { container } = renderWithTheme(component)

      // Get all game rows
      const gameRows = container.querySelectorAll('[class*="MuiTypography"]')
      const gameTexts = Array.from(gameRows).map((row) => row.textContent)

      // Find the indices of each game's teams
      const game1Index = gameTexts.findIndex((text) => text?.includes('Argentina'))
      const game2Index = gameTexts.findIndex((text) => text?.includes('Chile'))
      const game3Index = gameTexts.findIndex((text) => text?.includes('Colombia'))

      // Verify order: game 1 should come before game 2, and game 2 before game 3
      expect(game1Index).toBeLessThan(game2Index)
      expect(game2Index).toBeLessThan(game3Index)
    })

    it('first game shown is lowest game_number', async () => {
      const team1 = createTeam('portugal', 'Portugal')
      const team2 = createTeam('netherlands', 'Netherlands')
      const team3 = createTeam('belgium', 'Belgium')
      const team4 = createTeam('england', 'England')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
        [team3.id]: team3,
        [team4.id]: team4,
      }

      // Create games with game_number 5 and 10
      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-10',
          game_number: 10,
          home_team: team3.id,
          away_team: team4.id,
          gameResult: { game_id: 'game-10', home_score: 2, away_score: 2, is_draft: false },
        }),
        createGame({
          id: 'game-5',
          game_number: 5,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-5', home_score: 1, away_score: 1, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      const { container } = renderWithTheme(component)

      // Get all game rows
      const gameRows = container.querySelectorAll('[class*="MuiTypography"]')
      const firstGameText = gameRows[0]?.textContent

      // First game should be game 5 (Portugal vs Netherlands)
      expect(firstGameText).toContain('Portugal')
      expect(firstGameText).toContain('Netherlands')
    })
  })

  describe('Penalty results', () => {
    it('shows penalty result when game has penalties', async () => {
      const team1 = createTeam('argentina', 'Argentina')
      const team2 = createTeam('brazil', 'Brazil')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: {
            game_id: 'game-1',
            home_score: 2,
            away_score: 2,
            home_penalty_score: 4,
            away_penalty_score: 3,
            is_draft: false,
          },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Verify penalty is displayed with regular score
      expect(screen.getByText('2 - 2 (4-3p)')).toBeInTheDocument()
    })

    it('uses formatPenaltyResult() utility correctly', async () => {
      const team1 = createTeam('germany', 'Germany')
      const team2 = createTeam('italy', 'Italy')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: {
            game_id: 'game-1',
            home_score: 1,
            away_score: 1,
            home_penalty_score: 5,
            away_penalty_score: 4,
            is_draft: false,
          },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Verify the complete format with penalty shootout
      expect(screen.getByText('1 - 1 (5-4p)')).toBeInTheDocument()
    })

    it('format shows regular score and penalty score', async () => {
      const team1 = createTeam('france', 'France')
      const team2 = createTeam('spain', 'Spain')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: {
            game_id: 'game-1',
            home_score: 0,
            away_score: 0,
            home_penalty_score: 3,
            away_penalty_score: 2,
            is_draft: false,
          },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Expected format: "0 - 0 (3-2p)"
      expect(screen.getByText('0 - 0 (3-2p)')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('shows team code when team not in teamsMap', async () => {
      const team1 = createTeam('argentina', 'Argentina')

      const teamsMap = {
        [team1.id]: team1,
        // team2 is missing from teamsMap
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: 'unknown-team',
          gameResult: { game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Home team should show name
      expect(screen.getByText('Argentina')).toBeInTheDocument()

      // Away team not in map - should show 'TBD' (since getTeamDescription returns '' and falls back to 'TBD')
      expect(screen.getByText('TBD')).toBeInTheDocument()
    })

    it('shows rule description when team is null but rule exists', async () => {
      const teamsMap = {}

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: null,
          away_team: null,
          home_team_rule: { position: 1, group: 'A' },
          away_team_rule: { position: 2, group: 'B' },
          gameResult: { game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Should show rule descriptions
      expect(screen.getByText('Primero Grupo A')).toBeInTheDocument()
      expect(screen.getByText('Segundo Grupo B')).toBeInTheDocument()
    })

    it('shows TBD when team is null and no rule exists', async () => {
      const teamsMap = {}

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: null,
          away_team: null,
          home_team_rule: undefined,
          away_team_rule: undefined,
          gameResult: { game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Should show 'TBD' for both teams
      const tbdElements = screen.getAllByText('TBD')
      expect(tbdElements).toHaveLength(2)
    })

    it('empty state when no games provided', async () => {
      const teamsMap = {}
      const games: ExtendedGameData[] = []

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      expect(screen.getByText('No hay partidos disponibles')).toBeInTheDocument()
    })

    it('handles games without scores', async () => {
      const team1 = createTeam('portugal', 'Portugal')
      const team2 = createTeam('croatia', 'Croatia')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: null,
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Teams should be displayed
      expect(screen.getByText('Portugal')).toBeInTheDocument()
      expect(screen.getByText('Croatia')).toBeInTheDocument()

      // Score should show dashes
      expect(screen.getByText('- - -')).toBeInTheDocument()
    })

    it('handles games with partial scores (home score only)', async () => {
      const team1 = createTeam('netherlands', 'Netherlands')
      const team2 = createTeam('belgium', 'Belgium')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 2, away_score: undefined, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Should display partial score
      expect(screen.getByText('2 - -')).toBeInTheDocument()
    })

    it('handles games with zero scores', async () => {
      const team1 = createTeam('england', 'England')
      const team2 = createTeam('scotland', 'Scotland')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 0, away_score: 0, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Should display 0-0
      expect(screen.getByText('0 - 0')).toBeInTheDocument()
    })

    it('handles games with large scores', async () => {
      const team1 = createTeam('brazil', 'Brazil')
      const team2 = createTeam('bolivia', 'Bolivia')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: { game_id: 'game-1', home_score: 7, away_score: 1, is_draft: false },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Should display large score correctly
      expect(screen.getByText('7 - 1')).toBeInTheDocument()
    })

    it('handles penalty shootout with zero regular score', async () => {
      const team1 = createTeam('germany', 'Germany')
      const team2 = createTeam('france', 'France')

      const teamsMap = {
        [team1.id]: team1,
        [team2.id]: team2,
      }

      const games: ExtendedGameData[] = [
        createGame({
          id: 'game-1',
          game_number: 1,
          home_team: team1.id,
          away_team: team2.id,
          gameResult: {
            game_id: 'game-1',
            home_score: 0,
            away_score: 0,
            home_penalty_score: 5,
            away_penalty_score: 4,
            is_draft: false,
          },
        }),
      ]

      const component = await MinimalisticGamesList({ games, teamsMap })
      renderWithTheme(component)

      // Should show 0-0 with penalties
      expect(screen.getByText('0 - 0 (5-4p)')).toBeInTheDocument()
    })
  })
})
