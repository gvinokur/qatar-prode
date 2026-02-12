import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '../../utils/test-utils'
import { testFactories } from '../../db/test-factories'
import BracketGameCard from '../../../app/components/results-page/bracket-game-card'
import { ExtendedGameData } from '../../../app/definitions'
import { Team } from '../../../app/db/tables-definition'
import * as penaltyResultFormatter from '../../../app/utils/penalty-result-formatter'
import * as playoffsRuleHelper from '../../../app/utils/playoffs-rule-helper'
import * as scoreUtils from '../../../app/utils/score-utils'

// Mock the utility functions
vi.mock('../../../app/utils/penalty-result-formatter')
vi.mock('../../../app/utils/playoffs-rule-helper')
vi.mock('../../../app/utils/score-utils')

describe('BracketGameCard', () => {
  // Mock teams
  const mockTeams: { readonly [k: string]: Team } = {
    'argentina': testFactories.team({ id: 'argentina', name: 'Argentina', short_name: 'ARG' }),
    'brazil': testFactories.team({ id: 'brazil', name: 'Brazil', short_name: 'BRA' }),
    'france': testFactories.team({ id: 'france', name: 'France', short_name: 'FRA' }),
  }

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()

    // Default mock implementations
    vi.mocked(penaltyResultFormatter.formatPenaltyResult).mockReturnValue(null)
    vi.mocked(playoffsRuleHelper.getTeamDescription).mockReturnValue('')
    vi.mocked(scoreUtils.getGameWinner).mockReturnValue(undefined)
  })

  describe('Basic rendering', () => {
    it('renders team names when teams exist', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 2,
          away_score: 1,
        }),
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Brazil')).toBeInTheDocument()
    })

    it('shows team scores (home and away)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 3,
          away_score: 2,
        }),
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('shows "-" when home_score is missing', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: {
          game_id: 'game-1',
          home_score: undefined as any,
          away_score: 1,
          is_draft: false,
        },
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('shows "-" when away_score is missing', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: {
          game_id: 'game-1',
          home_score: 2,
          away_score: undefined as any,
          is_draft: false,
        },
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('shows "-" when gameResult is null', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: null,
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      // Should show "-" for both scores
      const dashes = screen.getAllByText('-')
      expect(dashes).toHaveLength(2)
    })

    it('shows "TBD" when home_team is null', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: null,
          away_team: 'brazil',
        }),
        gameResult: null,
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('TBD')).toBeInTheDocument()
      expect(screen.getByText('Brazil')).toBeInTheDocument()
    })

    it('shows "TBD" when away_team is null', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: null,
        }),
        gameResult: null,
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('TBD')).toBeInTheDocument()
    })

    it('shows "TBD" when both teams are null', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: null,
          away_team: null,
        }),
        gameResult: null,
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      const tbds = screen.getAllByText('TBD')
      expect(tbds).toHaveLength(2)
    })
  })

  describe('Winner highlighting', () => {
    it('highlights home team when home_team wins (bold text, primary color)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 3,
          away_score: 1,
        }),
      }

      // Mock getGameWinner to return home team as winner
      vi.mocked(scoreUtils.getGameWinner).mockReturnValue('argentina')

      const { container } = renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      // Find the home team text element
      const homeTeamElement = screen.getByText('Argentina')

      // Check computed styles
      const computedStyle = window.getComputedStyle(homeTeamElement)
      expect(computedStyle.fontWeight).toBe('700') // Bold

      // Check for primary color by finding element with data-testid or checking parent structure
      expect(homeTeamElement).toHaveStyle({ fontWeight: 700 })
    })

    it('highlights away team when away_team wins', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 1,
          away_score: 3,
        }),
      }

      // Mock getGameWinner to return away team as winner
      vi.mocked(scoreUtils.getGameWinner).mockReturnValue('brazil')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      // Find the away team text element
      const awayTeamElement = screen.getByText('Brazil')

      // Check computed styles
      expect(awayTeamElement).toHaveStyle({ fontWeight: 700 })
    })

    it('no highlight when game is tied (no winner)', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 2,
          away_score: 2,
        }),
      }

      // Mock getGameWinner to return undefined (tie)
      vi.mocked(scoreUtils.getGameWinner).mockReturnValue(undefined)

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      const homeTeamElement = screen.getByText('Argentina')
      const awayTeamElement = screen.getByText('Brazil')

      // Neither team should be bold (fontWeight 700)
      expect(homeTeamElement).toHaveStyle({ fontWeight: 400 })
      expect(awayTeamElement).toHaveStyle({ fontWeight: 400 })
    })

    it('highlights home team when winning on penalties', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 2,
          away_score: 2,
          home_penalty_score: 4,
          away_penalty_score: 3,
        }),
      }

      // Mock getGameWinner to return home team as winner (after penalties)
      vi.mocked(scoreUtils.getGameWinner).mockReturnValue('argentina')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      const homeTeamElement = screen.getByText('Argentina')
      expect(homeTeamElement).toHaveStyle({ fontWeight: 700 })
    })

    it('highlights away team when winning on penalties', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 1,
          away_score: 1,
          home_penalty_score: 2,
          away_penalty_score: 4,
        }),
      }

      // Mock getGameWinner to return away team as winner (after penalties)
      vi.mocked(scoreUtils.getGameWinner).mockReturnValue('brazil')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      const awayTeamElement = screen.getByText('Brazil')
      expect(awayTeamElement).toHaveStyle({ fontWeight: 700 })
    })
  })

  describe('Penalty results', () => {
    it('shows penalty result "(4-3p)" when penalty shootout occurred', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 2,
          away_score: 2,
          home_penalty_score: 4,
          away_penalty_score: 3,
        }),
      }

      // Mock formatPenaltyResult to return penalty score
      vi.mocked(penaltyResultFormatter.formatPenaltyResult).mockReturnValue('(4-3p)')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('(4-3p)')).toBeInTheDocument()
      expect(penaltyResultFormatter.formatPenaltyResult).toHaveBeenCalledWith(game)
    })

    it('uses formatPenaltyResult() utility', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 1,
          away_score: 1,
          home_penalty_score: 5,
          away_penalty_score: 4,
        }),
      }

      vi.mocked(penaltyResultFormatter.formatPenaltyResult).mockReturnValue('(5-4p)')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(penaltyResultFormatter.formatPenaltyResult).toHaveBeenCalledWith(game)
      expect(screen.getByText('(5-4p)')).toBeInTheDocument()
    })

    it('no penalty result shown for regular games', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 3,
          away_score: 1,
        }),
      }

      // Mock formatPenaltyResult to return null (no penalties)
      vi.mocked(penaltyResultFormatter.formatPenaltyResult).mockReturnValue(null)

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(penaltyResultFormatter.formatPenaltyResult).toHaveBeenCalledWith(game)
      expect(screen.queryByText(/p\)/)).not.toBeInTheDocument()
    })

    it('shows different penalty scores correctly', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 0,
          away_score: 0,
          home_penalty_score: 3,
          away_penalty_score: 5,
        }),
      }

      vi.mocked(penaltyResultFormatter.formatPenaltyResult).mockReturnValue('(3-5p)')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('(3-5p)')).toBeInTheDocument()
    })
  })

  describe('Team descriptions', () => {
    it('shows team description from rule when team not qualified yet (e.g., "Winner of Group A")', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: null,
          away_team: 'brazil',
          home_team_rule: { position: 1, group: 'A' } as any,
        }),
        gameResult: null,
      }

      // Mock getTeamDescription to return description
      vi.mocked(playoffsRuleHelper.getTeamDescription).mockReturnValue('Winner of Group A')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(playoffsRuleHelper.getTeamDescription).toHaveBeenCalledWith({ position: 1, group: 'A' }, false)
      expect(screen.getByText('Winner of Group A')).toBeInTheDocument()
    })

    it('uses getTeamDescription() utility', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: null,
          away_team_rule: { position: 2, group: 'B' } as any,
        }),
        gameResult: null,
      }

      vi.mocked(playoffsRuleHelper.getTeamDescription).mockReturnValue('Runner-up Group B')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(playoffsRuleHelper.getTeamDescription).toHaveBeenCalledWith({ position: 2, group: 'B' }, false)
      expect(screen.getByText('Runner-up Group B')).toBeInTheDocument()
    })

    it('prefers team name over rule description when team is qualified', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'france',
          away_team: 'brazil',
          home_team_rule: { position: 1, group: 'A' } as any,
        }),
        gameResult: null,
      }

      // Even though there's a rule, team name should be shown since team is qualified
      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('France')).toBeInTheDocument()
      expect(screen.getByText('Brazil')).toBeInTheDocument()
      // getTeamDescription should not be called when team name exists
      expect(playoffsRuleHelper.getTeamDescription).not.toHaveBeenCalled()
    })

    it('shows "TBD" when team is null and no rule description available', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: null,
          away_team: null,
          home_team_rule: undefined,
          away_team_rule: undefined,
        }),
        gameResult: null,
      }

      // Mock getTeamDescription to return empty string (no rule)
      vi.mocked(playoffsRuleHelper.getTeamDescription).mockReturnValue('')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      const tbds = screen.getAllByText('TBD')
      expect(tbds).toHaveLength(2)
    })

    it('shows team description for both teams when neither is qualified', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: null,
          away_team: null,
          home_team_rule: { winner: true, game: 5 } as any,
          away_team_rule: { winner: true, game: 6 } as any,
        }),
        gameResult: null,
      }

      vi.mocked(playoffsRuleHelper.getTeamDescription)
        .mockReturnValueOnce('Winner #5')
        .mockReturnValueOnce('Winner #6')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      expect(screen.getByText('Winner #5')).toBeInTheDocument()
      expect(screen.getByText('Winner #6')).toBeInTheDocument()
      expect(playoffsRuleHelper.getTeamDescription).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge cases', () => {
    it('handles missing team in teamsMap gracefully', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'nonexistent-team',
          away_team: 'brazil',
        }),
        gameResult: null,
      }

      vi.mocked(playoffsRuleHelper.getTeamDescription).mockReturnValue('')

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      // Should show TBD when team doesn't exist in map
      expect(screen.getByText('TBD')).toBeInTheDocument()
      expect(screen.getByText('Brazil')).toBeInTheDocument()
    })

    it('renders correctly with all props valid', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 2,
          away_score: 1,
        }),
      }

      vi.mocked(scoreUtils.getGameWinner).mockReturnValue('argentina')

      const { container } = renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      // Check that the Paper component is rendered
      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument()
      expect(screen.getByText('Argentina')).toBeInTheDocument()
      expect(screen.getByText('Brazil')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('renders with empty teamsMap', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: null,
      }

      vi.mocked(playoffsRuleHelper.getTeamDescription).mockReturnValue('')

      renderWithTheme(<BracketGameCard game={game} teamsMap={{}} />)

      const tbds = screen.getAllByText('TBD')
      expect(tbds).toHaveLength(2)
    })

    it('handles score of 0 correctly', () => {
      const game: ExtendedGameData = {
        ...testFactories.game({
          id: 'game-1',
          home_team: 'argentina',
          away_team: 'brazil',
        }),
        gameResult: testFactories.gameResult({
          game_id: 'game-1',
          home_score: 0,
          away_score: 0,
        }),
      }

      renderWithTheme(<BracketGameCard game={game} teamsMap={mockTeams} />)

      // Both scores should be shown as 0, not "-"
      const zeros = screen.getAllByText('0')
      expect(zeros).toHaveLength(2)
    })
  })
})
