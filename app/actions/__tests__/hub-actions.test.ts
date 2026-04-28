import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActionCenterGames, getCarouselGames, getLeaderboardPeekData, getRecentResultsData, getPublicTournamentTiming, getTournamentHubPageData, getStatsAtAGlanceData } from '../hub-actions'
import * as scoreHistoryRepository from '@/app/db/score-history-repository'
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers'
import * as gameRepository from '@/app/db/game-repository'
import * as gameGuessRepository from '@/app/db/game-guess-repository'
import * as teamRepository from '@/app/db/team-repository'
import * as tournamentRepository from '@/app/db/tournament-repository'
import * as database from '@/app/db/database'
import * as prodeGroupRepository from '@/app/db/prode-group-repository'
import * as groupRankingRepository from '@/app/db/group-ranking-repository'
import * as tournamentPredictionCompletionRepository from '@/app/db/tournament-prediction-completion-repository'
import * as favoriteGroupsRepository from '@/app/db/favorite-groups-repository'
import * as userActions from '../user-actions'
import { applyLocalizationBatch } from '@/app/utils/localization-helper'
import { testFactories } from '../../../__tests__/db/test-factories'

const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000
const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

vi.mock('@/app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}))

vi.mock('@/app/db/game-repository', () => ({
  findGamesForDashboard: vi.fn(),
  findFirstGameInTournament: vi.fn(),
  findLastGameInTournament: vi.fn(),
  findFirstGameFullData: vi.fn(),
  findRecentGamesForDashboard: vi.fn(),
}))

vi.mock('@/app/db/tournament-prediction-completion-repository', () => ({
  getTournamentPredictionCompletion: vi.fn(),
}))

vi.mock('@/app/db/game-guess-repository', () => ({
  findGameGuessesByUserId: vi.fn(),
}))

vi.mock('@/app/db/team-repository', () => ({
  findTeamInTournament: vi.fn(),
  findQualifiedTeams: vi.fn(),
}))

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}))

vi.mock('../user-actions', () => ({
  getLoggedInUser: vi.fn(),
}))

vi.mock('@/app/db/favorite-groups-repository', () => ({
  getFavoriteGroupIds: vi.fn(),
}))

vi.mock('@/app/db/score-history-repository', () => ({
  getScoreHistoryForUsers: vi.fn(),
}))

vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupsByOwner: vi.fn(),
  findProdeGroupsByParticipant: vi.fn(),
}))

vi.mock('@/app/db/group-ranking-repository', () => ({
  getLatestRankingsForGroup: vi.fn(),
  getLatestTwoGroupRankingSnapshots: vi.fn(),
}))

vi.mock('@/app/db/tournament-guess-repository', () => ({
  getTournamentGuessStatsForUsers: vi.fn(),
  findTournamentGuessByUserIdTournament: vi.fn(),
}))

