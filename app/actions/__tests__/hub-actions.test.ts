import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActionCenterGames } from '../hub-actions'
import * as gameRepository from '@/app/db/game-repository'
import * as gameGuessRepository from '@/app/db/game-guess-repository'
import * as teamRepository from '@/app/db/team-repository'
import * as tournamentRepository from '@/app/db/tournament-repository'
import * as userActions from '../user-actions'
import { testFactories } from '../../../__tests__/db/test-factories'

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000
const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

vi.mock('@/app/db/game-repository', () => ({
  findGamesForDashboard: vi.fn(),
  findFirstGameInTournament: vi.fn(),
  findLastGameInTournament: vi.fn(),
}))

vi.mock('@/app/db/game-guess-repository', () => ({
  findGameGuessesByUserId: vi.fn(),
}))

vi.mock('@/app/db/team-repository', () => ({
  findTeamInTournament: vi.fn(),
}))

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}))

vi.mock('../user-actions', () => ({
  getLoggedInUser: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
  getLocale: vi.fn().mockResolvedValue('en'),
}))

const TOURNAMENT_ID = 'tournament-1'
const USER_ID = 'user-1'

// A date 2 hours in the future — deadline (1h before) is still open
const future2h = new Date(Date.now() + 2 * 60 * 60 * 1000)
// A date 1 hour in the future — deadline is exactly now (closed)
const futureButClosed = new Date(Date.now() + 30 * 60 * 1000) // 30 min → deadline already passed

const defaultTeam1 = testFactories.team({ id: 'team-1', name: 'Team 1' })
const defaultTeam2 = testFactories.team({ id: 'team-2', name: 'Team 2' })
const defaultTournament = testFactories.tournament({
  id: TOURNAMENT_ID,
  max_silver_games: 5,
  max_golden_games: 3,
})

// A first-game date far in the past so the 5-day lock window has already passed by default
const pastFirstGame = testFactories.game({
  id: 'first-game',
  game_date: new Date(Date.now() - SIX_DAYS_MS),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(userActions.getLoggedInUser).mockResolvedValue(
    testFactories.user({ id: USER_ID }) as any
  )
  vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([defaultTeam1, defaultTeam2])
  vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(defaultTournament)
  vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([])
  vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(pastFirstGame as any)
  // Default: last game is in the future (tournament ongoing)
  vi.mocked(gameRepository.findLastGameInTournament).mockResolvedValue(
    testFactories.game({ id: 'last-game', game_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }) as any
  )
})

