import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getUserStatsForComparison } from '../../app/actions/stats-actions'

// Mock next-intl/server (required by transitive imports)
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
  getLocale: vi.fn(() => Promise.resolve('es')),
}))

// Mock the repository functions
vi.mock('../../app/db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: vi.fn(),
}))

vi.mock('../../app/db/tournament-guess-repository', () => ({
  getTournamentGuessStatsForUsers: vi.fn(),
}))

vi.mock('../../app/db/game-repository', () => ({
  getGameCountsForTournament: vi.fn(),
}))

import { getGameGuessStatisticsForUsers } from '../../app/db/game-guess-repository'
import { getTournamentGuessStatsForUsers } from '../../app/db/tournament-guess-repository'
import { getGameCountsForTournament } from '../../app/db/game-repository'

const mockGameStats = [
  {
    user_id: 'user-1',
    group_score: 500,
    group_boost_bonus: 50,
    playoff_score: 270,
    playoff_boost_bonus: 30,
    group_correct_guesses: 30,
    group_exact_guesses: 10,
    playoff_correct_guesses: 8,
    playoff_exact_guesses: 3,
    total_correct_guesses: 38,
    total_exact_guesses: 13,
  },
  {
    user_id: 'user-2',
    group_score: 400,
    group_boost_bonus: 0,
    playoff_score: 200,
    playoff_boost_bonus: 20,
    group_correct_guesses: 25,
    group_exact_guesses: 8,
    playoff_correct_guesses: 6,
    playoff_exact_guesses: 2,
    total_correct_guesses: 31,
    total_exact_guesses: 10,
  },
]

const mockTournamentGuesses = [
  {
    user_id: 'user-1',
    honor_roll_score: 40,
    individual_awards_score: 60,
    qualified_teams_score: 150,
    qualified_teams_correct: 12,
    qualified_teams_exact: 4,
    group_position_score: 10,
  },
  {
    user_id: 'user-2',
    honor_roll_score: 20,
    individual_awards_score: 30,
    qualified_teams_score: 100,
    qualified_teams_correct: 8,
    qualified_teams_exact: 2,
    group_position_score: 5,
  },
]

const mockGameCounts = { total: 64, played: 48 }

describe('getUserStatsForComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getGameGuessStatisticsForUsers as any).mockResolvedValue(mockGameStats)
    ;(getTournamentGuessStatsForUsers as any).mockResolvedValue(mockTournamentGuesses)
    ;(getGameCountsForTournament as any).mockResolvedValue(mockGameCounts)
  })

  it('returns stats for both users', async () => {
    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')

    expect(result).toHaveLength(2)
    expect(result[0].userId).toBe('user-1')
    expect(result[1].userId).toBe('user-2')
  })

  it('calls all repositories in parallel with correct args', async () => {
    await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')

    expect(getGameGuessStatisticsForUsers).toHaveBeenCalledWith(['user-1', 'user-2'], 'tournament-1')
    expect(getTournamentGuessStatsForUsers).toHaveBeenCalledWith(['user-1', 'user-2'], 'tournament-1')
    expect(getGameCountsForTournament).toHaveBeenCalledWith('tournament-1')
  })

  it('calculates correct performance stats for user-1', async () => {
    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')
    const { performance } = result[0]

    // Group stage: 500 (games) + 50 (boost) + 150 (qualified teams) = 700
    expect(performance.groupStagePoints).toBe(700)
    expect(performance.groupGamePoints).toBe(500)
    expect(performance.groupBoostBonus).toBe(50)
    expect(performance.groupQualifiedTeamsPoints).toBe(150)

    // Playoff stage: 270 (games) + 30 (boost) + 40 (honor roll) + 60 (awards) = 400
    expect(performance.playoffStagePoints).toBe(400)
    expect(performance.playoffGamePoints).toBe(270)
    expect(performance.playoffBoostBonus).toBe(30)
    expect(performance.honorRollPoints).toBe(40)
    expect(performance.individualAwardsPoints).toBe(60)

    // Total: 700 + 400 = 1100
    expect(performance.totalPoints).toBe(1100)
  })

  it('calculates correct performance stats for user-2', async () => {
    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')
    const { performance } = result[1]

    // Group stage: 400 + 0 + 100 = 500
    expect(performance.groupStagePoints).toBe(500)
    // Playoff stage: 200 + 20 + 20 + 30 = 270
    expect(performance.playoffStagePoints).toBe(270)
    expect(performance.totalPoints).toBe(770)
  })

  it('calculates accuracy stats based on game counts', async () => {
    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')
    const { accuracy } = result[0]

    // total_correct: 38, played: 48 → 79.17%
    expect(accuracy.overallCorrectPercentage).toBeCloseTo(79.17, 1)
    // total_exact: 13, played: 48 → 27.08%
    expect(accuracy.overallExactPercentage).toBeCloseTo(27.08, 1)
  })

  it('handles missing game stats gracefully (null gameStats)', async () => {
    ;(getGameGuessStatisticsForUsers as any).mockResolvedValue([]) // no stats for any user

    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')

    // All game-based points should be 0
    expect(result[0].performance.groupGamePoints).toBe(0)
    expect(result[0].performance.playoffGamePoints).toBe(0)
    expect(result[0].performance.groupBoostBonus).toBe(0)
    expect(result[0].performance.playoffBoostBonus).toBe(0)
  })

  it('handles missing tournament guess data gracefully', async () => {
    ;(getTournamentGuessStatsForUsers as any).mockResolvedValue([])

    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')

    expect(result[0].performance.groupQualifiedTeamsPoints).toBe(0)
    expect(result[0].performance.honorRollPoints).toBe(0)
    expect(result[0].performance.individualAwardsPoints).toBe(0)
  })

  it('handles zero games played without division errors', async () => {
    ;(getGameCountsForTournament as any).mockResolvedValue({ total: 64, played: 0 })

    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')

    expect(result[0].accuracy.overallCorrectPercentage).toBe(0)
    expect(result[0].accuracy.overallExactPercentage).toBe(0)
  })

  it('returns performance and accuracy for each userId', async () => {
    const result = await getUserStatsForComparison(['user-1', 'user-2'], 'tournament-1')

    for (const entry of result) {
      expect(entry).toHaveProperty('userId')
      expect(entry).toHaveProperty('performance')
      expect(entry).toHaveProperty('accuracy')
      expect(entry.performance).toHaveProperty('totalPoints')
      expect(entry.accuracy).toHaveProperty('overallCorrectPercentage')
    }
  })
})
