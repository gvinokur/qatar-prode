'use server'

import { findGamesForDashboard, findFirstGameInTournament, findLastGameInTournament, findRecentGamesWithUserGuesses } from '../db/game-repository'
import { findGameGuessesByUserId } from '../db/game-guess-repository'
import { findTeamInTournament } from '../db/team-repository'
import { findTournamentById } from '../db/tournament-repository'
import { findProdeGroupsByOwner, findProdeGroupsByParticipant } from '../db/prode-group-repository'
import { getLatestRankingsForGroup, getLatestTwoGroupRankingSnapshots } from '../db/group-ranking-repository'
import { getTournamentGuessStatsForUsers } from '../db/tournament-guess-repository'
import { getAllUserGroupPositionsPredictions } from '../db/qualified-teams-repository'
import { getLoggedInUser } from './user-actions'
import { applyLocalizationBatch } from '../utils/localization-helper'
import { calculateDeadline } from '../utils/countdown-utils'
import { ExtendedGameData } from '../definitions'
import { GameGuessNew, Team } from '../db/tables-definition'
import type { Locale } from '../../i18n.config'

export interface RankNeighborEntry {
  userId: string
  userName: string
  rank: number
  score: number
  isCurrentUser: boolean
}

export interface GroupPeekData {
  groupId: string
  groupName: string
  totalMembers: number
  userRank: number
  rankChange: number | null
  rows: RankNeighborEntry[]
}

export interface ActionCenterData {
  games: ExtendedGameData[]
  gameGuesses: Record<string, GameGuessNew>
  teamsMap: Record<string, Team>
  tournamentMaxSilver: number
  tournamentMaxGolden: number
  mode: 'urgent' | 'fallback' | 'empty'
  /** True when the 5-day tournament prediction window has not yet closed */
  qtAndAwardsOpen: boolean
  /** Milliseconds until QT/awards predictions lock (negative = already locked) */
  msUntilPredictionLock: number
  /** True when the last scheduled game has already kicked off — tournament is over */
  tournamentFinished: boolean
}

const MAX_URGENT_CARDS = 4
const FALLBACK_CARD_COUNT = 3
const PREDICTION_LOCK_OFFSET_MS = 5 * 24 * 60 * 60 * 1000 // 5 days after tournament start

/**
 * Computes whether QT/awards predictions are still open and how many ms remain.
 * Both lock 5 days after the first game of the tournament.
 */
function computePredictionLockState(
  tournament: { is_active?: boolean } | undefined | null,
  firstGameDate: Date | undefined | null
): { qtAndAwardsOpen: boolean; msUntilPredictionLock: number } {
  if (!tournament?.is_active || !firstGameDate) {
    return { qtAndAwardsOpen: false, msUntilPredictionLock: 0 }
  }
  const lockTime = firstGameDate.getTime() + PREDICTION_LOCK_OFFSET_MS
  const msRemaining = lockTime - Date.now()
  return { qtAndAwardsOpen: msRemaining > 0, msUntilPredictionLock: msRemaining }
}

/**
 * Fetches and ranks upcoming games for the Tournament Hub Action Center.
 * Returns up to 4 unpredicted open games (urgent mode), or 3 upcoming games
 * when all open-deadline games have been predicted (fallback mode), or empty
 * when no games exist in the window.
 * Also computes whether QT/awards predictions are still open.
 */