vi.mock('@/app/db/tournament-playoff-repository', () => ({
  findPlayoffRoundBy: vi.fn(),
  findPlayoffRoundsWithAvailabilityInfo: vi.fn().mockResolvedValue([]),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@/app/utils/localization-helper', () => ({
  applyLocalizationBatch: vi.fn((items: any[]) => items),
  applyLocalization: vi.fn((item: any) => item),
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

// A first-game date far in the past so the 2-day lock window has already passed by default
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
  // Prediction completion: default to all-zero (no predictions made yet)
  vi.mocked(tournamentPredictionCompletionRepository.getTournamentPredictionCompletion).mockResolvedValue({
    finalStandings: { completed: 0, total: 3, champion: false, runnerUp: false, thirdPlace: false },
    awards: { completed: 0, total: 4, bestPlayer: false, topGoalscorer: false, bestGoalkeeper: false, bestYoungPlayer: false },
    qualifiers: { completed: 0, total: 0 },
    overallCompleted: 0,
    overallTotal: 7,
    overallPercentage: 0,
    isPredictionLocked: false,
    completedGames: 0,
    totalGames: 64,
    silverBoostsUsed: 0,
    goldenBoostsUsed: 0,
    silverBoostsMax: 5,
    goldenBoostsMax: 3,
  } as any)
  vi.mocked(gameRepository.findFirstGameFullData).mockResolvedValue(undefined)
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
    it('returns mode urgent with up to 5 unpredicted open-deadline games', async () => {
      const games = [1, 2, 3, 4, 5, 6].map((i) =>
        testFactories.game({
          id: `game-${i}`,
          game_date: new Date(future2h.getTime() + i * 60 * 60 * 1000),
        })
      )
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue(games as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games).toHaveLength(5)
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

    it('sorts urgent games by game_number ascending when deadlines are equal', async () => {
      const gameDate = new Date(Date.now() + 5 * 60 * 60 * 1000);
      const game1 = testFactories.game({
        id: 'game-1',
        game_date: gameDate,
        game_number: 2,
      })
      const game2 = testFactories.game({
        id: 'game-2',
        game_date: gameDate,
        game_number: 1,
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

    it('keeps a game in urgent mode when its guess is partial (missing away_score)', async () => {
      const partialGame = testFactories.game({ id: 'game-partial', game_date: future2h })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([partialGame] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-partial', home_score: 1, away_score: null as any }),
      ])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games.map((g) => g.id)).toContain('game-partial')
    })

    it('keeps a tied playoff game in urgent mode when penalty winner is missing', async () => {
      const playoffGame = testFactories.game({
        id: 'game-playoff',
        game_date: future2h,
        game_type: 'playoff',
        playoffStage: { tournament_playoff_round_id: 'r-1', round_name: 'QF', is_final: false, is_third_place: false },
      } as any)
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([playoffGame] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({
          game_id: 'game-playoff',
          home_score: 1,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
        }),
      ])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games.map((g) => g.id)).toContain('game-playoff')
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

    it('returns up to 5 games in fallback mode when all are within the 5-day window', async () => {
      const games = [1, 2, 3, 4, 5, 6].map((i) =>
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
      expect(result.games).toHaveLength(5)
    })

    it('excludes fallback games beyond the 5-day window', async () => {
      const withinWindow = testFactories.game({
        id: 'game-soon',
        game_date: new Date(future2h.getTime() + 60 * 60 * 1000), // 3h from now
      })
      const beyondWindow = testFactories.game({
        id: 'game-later',
        game_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days away
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([withinWindow, beyondWindow] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: withinWindow.id }),
        testFactories.gameGuess({ game_id: beyondWindow.id }),
      ])

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('fallback')
      expect(result.games).toHaveLength(1)
      expect(result.games[0].id).toBe('game-soon')
    })
  })

  describe('authorization', () => {
    it('throws Unauthorized when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(undefined as any)

      await expect(getActionCenterGames(TOURNAMENT_ID, 'en')).rejects.toThrow('Unauthorized')
    })
  })

  describe('qtAndAwardsOpen', () => {
    it('returns qtAndAwardsOpen=true when first game was less than 2 days ago', async () => {
      const recentFirstGame = testFactories.game({
        id: 'first-game',
        game_date: new Date(Date.now() - ONE_DAY_MS),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])
      vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(recentFirstGame as any)

      const result = await getActionCenterGames(TOURNAMENT_ID, 'en')

      expect(result.qtAndAwardsOpen).toBe(true)
      expect(result.msUntilPredictionLock).toBeGreaterThan(0)
    })

    it('returns qtAndAwardsOpen=false when first game was more than 2 days ago', async () => {
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
        game_date: new Date(Date.now() - ONE_DAY_MS),
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

// ---------------------------------------------------------------------------
// getLeaderboardPeekData
// ---------------------------------------------------------------------------

const group1 = testFactories.prodeGroup({ id: 'group-1', name: 'Group Alpha' })
const group2 = testFactories.prodeGroup({ id: 'group-2', name: 'Los Amigos' })
const group3 = testFactories.prodeGroup({ id: 'group-3', name: 'Familia' })

const makeRankings = (groupId: string, userIds: string[], currentUserId: string) =>
  userIds.map((uid, i) => ({
    userId: uid,
    userName: uid === currentUserId ? 'Me' : `User ${i + 1}`,
    rank: i + 1,
    score: 100 - i * 10,
  }))

describe('getLeaderboardPeekData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(
      testFactories.user({ id: USER_ID }) as any
    )
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([group1])
    vi.mocked(prodeGroupRepository.findProdeGroupsByParticipant).mockResolvedValue([])
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup).mockResolvedValue(
      makeRankings(group1.id, [USER_ID, 'user-2', 'user-3'], USER_ID)
    )
    vi.mocked(groupRankingRepository.getLatestTwoGroupRankingSnapshots).mockResolvedValue([])
    vi.mocked(favoriteGroupsRepository.getFavoriteGroupIds).mockResolvedValue([])
  })

  it('returns empty result when user is not authenticated', async () => {
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null as any)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups).toEqual([])
    expect(result.userHasGroups).toBe(false)
    expect(result.allGroupNames).toEqual([])
  })

  it('returns empty groups and userHasGroups=false when user has no groups', async () => {
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([])
    vi.mocked(prodeGroupRepository.findProdeGroupsByParticipant).mockResolvedValue([])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups).toEqual([])
    expect(result.userHasGroups).toBe(false)
    expect(result.allGroupNames).toEqual([])
  })

  it('returns up to 3 groups sorted by member count descending', async () => {
    // group1: 5 members, group2: 3 members, group3: 1 member → order: group1, group2, group3
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([
      group1, group2, group3,
    ])
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup)
      .mockResolvedValueOnce(makeRankings(group1.id, [USER_ID, 'u2', 'u3', 'u4', 'u5'], USER_ID))
      .mockResolvedValueOnce(makeRankings(group2.id, [USER_ID, 'u2', 'u3'], USER_ID))
      .mockResolvedValueOnce(makeRankings(group3.id, [USER_ID], USER_ID))

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups).toHaveLength(3)
    expect(result.groups[0].groupId).toBe(group1.id)
    expect(result.groups[1].groupId).toBe(group2.id)
    expect(result.groups[2].groupId).toBe(group3.id)
    expect(result.userHasGroups).toBe(true)
  })

  it('sorts favorite groups before non-favorites regardless of member count', async () => {
    // group1: 5 members (largest), group2: 3 members (favorited), group3: 2 members
    // Without favorites: group1, group2, group3
    // With group2 favorited: group2 (favorite), group1 (most members), group3
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([
      group1, group2, group3,
    ])
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup)
      .mockResolvedValueOnce(makeRankings(group1.id, [USER_ID, 'u2', 'u3', 'u4', 'u5'], USER_ID))
      .mockResolvedValueOnce(makeRankings(group2.id, [USER_ID, 'u2', 'u3'], USER_ID))
      .mockResolvedValueOnce(makeRankings(group3.id, [USER_ID, 'u2'], USER_ID))
    vi.mocked(favoriteGroupsRepository.getFavoriteGroupIds).mockResolvedValue([group2.id])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups).toHaveLength(3)
    expect(result.groups[0].groupId).toBe(group2.id) // favorite first
    expect(result.groups[1].groupId).toBe(group1.id) // then by member count desc
    expect(result.groups[2].groupId).toBe(group3.id)
  })

  it('filters out groups where user has no ranking entry', async () => {
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([group1, group2])
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup)
      .mockResolvedValueOnce(makeRankings(group1.id, [USER_ID, 'u2'], USER_ID))
      // group2: user is not in the rankings
      .mockResolvedValueOnce([{ userId: 'u2', userName: 'Other', rank: 1, score: 100 }])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].groupId).toBe(group1.id)
    // userHasGroups is true because user owns both groups (before ranking filter)
    expect(result.userHasGroups).toBe(true)
  })

  it('builds correct 3-row window when user is rank 1 (shows top 3)', async () => {
    const rankings = makeRankings(group1.id, [USER_ID, 'u2', 'u3', 'u4', 'u5'], USER_ID)
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup).mockResolvedValue(rankings)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups[0].userRank).toBe(1)
    expect(result.groups[0].rows).toHaveLength(3)
    expect(result.groups[0].rows[0].rank).toBe(1)
    expect(result.groups[0].rows[2].rank).toBe(3)
    expect(result.groups[0].rows[0].isCurrentUser).toBe(true)
  })

  it('builds correct 3-row window when user is last rank (shows last 3)', async () => {
    const rankings = [
      { userId: 'u1', userName: 'User 1', rank: 1, score: 100 },
      { userId: 'u2', userName: 'User 2', rank: 2, score: 90 },
      { userId: 'u3', userName: 'User 3', rank: 3, score: 80 },
      { userId: USER_ID, userName: 'Me', rank: 4, score: 70 },
    ]
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup).mockResolvedValue(rankings)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups[0].userRank).toBe(4)
    expect(result.groups[0].rows).toHaveLength(3)
    expect(result.groups[0].rows[0].rank).toBe(2)
    expect(result.groups[0].rows[2].rank).toBe(4)
    expect(result.groups[0].rows[2].isCurrentUser).toBe(true)
  })

  it('builds correct 3-row window for middle ranks (shows above/user/below)', async () => {
    const rankings = [
      { userId: 'u1', userName: 'User 1', rank: 1, score: 100 },
      { userId: 'u2', userName: 'User 2', rank: 2, score: 90 },
      { userId: USER_ID, userName: 'Me', rank: 3, score: 80 },
      { userId: 'u4', userName: 'User 4', rank: 4, score: 70 },
      { userId: 'u5', userName: 'User 5', rank: 5, score: 60 },
    ]
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup).mockResolvedValue(rankings)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups[0].userRank).toBe(3)
    expect(result.groups[0].rows).toHaveLength(3)
    expect(result.groups[0].rows[0].rank).toBe(2)
    expect(result.groups[0].rows[1].rank).toBe(3)
    expect(result.groups[0].rows[1].isCurrentUser).toBe(true)
    expect(result.groups[0].rows[2].rank).toBe(4)
  })

  it('returns exactly 3 rows when multiple users share the same rank as the user (ties)', async () => {
    // 5 people at rank 3 — naive rank-number filter would return all 5; index-based returns exactly 3
    const rankings = [
      { userId: 'u1', userName: 'User 1', rank: 1, score: 100 },
      { userId: 'u2', userName: 'User 2', rank: 2, score: 90 },
      { userId: 'u3', userName: 'User 3', rank: 3, score: 80 },
      { userId: USER_ID, userName: 'Me', rank: 3, score: 80 },
      { userId: 'u5', userName: 'User 5', rank: 3, score: 80 },
      { userId: 'u6', userName: 'User 6', rank: 3, score: 80 },
      { userId: 'u7', userName: 'User 7', rank: 7, score: 50 },
    ]
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup).mockResolvedValue(rankings)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    // Must always be exactly 3 rows regardless of ties
    expect(result.groups[0].rows).toHaveLength(3)
    // The current user must appear in the window
    expect(result.groups[0].rows.some((r) => r.isCurrentUser)).toBe(true)
  })

  it('sets rankChange to null when only one snapshot exists', async () => {
    vi.mocked(groupRankingRepository.getLatestTwoGroupRankingSnapshots).mockResolvedValue([
      testFactories.groupRanking({ rank: 2 }),
    ])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups[0].rankChange).toBeNull()
  })

  it('returns positive rankChange when user moved up in rank', async () => {
    // snapshots[0] = latest (rank 2), snapshots[1] = previous (rank 4)
    // rankChange = previous - current = 4 - 2 = +2 (moved up)
    vi.mocked(groupRankingRepository.getLatestTwoGroupRankingSnapshots).mockResolvedValue([
      testFactories.groupRanking({ rank: 2 }),
      testFactories.groupRanking({ rank: 4 }),
    ])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result.groups[0].rankChange).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// getRecentResultsData
// ---------------------------------------------------------------------------

const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2h ago
const futureDate = new Date(Date.now() + 30 * 60 * 1000)   // 30min in future (prediction closed)

const makeRawGame = (overrides?: Partial<any>) => ({
  gameId: 'game-1',
  homeTeamId: 'team-1',
  awayTeamId: 'team-2',
  homeScore: 2,      // non-null = finished by default
  awayScore: 1,
  userHomeGuess: 2,
  userAwayGuess: 1,
  guessScore: 3,
  boostType: null,
  boostMultiplier: null,
  finalScore: null,
  gameDate: pastDate,
  ...overrides,
})

describe('getRecentResultsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(
      testFactories.user({ id: USER_ID }) as any
    )
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([])
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([])
    vi.mocked(applyLocalizationBatch).mockImplementation((teams) => teams)
  })

  it('throws Unauthorized when no active session', async () => {
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null as any)

    await expect(getRecentResultsData(TOURNAMENT_ID, 'en')).rejects.toThrow('Unauthorized')
  })

  it('returns empty recentGames when findRecentGamesForDashboard returns []', async () => {
    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames).toEqual([])
  })

  it('returns gameStatus finished when homeScore is not null', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homeScore: 2, awayScore: 1, gameDate: pastDate }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].gameStatus).toBe('finished')
  })

  it('returns gameStatus about_to_start when homeScore is null and gameDate is in the future', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homeScore: null, awayScore: null, gameDate: futureDate }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].gameStatus).toBe('about_to_start')
  })

  it('returns gameStatus pending when homeScore is null and gameDate is in the past', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homeScore: null, awayScore: null, gameDate: pastDate }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].gameStatus).toBe('pending')
  })

  it('includes games where user has no prediction (userHomeGuess: null)', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ userHomeGuess: null, userAwayGuess: null, guessScore: null }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames).toHaveLength(1)
    expect(result.recentGames[0].userHomeGuess).toBeNull()
    expect(result.recentGames[0].finalPoints).toBe(0)
  })

  it('correctly computes boostBonus as finalPoints minus basePoints', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ guessScore: 3, finalScore: 8 }),
    ] as any)
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      testFactories.team({ id: 'team-1' }),
      testFactories.team({ id: 'team-2' }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].boostBonus).toBe(5)
    expect(result.recentGames[0].finalPoints).toBe(8)
    expect(result.recentGames[0].basePoints).toBe(3)
  })

  it('includes localized team names when teamsMap has team', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homeTeamId: 'team-1', awayTeamId: 'team-2' }),
    ] as any)
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      testFactories.team({ id: 'team-1', name: 'Argentina' }),
      testFactories.team({ id: 'team-2', name: 'France' }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].homeTeamName).toBe('Argentina')
    expect(result.recentGames[0].awayTeamName).toBe('France')
  })

  it('falls back to teamId when team not found in teamsMap', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homeTeamId: 'unknown-team' }),
    ] as any)
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      testFactories.team({ id: 'team-2', name: 'France' }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].homeTeamName).toBe('unknown-team')
    expect(result.recentGames[0].awayTeamName).toBe('France')
  })

  it('uses basePoints when finalScore is null', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ guessScore: 3, finalScore: null }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].finalPoints).toBe(3)
    expect(result.recentGames[0].boostBonus).toBe(0)
  })

  it('handles game with no guessScore (null)', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ guessScore: null, finalScore: null }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].finalPoints).toBe(0)
    expect(result.recentGames[0].basePoints).toBe(0)
  })

  it('preserves boostType in game item', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ boostType: 'golden' }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].boostType).toBe('golden')
  })

  it('maps homePenaltyScore and awayPenaltyScore from repository result', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homePenaltyScore: 4, awayPenaltyScore: 2 }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].homePenaltyScore).toBe(4)
    expect(result.recentGames[0].awayPenaltyScore).toBe(2)
  })

  it('maps userHomePenaltyWinner and userAwayPenaltyWinner from repository result', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ userHomePenaltyWinner: true, userAwayPenaltyWinner: false }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].userHomePenaltyWinner).toBe(true)
    expect(result.recentGames[0].userAwayPenaltyWinner).toBe(false)
  })

  it('returns null penalty fields when repository data has null penalties', async () => {
    vi.mocked(gameRepository.findRecentGamesForDashboard).mockResolvedValue([
      makeRawGame({ homePenaltyScore: null, awayPenaltyScore: null, userHomePenaltyWinner: null, userAwayPenaltyWinner: null }),
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].homePenaltyScore).toBeNull()
    expect(result.recentGames[0].awayPenaltyScore).toBeNull()
    expect(result.recentGames[0].userHomePenaltyWinner).toBeNull()
    expect(result.recentGames[0].userAwayPenaltyWinner).toBeNull()
  })
})