describe('getActionCenterGames', () => {
  describe('mode: empty', () => {
    it('returns mode empty when findGamesForDashboard returns no games', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('empty')
      expect(result.games).toHaveLength(0)
      expect(result.gameGuesses).toEqual({})
    })

    it('includes tournament boost limits in empty mode', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.tournamentMaxSilver).toBe(5)
      expect(result.tournamentMaxGolden).toBe(3)
    })
  })

  describe('mode: urgent', () => {
    it('returns mode urgent with up to 4 unpredicted open-deadline games', async () => {
      const games = [1, 2, 3, 4, 5].map((i) =>
        testFactories.game({
          id: `game-${i}`,
          game_date: new Date(future2h.getTime() + i * 60 * 60 * 1000),
        })
      )
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue(games as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games).toHaveLength(4)
    })

    it('sorts urgent games by deadline ascending', async () => {
      const game1 = testFactories.game({
        id: 'game-1',
        game_date: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5h from now
      })
      const game2 = testFactories.game({
        id: 'game-2',
        game_date: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3h from now
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game1, game2] as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.games[0].id).toBe('game-2')
      expect(result.games[1].id).toBe('game-1')
    })

    it('excludes games whose deadline has already passed', async () => {
      const openGame = testFactories.game({
        id: 'game-open',
        game_date: future2h,
      })
      const closedGame = testFactories.game({
        id: 'game-closed',
        game_date: futureButClosed,
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([openGame, closedGame] as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games.map((g) => g.id)).toContain('game-open')
      expect(result.games.map((g) => g.id)).not.toContain('game-closed')
    })

    it('excludes games that already have a guess', async () => {
      const predictedGame = testFactories.game({ id: 'game-predicted', game_date: future2h })
      const unpredictedGame = testFactories.game({
        id: 'game-unpredicted',
        game_date: new Date(future2h.getTime() + 60 * 60 * 1000),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([
        predictedGame,
        unpredictedGame,
      ] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-predicted' }),
      ])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games.map((g) => g.id)).not.toContain('game-predicted')
      expect(result.games.map((g) => g.id)).toContain('game-unpredicted')
    })

    it('includes only guesses for the selected carousel games', async () => {
      const carouselGame = testFactories.game({ id: 'game-carousel', game_date: future2h })
      const otherGame = testFactories.game({
        id: 'game-other',
        game_date: new Date(future2h.getTime() + 5 * 60 * 60 * 1000),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([carouselGame] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-other' }),
      ])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.gameGuesses).not.toHaveProperty('game-other')
    })
  })

  describe('mode: fallback', () => {
    it('returns mode fallback when all open-deadline games already have guesses', async () => {
      const game1 = testFactories.game({ id: 'game-1', game_date: future2h })
      const game2 = testFactories.game({
        id: 'game-2',
        game_date: new Date(future2h.getTime() + 60 * 60 * 1000),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game1, game2] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-1' }),
        testFactories.gameGuess({ game_id: 'game-2' }),
      ])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('fallback')
    })

    it('returns up to 3 games in fallback mode', async () => {
      const games = [1, 2, 3, 4].map((i) =>
        testFactories.game({
          id: `game-${i}`,
          game_date: new Date(future2h.getTime() + i * 60 * 60 * 1000),
        })
      )
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue(games as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue(
        games.map((g) => testFactories.gameGuess({ game_id: g.id }))
      )

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('fallback')
      expect(result.games).toHaveLength(3)
    })
  })

  describe('authorization', () => {
    it('throws Unauthorized when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(undefined as any)

      await expect(getActionCenterGames(TOURNAMENT_ID, 'en')).rejects.toThrow('Unauthorized')
    })
  })

  describe('qtAndAwardsOpen', () => {
    it('returns qtAndAwardsOpen=true when first game was less than 5 days ago', async () => {
      const recentFirstGame = testFactories.game({
        id: 'first-game',
        game_date: new Date(Date.now() - FOUR_DAYS_MS),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(recentFirstGame as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.qtAndAwardsOpen).toBe(true)
      expect(result.msUntilPredictionLock).toBeGreaterThan(0)
    })

    it('returns qtAndAwardsOpen=false when first game was more than 5 days ago', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      // pastFirstGame is already set in beforeEach (6 days ago)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.qtAndAwardsOpen).toBe(false)
      expect(result.msUntilPredictionLock).toBeLessThanOrEqual(0)
    })

    it('returns qtAndAwardsOpen=false when tournament is not active', async () => {
      const inactiveTournament = testFactories.tournament({
        id: TOURNAMENT_ID,
        is_active: false,
      })
      const recentFirstGame = testFactories.game({
        id: 'first-game',
        game_date: new Date(Date.now() - FOUR_DAYS_MS),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(inactiveTournament)
      vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(recentFirstGame as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.qtAndAwardsOpen).toBe(false)
    })

    it('returns qtAndAwardsOpen=false when firstGame is null', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(null as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.qtAndAwardsOpen).toBe(false)
    })
  })

  describe('tournamentFinished', () => {
    it('returns tournamentFinished=false when last game is in the future', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      // Default beforeEach sets last game 7 days in the future

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.tournamentFinished).toBe(false)
    })

    it('returns tournamentFinished=true when last game date has passed', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      vi.mocked(gameRepository.findLastGameInTournament).mockResolvedValue(
        testFactories.game({
          id: 'last-game',
          game_date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
        }) as any
      )

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.tournamentFinished).toBe(true)
    })

    it('returns tournamentFinished=false when lastGame is null', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      vi.mocked(gameRepository.findLastGameInTournament).mockResolvedValue(null as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.tournamentFinished).toBe(false)
    })
  })
})