export async function getActionCenterGames(
  tournamentId: string,
  locale: Locale
): Promise<ActionCenterData> {
  const user = await getLoggedInUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }

  const [games, guessesArray, teams, tournament, firstGame, lastGame] = await Promise.all([
    findGamesForDashboard(tournamentId),
    findGameGuessesByUserId(user.id, tournamentId),
    findTeamInTournament(tournamentId),
    findTournamentById(tournamentId),
    findFirstGameInTournament(tournamentId),
    findLastGameInTournament(tournamentId),
  ])

  const tournamentFinished = !!lastGame && lastGame.game_date.getTime() < Date.now()

  const { qtAndAwardsOpen, msUntilPredictionLock } = computePredictionLockState(
    tournament,
    firstGame?.game_date
  )

  if (games.length === 0) {
    const localizedTeams = applyLocalizationBatch(teams, locale, [
      { field: 'name', i18nField: 'name_i18n' },
    ])
    const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))
    return {
      games: [],
      gameGuesses: {},
      teamsMap,
      tournamentMaxSilver: tournament?.max_silver_games ?? 0,
      tournamentMaxGolden: tournament?.max_golden_games ?? 0,
      mode: 'empty',
      qtAndAwardsOpen,
      msUntilPredictionLock,
      tournamentFinished,
    }
  }

  // Build a set of game IDs the user has already guessed
  const guessedGameIds = new Set(guessesArray.map((g) => g.game_id))
  const guessesMapAll = Object.fromEntries(guessesArray.map((g) => [g.game_id, g]))

  const now = Date.now()

  // Urgent mode: unpredicted games with deadline still open, sorted by deadline asc
  const urgentGames = games
    .filter((g) => {
      const deadline = calculateDeadline(g.game_date)
      return deadline > now && !guessedGameIds.has(g.id)
    })
    .sort((a, b) => calculateDeadline(a.game_date) - calculateDeadline(b.game_date))
    .slice(0, MAX_URGENT_CARDS)

  let selectedGames: ExtendedGameData[]
  let mode: ActionCenterData['mode']

  if (urgentGames.length > 0) {
    selectedGames = urgentGames
    mode = 'urgent'
  } else {
    // Fallback: next 3 games by game_date asc (open or already predicted)
    const upcomingGames = [...games]
      .sort((a, b) => a.game_date.getTime() - b.game_date.getTime())
      .slice(0, FALLBACK_CARD_COUNT)
    selectedGames = upcomingGames
    mode = 'fallback'
  }

  // Localize teams and games
  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' },
  ])
  const localizedGames = applyLocalizationBatch(selectedGames, locale, [
    { field: 'location', i18nField: 'location_i18n' },
  ]) as ExtendedGameData[]

  const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))

  // Only include guesses for the selected carousel games
  const gameGuesses: Record<string, GameGuessNew> = {}
  for (const game of localizedGames) {
    if (guessesMapAll[game.id]) {
      gameGuesses[game.id] = guessesMapAll[game.id]
    }
  }

  return {
    games: localizedGames,
    gameGuesses,
    teamsMap,
    tournamentMaxSilver: tournament?.max_silver_games ?? 0,
    tournamentMaxGolden: tournament?.max_golden_games ?? 0,
    mode,
    qtAndAwardsOpen,
    msUntilPredictionLock,
    tournamentFinished,
  }
}

const MAX_PEEK_GROUPS = 3

/**
 * Fetches the current user's leaderboard standing in their top friend groups for a tournament.
 * Returns up to 3 groups sorted by ranked member count descending, each with a 3-row
 * neighbor window (person above, user, person below) and a momentum indicator (rank change).
 * Returns empty array if user is unauthenticated or has no groups with ranking data.
 */
export async function getLeaderboardPeekData(
  tournamentId: string,
  _locale: Locale
): Promise<GroupPeekData[]> {
  const user = await getLoggedInUser()
  if (!user?.id) return []

  const [ownedGroups, participantGroups] = await Promise.all([
    findProdeGroupsByOwner(user.id),
    findProdeGroupsByParticipant(user.id),
  ])

  // Deduplicate: owner may also appear in participant list
  const allGroupsMap = new Map([
    ...ownedGroups.map((g) => [g.id, g] as const),
    ...participantGroups.map((g) => [g.id, g] as const),
  ])
  const allGroups = Array.from(allGroupsMap.values())

  if (allGroups.length === 0) return []

  // Fetch latest rankings for all groups concurrently
  const rankingsPerGroup = await Promise.all(
    allGroups.map((g) => getLatestRankingsForGroup(g.id, tournamentId))
  )

  // Build group candidates: only groups where the current user has a ranking entry
  const candidates: Array<{
    group: (typeof allGroups)[number]
    rankings: Awaited<ReturnType<typeof getLatestRankingsForGroup>>
    userRankEntry: { userId: string; userName: string; rank: number; score: number }
  }> = []

  for (let i = 0; i < allGroups.length; i++) {
    const rankings = rankingsPerGroup[i]
    const userEntry = rankings.find((r) => r.userId === user.id)
    if (userEntry) {
      candidates.push({ group: allGroups[i], rankings, userRankEntry: userEntry })
    }
  }

  // Sort by member count descending (most active groups first), take top 3
  candidates.sort((a, b) => b.rankings.length - a.rankings.length)
  const topCandidates = candidates.slice(0, MAX_PEEK_GROUPS)

  if (topCandidates.length === 0) return []

  // Fetch rank change snapshots for top 3 groups concurrently
  const snapshotResults = await Promise.all(
    topCandidates.map((c) => getLatestTwoGroupRankingSnapshots(user.id, c.group.id, tournamentId))
  )

  return topCandidates.map((candidate, idx) => {
    const { group, rankings, userRankEntry } = candidate
    const snapshots = snapshotResults[idx]

    // Compute rank change: previous rank minus current rank (positive = moved up)
    let rankChange: number | null = null
    if (snapshots.length === 2) {
      rankChange = snapshots[1].rank - snapshots[0].rank
    }

    // Build 3-row window around the user using array index (not rank value)
    // to guarantee exactly 3 rows even when ties exist at adjacent ranks
    const total = rankings.length
    const userRank = userRankEntry.rank
    const userIndex = rankings.findIndex((r) => r.userId === user.id)

    let sliceStart: number
    if (total <= 3) {
      sliceStart = 0
    } else if (userIndex <= 0) {
      sliceStart = 0
    } else if (userIndex >= total - 1) {
      sliceStart = total - 3
    } else {
      sliceStart = userIndex - 1
    }

    const rows: RankNeighborEntry[] = rankings
      .slice(sliceStart, sliceStart + 3)
      .map((r) => ({
        userId: r.userId,
        userName: r.userName,
        rank: r.rank,
        score: r.score,
        isCurrentUser: r.userId === user.id,
      }))

    return {
      groupId: group.id,
      groupName: group.name,
      totalMembers: total,
      userRank,
      rankChange,
      rows,
    }
  })
}