describe('getPublicTournamentTiming', () => {
  const FORTY_NINE_HOURS_MS = 49 * 60 * 60 * 1000

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({ id: TOURNAMENT_ID })
    )
  })

  it('returns null firstGameDate and both started flags false when no first game exists', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(undefined)

    const result = await getPublicTournamentTiming(TOURNAMENT_ID, 'en')

    expect(result.firstGameDate).toBeNull()
    expect(result.tournamentHasStarted).toBe(false)
    expect(result.tournamentJustStarted).toBe(false)
  })

  it('returns tournamentHasStarted false and tournamentJustStarted false when first game is in the future', async () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'game-1', tournament_id: TOURNAMENT_ID, game_date: futureDate })
    )

    const result = await getPublicTournamentTiming(TOURNAMENT_ID, 'en')

    expect(result.firstGameDate).toEqual(futureDate)
    expect(result.tournamentHasStarted).toBe(false)
    expect(result.tournamentJustStarted).toBe(false)
  })

  it('returns tournamentHasStarted true and tournamentJustStarted true when first game kicked off within last 48h', async () => {
    const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'game-1', tournament_id: TOURNAMENT_ID, game_date: recentDate })
    )

    const result = await getPublicTournamentTiming(TOURNAMENT_ID, 'en')

    expect(result.tournamentHasStarted).toBe(true)
    expect(result.tournamentJustStarted).toBe(true)
  })

  it('returns tournamentHasStarted true and tournamentJustStarted false when first game kicked off more than 48h ago', async () => {
    const oldDate = new Date(Date.now() - FORTY_NINE_HOURS_MS)
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'game-1', tournament_id: TOURNAMENT_ID, game_date: oldDate })
    )

    const result = await getPublicTournamentTiming(TOURNAMENT_ID, 'en')

    expect(result.tournamentHasStarted).toBe(true)
    expect(result.tournamentJustStarted).toBe(false)
  })
})

