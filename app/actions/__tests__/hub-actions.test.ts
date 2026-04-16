import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActionCenterGames, getLeaderboardPeekData } from '../hub-actions'
import * as gameRepository from '@/app/db/game-repository'
import * as gameGuessRepository from '@/app/db/game-guess-repository'
import * as teamRepository from '@/app/db/team-repository'
import * as tournamentRepository from '@/app/db/tournament-repository'
import * as prodeGroupRepository from '@/app/db/prode-group-repository'
import * as groupRankingRepository from '@/app/db/group-ranking-repository'
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

vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupsByOwner: vi.fn(),
  findProdeGroupsByParticipant: vi.fn(),
}))

vi.mock('@/app/db/group-ranking-repository', () => ({
  getLatestRankingsForGroup: vi.fn(),
  getLatestTwoGroupRankingSnapshots: vi.fn(),
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
  })

  it('returns empty array when user is not authenticated', async () => {
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null as any)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result).toEqual([])
  })

  it('returns empty array when user has no groups', async () => {
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([])
    vi.mocked(prodeGroupRepository.findProdeGroupsByParticipant).mockResolvedValue([])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result).toEqual([])
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

    expect(result).toHaveLength(3)
    expect(result[0].groupId).toBe(group1.id)
    expect(result[1].groupId).toBe(group2.id)
    expect(result[2].groupId).toBe(group3.id)
  })

  it('filters out groups where user has no ranking entry', async () => {
    vi.mocked(prodeGroupRepository.findProdeGroupsByOwner).mockResolvedValue([group1, group2])
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup)
      .mockResolvedValueOnce(makeRankings(group1.id, [USER_ID, 'u2'], USER_ID))
      // group2: user is not in the rankings
      .mockResolvedValueOnce([{ userId: 'u2', userName: 'Other', rank: 1, score: 100 }])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result).toHaveLength(1)
    expect(result[0].groupId).toBe(group1.id)
  })

  it('builds correct 3-row window when user is rank 1 (shows top 3)', async () => {
    const rankings = makeRankings(group1.id, [USER_ID, 'u2', 'u3', 'u4', 'u5'], USER_ID)
    vi.mocked(groupRankingRepository.getLatestRankingsForGroup).mockResolvedValue(rankings)

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result[0].userRank).toBe(1)
    expect(result[0].rows).toHaveLength(3)
    expect(result[0].rows[0].rank).toBe(1)
    expect(result[0].rows[2].rank).toBe(3)
    expect(result[0].rows[0].isCurrentUser).toBe(true)
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

    expect(result[0].userRank).toBe(4)
    expect(result[0].rows).toHaveLength(3)
    expect(result[0].rows[0].rank).toBe(2)
    expect(result[0].rows[2].rank).toBe(4)
    expect(result[0].rows[2].isCurrentUser).toBe(true)
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

    expect(result[0].userRank).toBe(3)
    expect(result[0].rows).toHaveLength(3)
    expect(result[0].rows[0].rank).toBe(2)
    expect(result[0].rows[1].rank).toBe(3)
    expect(result[0].rows[1].isCurrentUser).toBe(true)
    expect(result[0].rows[2].rank).toBe(4)
  })

  it('sets rankChange to null when only one snapshot exists', async () => {
    vi.mocked(groupRankingRepository.getLatestTwoGroupRankingSnapshots).mockResolvedValue([
      testFactories.groupRanking({ rank: 2 }),
    ])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result[0].rankChange).toBeNull()
  })

  it('returns positive rankChange when user moved up in rank', async () => {
    // snapshots[0] = latest (rank 2), snapshots[1] = previous (rank 4)
    // rankChange = previous - current = 4 - 2 = +2 (moved up)
    vi.mocked(groupRankingRepository.getLatestTwoGroupRankingSnapshots).mockResolvedValue([
      testFactories.groupRanking({ rank: 2 }),
      testFactories.groupRanking({ rank: 4 }),
    ])

    const result = await getLeaderboardPeekData(TOURNAMENT_ID, 'en')

    expect(result[0].rankChange).toBe(2)
  })
})