export interface RecentGameResultItem {
  gameId: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number
  awayScore: number
  userHomeGuess: number | null
  userAwayGuess: number | null
  basePoints: number
  boostType: 'silver' | 'golden' | null
  boostBonus: number
  finalPoints: number
  gameDate: Date
}

export interface RecentResultsData {
  recentGames: RecentGameResultItem[]
  qualifiedTeamsScore: number | null
  qualifiedTeamsCorrect: number | null
  qualifiedTeamsTotalPredicted: number | null
  individualAwardsScore: number | null
  honorRollScore: number | null
}

const RECENT_GAMES_LIMIT = 5

/**
 * Fetches recent game results with user guesses plus aggregated QT/award scores
 * for the authenticated user on the Tournament Hub.
 */
export async function getRecentResultsData(
  tournamentId: string,
  locale: Locale
): Promise<RecentResultsData> {
  const user = await getLoggedInUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }

  const [recentGames, statsArray, groupPredictions, teams] = await Promise.all([
    findRecentGamesWithUserGuesses(user.id, tournamentId, RECENT_GAMES_LIMIT),
    getTournamentGuessStatsForUsers([user.id], tournamentId),
    getAllUserGroupPositionsPredictions(user.id, tournamentId),
    findTeamInTournament(tournamentId),
  ])

  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' },
  ])
  const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))

  const gameItems: RecentGameResultItem[] = recentGames.map((g) => {
    const basePoints = g.guessScore ?? 0
    const finalPoints = g.finalScore ?? g.guessScore ?? 0
    const boostBonus = finalPoints - basePoints
    return {
      gameId: g.gameId,
      homeTeamName: (teamsMap[g.homeTeamId] as Team | undefined)?.name ?? g.homeTeamId,
      awayTeamName: (teamsMap[g.awayTeamId] as Team | undefined)?.name ?? g.awayTeamId,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      userHomeGuess: g.userHomeGuess,
      userAwayGuess: g.userAwayGuess,
      basePoints,
      boostType: g.boostType,
      boostBonus,
      finalPoints,
      gameDate: g.gameDate,
    }
  })

  const stats = statsArray[0] ?? null

  const qualifiedTeamsTotalPredicted = groupPredictions.reduce((sum, gp) => {
    const positions = gp.team_predicted_positions ?? []
    return sum + positions.filter((p) => p.predicted_to_qualify === true).length
  }, 0)

  return {
    recentGames: gameItems,
    qualifiedTeamsScore: stats?.qualified_teams_score ?? null,
    qualifiedTeamsCorrect: stats?.qualified_teams_correct ?? null,
    qualifiedTeamsTotalPredicted: groupPredictions.length > 0 ? qualifiedTeamsTotalPredicted : null,
    individualAwardsScore: stats?.individual_awards_score ?? null,
    honorRollScore: stats?.honor_roll_score ?? null,
  }
}