describe('getTournamentHubPageData', () => {
  const mockDb = vi.mocked(database.db)

  beforeEach(() => {
    // Default: db returns count=10
    mockDb.selectFrom.mockReturnValue(createMockSelectQuery({ count: 10 }) as any)
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({ id: TOURNAMENT_ID })
    )
    // Default: first game in the past (tournament started), last game in the future (not finished)
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() - 24 * 60 * 60 * 1000) }) as any
    )
    vi.mocked(gameRepository.findLastGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'last', game_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }) as any
    )
  })

  it('returns DEFAULT_SCORING when tournament is not found', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(undefined)
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.scoringConfig.game_correct_outcome_points).toBe(1)
    expect(result.scoringConfig.game_exact_score_points).toBe(3)
  })

  it('returns custom scoring config when tournament has custom scoring fields', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({
        id: TOURNAMENT_ID,
        game_correct_outcome_points: 3,
        game_exact_score_points: 5,
      })
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.scoringConfig.game_correct_outcome_points).toBe(3)
    expect(result.scoringConfig.game_exact_score_points).toBe(5)
  })

  it('returns DEFAULT_SCORING when all tournament scoring fields are null', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({
        id: TOURNAMENT_ID,
        game_correct_outcome_points: null,
        game_exact_score_points: null,
        champion_points: null,
        runner_up_points: null,
        third_place_points: null,
        individual_award_points: null,
        qualified_team_points: null,
        exact_position_qualified_points: null,
        max_silver_games: null,
        max_golden_games: null,
      })
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.scoringConfig.game_correct_outcome_points).toBe(1)
    expect(result.scoringConfig.game_exact_score_points).toBe(3)
  })

  it('returns correct totalGames count from db query', async () => {
    mockDb.selectFrom.mockReturnValue(createMockSelectQuery({ count: 64 }) as any)
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.totalGames).toBe(64)
  })

  it('succeeds without authentication (no getLoggedInUser call)', async () => {
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result).toBeDefined()
    expect(vi.mocked(userActions.getLoggedInUser)).not.toHaveBeenCalled()
  })

  it('returns isStarted=true when first game date is in the past', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() - 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isStarted).toBe(true)
  })

  it('returns isStarted=false when first game date is in the future', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() + 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isStarted).toBe(false)
  })

  it('returns isFinished=true when last game date is in the past', async () => {
    vi.mocked(gameRepository.findLastGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'last', game_date: new Date(Date.now() - 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isFinished).toBe(true)
  })

  it('returns isFinished=false when last game date is in the future', async () => {
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isFinished).toBe(false)
  })

  it('returns isNearStart=true when first game is exactly 48 hours away', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() + 48 * 60 * 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isNearStart).toBe(true)
  })

  it('returns isNearStart=true when first game is 24 hours away (inside window)', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() + 24 * 60 * 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isNearStart).toBe(true)
  })

  it('returns isNearStart=false when first game is 49 hours away (outside window)', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() + 49 * 60 * 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isNearStart).toBe(false)
  })

  it('returns isNearStart=true when first game has already started (in the past)', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(
      testFactories.game({ id: 'first', game_date: new Date(Date.now() - 60 * 1000) }) as any
    )
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isNearStart).toBe(true)
  })

  it('returns isNearStart=false when no first game exists', async () => {
    vi.mocked(gameRepository.findFirstGameInTournament).mockResolvedValue(null as any)
    const result = await getTournamentHubPageData(TOURNAMENT_ID)
    expect(result.isNearStart).toBe(false)
  })
})

