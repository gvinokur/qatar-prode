import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActionCenterGames, getLeaderboardPeekData, getRecentResultsData } from '../hub-actions'
import * as gameRepository from '@/app/db/game-repository'
import * as gameGuessRepository from '@/app/db/game-guess-repository'
import * as teamRepository from '@/app/db/team-repository'
import * as tournamentRepository from '@/app/db/tournament-repository'
import * as prodeGroupRepository from '@/app/db/prode-group-repository'
import * as groupRankingRepository from '@/app/db/group-ranking-repository'
import * as tournamentGuessRepository from '@/app/db/tournament-guess-repository'
import * as userActions from '../user-actions'
import { applyLocalizationBatch } from '@/app/utils/localization-helper'
import { testFactories } from '../../../__tests__/db/test-factories'

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000
const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

vi.mock('@/app/db/game-repository', () => ({
  findGamesForDashboard: vi.fn(),
  findFirstGameInTournament: vi.fn(),
  findLastGameInTournament: vi.fn(),
  findRecentGamesWithUserGuesses: vi.fn(),
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

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@/app/utils/localization-helper', () => ({
  applyLocalizationBatch: vi.fn((items: any[]) => items),
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
    expect(result[0].rows).toHaveLength(3)
    // The current user must appear in the window
    expect(result[0].rows.some((r) => r.isCurrentUser)).toBe(true)
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

// ---------------------------------------------------------------------------
// getRecentResultsData
// ---------------------------------------------------------------------------

const makeRawGame = (overrides?: Partial<any>) => ({
  gameId: 'game-1',
  homeTeamId: 'team-1',
  awayTeamId: 'team-2',
  homeScore: 2,
  awayScore: 1,
  userHomeGuess: 2,
  userAwayGuess: 1,
  guessScore: 3,
  boostType: null,
  boostMultiplier: null,
  finalScore: null,
  gameDate: new Date('2022-12-18'),
  ...overrides,
})

describe('getRecentResultsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(
      testFactories.user({ id: USER_ID }) as any
    )
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([])
    vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([])
    vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(null as any)
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(defaultTournament)
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([])
    vi.mocked(teamRepository.findQualifiedTeams).mockResolvedValue({
      teams: [],
      completeGroupIds: new Set(),
      allGroupsComplete: false,
    } as any)
    vi.mocked(applyLocalizationBatch).mockImplementation((teams) => teams)
  })

  it('throws Unauthorized when no active session', async () => {
    vi.mocked(userActions.getLoggedInUser).mockResolvedValue(null as any)

    await expect(getRecentResultsData(TOURNAMENT_ID, 'en')).rejects.toThrow(
      'Unauthorized'
    )
  })

  it('returns empty recentGames when findRecentGamesWithUserGuesses returns []', async () => {
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([])

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames).toEqual([])
  })

  it('returns null for qualifiedTeamsScore when stats array is empty', async () => {
    vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue(
      []
    )

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.qualifiedTeamsScore).toBeNull()
    expect(result.qualifiedTeamsCorrect).toBeNull()
    expect(result.individualAwardsScore).toBeNull()
    expect(result.honorRollScore).toBeNull()
  })

  it('returns populated scores when stats array has entries', async () => {
    const stats = {
      qualified_teams_score: 10,
      qualified_teams_correct: 8,
      individual_awards_score: 5,
      honor_roll_score: 2,
    }
    vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue(
      [stats] as any
    )

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.qualifiedTeamsScore).toBe(10)
    expect(result.qualifiedTeamsCorrect).toBe(8)
    expect(result.individualAwardsScore).toBe(5)
    expect(result.honorRollScore).toBe(2)
  })

  it('returns qualifiedTeamsActualCount equal to number of qualified teams from findQualifiedTeams', async () => {
    vi.mocked(teamRepository.findQualifiedTeams).mockResolvedValue({
      teams: [
        { id: 'team-1', name: 'Argentina', short_name: 'ARG', group_id: 'g1', position: 1 },
        { id: 'team-2', name: 'France', short_name: 'FRA', group_id: 'g1', position: 2 },
        { id: 'team-3', name: 'Brazil', short_name: 'BRA', group_id: 'g2', position: 1 },
      ],
      completeGroupIds: new Set(['g1', 'g2']),
      allGroupsComplete: false,
    } as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.qualifiedTeamsActualCount).toBe(3)
  })

  it('returns qualifiedTeamsActualCount of 0 when no teams have qualified', async () => {
    vi.mocked(teamRepository.findQualifiedTeams).mockResolvedValue({
      teams: [],
      completeGroupIds: new Set(),
      allGroupsComplete: false,
    } as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.qualifiedTeamsActualCount).toBe(0)
  })

  it('correctly computes boostBonus as finalPoints minus basePoints', async () => {
    const rawGame = makeRawGame({
      guessScore: 3,
      finalScore: 8, // 8 - 3 = 5 boost
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)
    const team1 = testFactories.team({ id: 'team-1' })
    const team2 = testFactories.team({ id: 'team-2' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team1,
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].boostBonus).toBe(5)
    expect(result.recentGames[0].finalPoints).toBe(8)
    expect(result.recentGames[0].basePoints).toBe(3)
  })

  it('includes localized team names when teamsMap has team', async () => {
    const rawGame = makeRawGame({
      homeTeamId: 'team-1',
      awayTeamId: 'team-2',
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)

    const team1 = testFactories.team({ id: 'team-1', name: 'Argentina' })
    const team2 = testFactories.team({ id: 'team-2', name: 'France' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team1,
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].homeTeamName).toBe('Argentina')
    expect(result.recentGames[0].awayTeamName).toBe('France')
  })

  it('falls back to teamId when team not found in teamsMap', async () => {
    const rawGame = makeRawGame({
      homeTeamId: 'unknown-team',
      awayTeamId: 'team-2',
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)

    const team2 = testFactories.team({ id: 'team-2', name: 'France' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].homeTeamName).toBe('unknown-team')
    expect(result.recentGames[0].awayTeamName).toBe('France')
  })

  it('uses basePoints when finalScore is null', async () => {
    const rawGame = makeRawGame({
      guessScore: 3,
      finalScore: null,
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)
    const team1 = testFactories.team({ id: 'team-1' })
    const team2 = testFactories.team({ id: 'team-2' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team1,
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].finalPoints).toBe(3)
    expect(result.recentGames[0].boostBonus).toBe(0)
  })

  it('handles game with no guessScore (null)', async () => {
    const rawGame = makeRawGame({
      guessScore: null,
      finalScore: null,
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)
    const team1 = testFactories.team({ id: 'team-1' })
    const team2 = testFactories.team({ id: 'team-2' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team1,
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].finalPoints).toBe(0)
    expect(result.recentGames[0].basePoints).toBe(0)
  })

  it('preserves boostType in game item', async () => {
    const rawGame = makeRawGame({
      boostType: 'golden',
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)
    const team1 = testFactories.team({ id: 'team-1' })
    const team2 = testFactories.team({ id: 'team-2' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team1,
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    expect(result.recentGames[0].boostType).toBe('golden')
  })

  it('maps game data correctly including scores and guesses', async () => {
    const rawGame = makeRawGame({
      gameId: 'game-xyz',
      homeScore: 3,
      awayScore: 2,
      userHomeGuess: 2,
      userAwayGuess: 2,
    })
    vi.mocked(gameRepository.findRecentGamesWithUserGuesses).mockResolvedValue([
      rawGame,
    ] as any)
    const team1 = testFactories.team({ id: 'team-1', name: 'Brazil' })
    const team2 = testFactories.team({ id: 'team-2', name: 'Germany' })
    vi.mocked(teamRepository.findTeamInTournament).mockResolvedValue([
      team1,
      team2,
    ] as any)

    const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

    const game = result.recentGames[0]
    expect(game.gameId).toBe('game-xyz')
    expect(game.homeTeamName).toBe('Brazil')
    expect(game.awayTeamName).toBe('Germany')
    expect(game.homeScore).toBe(3)
    expect(game.awayScore).toBe(2)
    expect(game.userHomeGuess).toBe(2)
    expect(game.userAwayGuess).toBe(2)
  })

  describe('honorRollCorrect', () => {
    it('returns null when honorRollScore is null (not yet scored)', async () => {
      vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([])

      const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

      expect(result.honorRollCorrect).toBeNull()
    })

    it('returns empty array when scored but no honor roll positions match', async () => {
      const stats = { honor_roll_score: 0, individual_awards_score: null,
        qualified_teams_score: null, qualified_teams_correct: null }
      vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([stats] as any)
      const tournament = testFactories.tournament({
        id: TOURNAMENT_ID,
        champion_team_id: 'team-champ',
        runner_up_team_id: 'team-runner',
        third_place_team_id: 'team-third',
      })
      vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(tournament)
      const guess = testFactories.tournamentGuess({
        champion_team_id: 'team-wrong',
        runner_up_team_id: 'team-wrong',
        third_place_team_id: 'team-wrong',
      })
      vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(guess as any)

      const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

      expect(result.honorRollCorrect).toEqual([])
    })

    it('returns matched positions when honor roll positions match tournament results', async () => {
      const stats = { honor_roll_score: 8, individual_awards_score: null,
        qualified_teams_score: null, qualified_teams_correct: null }
      vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([stats] as any)
      const tournament = testFactories.tournament({
        id: TOURNAMENT_ID,
        champion_team_id: 'team-champ',
        runner_up_team_id: 'team-runner',
        third_place_team_id: null,
      })
      vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(tournament)
      const guess = testFactories.tournamentGuess({
        champion_team_id: 'team-champ',   // correct
        runner_up_team_id: 'team-runner', // correct
        third_place_team_id: 'team-wrong',
      })
      vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(guess as any)

      const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

      expect(result.honorRollCorrect).toEqual(['champion', 'runnerUp'])
    })
  })

  describe('individualAwardsCorrect', () => {
    it('returns null when individualAwardsScore is null (not yet scored)', async () => {
      vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([])

      const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

      expect(result.individualAwardsCorrect).toBeNull()
    })

    it('returns empty array when scored but no individual award types match', async () => {
      const stats = { individual_awards_score: 0, honor_roll_score: null,
        qualified_teams_score: null, qualified_teams_correct: null }
      vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([stats] as any)
      const tournament = testFactories.tournament({
        id: TOURNAMENT_ID,
        best_player_id: 'player-best',
        top_goalscorer_player_id: 'player-top',
      })
      vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(tournament)
      const guess = testFactories.tournamentGuess({
        best_player_id: 'player-wrong',
        top_goalscorer_player_id: 'player-wrong',
      })
      vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(guess as any)

      const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

      expect(result.individualAwardsCorrect).toEqual([])
    })

    it('returns matched award types when individual awards match tournament results', async () => {
      const stats = { individual_awards_score: 6, honor_roll_score: null,
        qualified_teams_score: null, qualified_teams_correct: null }
      vi.mocked(tournamentGuessRepository.getTournamentGuessStatsForUsers).mockResolvedValue([stats] as any)
      const tournament = testFactories.tournament({
        id: TOURNAMENT_ID,
        best_player_id: 'player-best',
        top_goalscorer_player_id: 'player-top',
        best_goalkeeper_player_id: 'player-gk',
        best_young_player_id: null,
      })
      vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(tournament)
      const guess = testFactories.tournamentGuess({
        best_player_id: 'player-best',    // correct
        top_goalscorer_player_id: 'player-wrong',
        best_goalkeeper_player_id: 'player-gk', // correct
      })
      vi.mocked(tournamentGuessRepository.findTournamentGuessByUserIdTournament).mockResolvedValue(guess as any)

      const result = await getRecentResultsData(TOURNAMENT_ID, 'en')

      expect(result.individualAwardsCorrect).toEqual(['bestPlayer', 'bestGoalkeeper'])
    })
  })
})