describe('getStatsAtAGlanceData', () => {
  beforeEach(() => {
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(
      testFactories.user({ id: USER_ID }) as any
    )
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue([])
  })

  it('throws Unauthorized when user is not logged in', async () => {
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null)
    await expect(getStatsAtAGlanceData(TOURNAMENT_ID, 'en')).rejects.toThrow('Unauthorized')
  })

  it('returns hasData=false with all zeros when no snapshots exist', async () => {
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.hasData).toBe(false)
    expect(result.totalPoints).toBe(0)
    expect(result.sparklineData).toEqual([])
    expect(result.snapshotDateLabel).toBeNull()
  })

  it('returns correct category totals from the latest snapshot', async () => {
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue([
      testFactories.scoreHistory({
        total_game_score: 60,
        total_boost_bonus: 10,
        qualified_teams_score: 20,
        group_position_score: 5,
        honor_roll_score: 8,
        individual_awards_score: 4,
        total_points: 107,
      }),
    ])
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.hasData).toBe(true)
    expect(result.totalPoints).toBe(107)
    expect(result.matchesPoints).toBe(70)
    expect(result.qualifiedTeamsPoints).toBe(25)
    expect(result.awardsPoints).toBe(12)
  })

  it('returns delta=0 and isYesterday=false when only one snapshot exists', async () => {
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue([
      testFactories.scoreHistory({ total_points: 50, total_game_score: 50 }),
    ])
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.momentumPoints).toBe(0)
    expect(result.matchesDelta).toBe(0)
    expect(result.isYesterday).toBe(false)
    expect(result.snapshotDateLabel).toBeNull()
  })

  it('returns correct deltas from latest minus previous snapshot', async () => {
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue([
      testFactories.scoreHistory({
        snapshot_date: 20260401,
        total_game_score: 30,
        total_boost_bonus: 0,
        qualified_teams_score: 10,
        group_position_score: 0,
        honor_roll_score: 5,
        individual_awards_score: 0,
        total_points: 45,
      }),
      testFactories.scoreHistory({
        snapshot_date: 20260402,
        total_game_score: 37,
        total_boost_bonus: 0,
        qualified_teams_score: 10,
        group_position_score: 0,
        honor_roll_score: 5,
        individual_awards_score: 0,
        total_points: 52,
      }),
    ])
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.momentumPoints).toBe(7)
    expect(result.matchesDelta).toBe(7)
    expect(result.qualifiedTeamsDelta).toBe(0)
    expect(result.awardsDelta).toBe(0)
  })

  it('sparklineData contains at most 7 entries from the most recent snapshots', async () => {
    const snapshots = Array.from({ length: 10 }, (_, i) =>
      testFactories.scoreHistory({ snapshot_date: 20260401 + i, total_points: (i + 1) * 10 })
    )
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue(snapshots)
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.sparklineData).toHaveLength(7)
    expect(result.sparklineData[0]).toBe(40)
    expect(result.sparklineData[6]).toBe(100)
  })

  it('sparklineData preserves chronological order (oldest to newest)', async () => {
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue([
      testFactories.scoreHistory({ snapshot_date: 20260401, total_points: 10 }),
      testFactories.scoreHistory({ snapshot_date: 20260402, total_points: 25 }),
      testFactories.scoreHistory({ snapshot_date: 20260403, total_points: 40 }),
    ])
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.sparklineData).toEqual([10, 25, 40])
  })

  it('sparklineStartDateLabel is null when sparklineData has fewer than 2 entries', async () => {
    vi.mocked(scoreHistoryRepository.getScoreHistoryForUsers).mockResolvedValue([
      testFactories.scoreHistory({ total_points: 50 }),
    ])
    const result = await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(result.sparklineStartDateLabel).toBeNull()
  })

  it('calls getScoreHistoryForUsers with the logged-in user id and tournamentId', async () => {
    await getStatsAtAGlanceData(TOURNAMENT_ID, 'en')
    expect(scoreHistoryRepository.getScoreHistoryForUsers).toHaveBeenCalledWith(
      [USER_ID],
      TOURNAMENT_ID
    )
  })
})

describe('getCarouselGames', () => {
  const mockDb = vi.mocked(database.db)

  // Helper: mock the 3 parallel db aggregate queries used by getCarouselGames
  function mockCarouselDb({ predicted = 3, silver = 1, golden = 0 } = {}) {
    mockDb.selectFrom
      .mockReturnValueOnce(createMockSelectQuery({ count: predicted }) as any)
      .mockReturnValueOnce(createMockSelectQuery({ count: silver }) as any)
      .mockReturnValueOnce(createMockSelectQuery({ count: golden }) as any)
  }

  beforeEach(() => {
    mockCarouselDb()
  })

  describe('authorization', () => {
    it('throws Unauthorized when user is not logged in', async () => {
      vi.mocked(userActions.getLoggedInUser).mockResolvedValue(undefined as any)
      await expect(getCarouselGames(TOURNAMENT_ID, 'en')).rejects.toThrow('Unauthorized')
    })
  })

  describe('mode: empty', () => {
    it('returns mode empty and empty arrays when no window games exist', async () => {
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('empty')
      expect(result.games).toHaveLength(0)
      expect(result.gameGuesses).toEqual({})
      expect(result.urgentGameIds).toEqual([])
    })

    it('includes aggregate counts even in empty mode', async () => {
      mockDb.selectFrom.mockReset()
      mockCarouselDb({ predicted: 7, silver: 2, golden: 1 })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.predictedGames).toBe(7)
      expect(result.silverBoostsUsed).toBe(2)
      expect(result.goldenBoostsUsed).toBe(1)
    })
  })

  describe('mode: urgent', () => {
    it('returns mode urgent with unpredicted open-deadline games', async () => {
      const game = testFactories.game({ id: 'game-1', game_date: future2h })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('urgent')
      expect(result.games).toHaveLength(1)
      expect(result.urgentGameIds).toEqual(['game-1'])
    })

    it('limits urgent games to 5', async () => {
      const games = [1, 2, 3, 4, 5, 6].map((i) =>
        testFactories.game({ id: `game-${i}`, game_date: new Date(future2h.getTime() + i * 60 * 60 * 1000) })
      )
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue(games as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.games).toHaveLength(5)
      expect(result.urgentGameIds).toHaveLength(5)
    })

    it('sorts urgent games by game_number ascending when deadlines are equal', async () => {
      const gameDate = new Date(Date.now() + 5 * 60 * 60 * 1000)
      const game1 = testFactories.game({ id: 'game-1', game_date: gameDate, game_number: 2 })
      const game2 = testFactories.game({ id: 'game-2', game_date: gameDate, game_number: 1 })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game1, game2] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.games[0].id).toBe('game-2')
      expect(result.games[1].id).toBe('game-1')
    })

    it('populates tournament boost limits from tournament row', async () => {
      const game = testFactories.game({ id: 'game-1', game_date: future2h })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.tournamentMaxSilver).toBe(5)
      expect(result.tournamentMaxGolden).toBe(3)
    })
  })

  describe('mode: fallback', () => {
    it('returns mode fallback when all urgent games are predicted and some are within 5-day window', async () => {
      const game = testFactories.game({ id: 'game-1', game_date: future2h })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-1' }),
      ])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('fallback')
      expect(result.urgentGameIds).toEqual([])
    })

    it('sorts fallback games by game_number ascending when dates are equal', async () => {
      const gameDate = new Date(Date.now() + 3 * 60 * 60 * 1000)
      const game1 = testFactories.game({ id: 'game-1', game_date: gameDate, game_number: 2 })
      const game2 = testFactories.game({ id: 'game-2', game_date: gameDate, game_number: 1 })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([game1, game2] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-1' }),
        testFactories.gameGuess({ game_id: 'game-2' }),
      ])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('fallback')
      expect(result.games[0].id).toBe('game-2')
      expect(result.games[1].id).toBe('game-1')
    })

    it('returns mode empty when all open games are predicted but none are within 5-day window', async () => {
      const farGame = testFactories.game({
        id: 'game-far',
        game_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      })
      vi.mocked(gameRepository.findGamesForDashboard).mockResolvedValue([farGame] as any)
      vi.mocked(gameGuessRepository.findGameGuessesByUserId).mockResolvedValue([
        testFactories.gameGuess({ game_id: 'game-far' }),
      ])

      const result = await getCarouselGames(TOURNAMENT_ID, 'en')

      expect(result.mode).toBe('empty')
      expect(result.urgentGameIds).toEqual([])
    })
  })
})
