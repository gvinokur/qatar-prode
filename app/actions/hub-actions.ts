'use server'

import { findGamesForDashboard, findFirstGameInTournament, findLastGameInTournament, findRecentGamesWithUserGuesses, findFirstGameFullData } from '../db/game-repository'
import { findGameGuessesByUserId } from '../db/game-guess-repository'
import { findTeamInTournament, findQualifiedTeams } from '../db/team-repository'
import { findTournamentById } from '../db/tournament-repository'
import { findProdeGroupsByOwner, findProdeGroupsByParticipant } from '../db/prode-group-repository'
import { getLatestRankingsForGroup, getLatestTwoGroupRankingSnapshots } from '../db/group-ranking-repository'
import { getFavoriteGroupIds } from '../db/favorite-groups-repository'
import { getTournamentGuessStatsForUsers, findTournamentGuessByUserIdTournament } from '../db/tournament-guess-repository'
import { getTournamentPredictionCompletion } from '../db/tournament-prediction-completion-repository'
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
  /** game_date of the first tournament game (null if no games) */
  firstGameDate: Date | null
  /** Full game data for the opener card — only populated when mode=empty and tournament not started */
  openerGame: ExtendedGameData | null
  /** Total number of games in the tournament */
  totalGames: number
  /** Number of games the user has fully predicted (both scores, playoff penalty included) */
  predictedGames: number
  /** Sum of completed podium + individual awards (out of awardsTotal) */
  awardsCompleted: number
  /** Total number of award predictions available (3 podium + 4 individual = 7) */
  awardsTotal: number
  /** Number of qualifying team slots the user has predicted */
  qualifiersCompleted: number
  /** Total qualifying team slots available for the tournament */
  qualifiersTotal: number
  /** True when the first game kicked off within the last 48h (celebration banner period) */
  tournamentJustStarted: boolean
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

  const CELEBRATION_WINDOW_MS = 48 * 60 * 60 * 1000

  const [games, guessesArray, teams, tournament, firstGame, lastGame] = await Promise.all([
    findGamesForDashboard(tournamentId),
    findGameGuessesByUserId(user.id, tournamentId),
    findTeamInTournament(tournamentId),
    findTournamentById(tournamentId),
    findFirstGameInTournament(tournamentId),
    findLastGameInTournament(tournamentId),
  ])

  // Use the same completion logic as the Predictions Dashboard for consistent progress data
  const predictionCompletion = tournament
    ? await getTournamentPredictionCompletion(user.id, tournamentId, tournament)
    : null

  const now = Date.now()
  const tournamentFinished = !!lastGame && lastGame.game_date.getTime() < now
  const firstGameDate = firstGame?.game_date ?? null
  const totalGames = predictionCompletion?.totalGames ?? 0
  const predictedGames = predictionCompletion?.completedGames ?? 0
  const awardsCompleted = (predictionCompletion?.finalStandings.completed ?? 0) + (predictionCompletion?.awards.completed ?? 0)
  const awardsTotal = (predictionCompletion?.finalStandings.total ?? 0) + (predictionCompletion?.awards.total ?? 0)
  const qualifiersCompleted = predictionCompletion?.qualifiers.completed ?? 0
  const qualifiersTotal = predictionCompletion?.qualifiers.total ?? 0
  const tournamentJustStarted = !!(
    firstGameDate &&
    firstGameDate.getTime() < now &&
    now - firstGameDate.getTime() < CELEBRATION_WINDOW_MS
  )

  const { qtAndAwardsOpen, msUntilPredictionLock } = computePredictionLockState(
    tournament,
    firstGame?.game_date
  )

  if (games.length === 0) {
    const localizedTeams = applyLocalizationBatch(teams, locale, [
      { field: 'name', i18nField: 'name_i18n' },
    ])
    const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))

    // Fetch opener game data when pre-tournament (firstGame is in the future)
    let openerGame: ExtendedGameData | null = null
    let openerGameGuesses: Record<string, GameGuessNew> = {}
    if (firstGameDate && firstGameDate.getTime() > now) {
      const fullOpenerGame = await findFirstGameFullData(tournamentId)
      if (fullOpenerGame) {
        const [localizedOpener] = applyLocalizationBatch([fullOpenerGame], locale, [
          { field: 'location', i18nField: 'location_i18n' },
        ]) as ExtendedGameData[]
        openerGame = localizedOpener
        // Include user's guess for the opener game if it exists
        const openerGuess = guessesArray.find((g) => g.game_id === fullOpenerGame.id)
        if (openerGuess) {
          openerGameGuesses = { [fullOpenerGame.id]: openerGuess }
        }
      }
    }

    return {
      games: [],
      gameGuesses: openerGameGuesses,
      teamsMap,
      tournamentMaxSilver: tournament?.max_silver_games ?? 0,
      tournamentMaxGolden: tournament?.max_golden_games ?? 0,
      mode: 'empty',
      qtAndAwardsOpen,
      msUntilPredictionLock,
      tournamentFinished,
      firstGameDate,
      openerGame,
      totalGames,
      predictedGames,
      awardsCompleted,
      awardsTotal,
      qualifiersCompleted,
      qualifiersTotal,
      tournamentJustStarted,
    }
  }

  // Build a set of game IDs the user has already guessed
  const guessedGameIds = new Set(guessesArray.map((g) => g.game_id))
  const guessesMapAll = Object.fromEntries(guessesArray.map((g) => [g.game_id, g]))

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
    firstGameDate,
    openerGame: null,
    totalGames,
    predictedGames,
    awardsCompleted,
    awardsTotal,
    qualifiersCompleted,
    qualifiersTotal,
    tournamentJustStarted,
  }
}

export interface LeaderboardPeekResult {
  groups: GroupPeekData[]
  userHasGroups: boolean
  allGroupNames: Array<{ id: string; name: string }>
}

const MAX_PEEK_GROUPS = 3

/**
 * Fetches the current user's leaderboard standing in their top friend groups for a tournament.
 * Returns up to 3 groups sorted by ranked member count descending, each with a 3-row
 * neighbor window (person above, user, person below) and a momentum indicator (rank change).
 * Also returns userHasGroups (before ranking filter) and allGroupNames (for pre-tournament preview).
 * Returns { groups: [], userHasGroups: false, allGroupNames: [] } when unauthenticated.
 */
export async function getLeaderboardPeekData(
  tournamentId: string,
  _locale: Locale
): Promise<LeaderboardPeekResult> {
  const user = await getLoggedInUser()
  if (!user?.id) return { groups: [], userHasGroups: false, allGroupNames: [] }

  const [ownedGroups, participantGroups, favoriteGroupIds] = await Promise.all([
    findProdeGroupsByOwner(user.id),
    findProdeGroupsByParticipant(user.id),
    getFavoriteGroupIds(user.id),
  ])

  // Deduplicate: owner may also appear in participant list
  const allGroupsMap = new Map([
    ...ownedGroups.map((g) => [g.id, g] as const),
    ...participantGroups.map((g) => [g.id, g] as const),
  ])
  const allGroups = Array.from(allGroupsMap.values())

  // Build allGroupNames from ALL groups (before ranking filter) — used for pre-tournament preview
  const allGroupNames = allGroups.map((g) => ({ id: g.id, name: g.name }))
  const userHasGroups = allGroups.length > 0

  if (allGroups.length === 0) return { groups: [], userHasGroups: false, allGroupNames: [] }

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

  // Sort: favorites first (by member count desc), then non-favorites (by member count desc)
  const favoriteSet = new Set(favoriteGroupIds)
  candidates.sort((a, b) => {
    const aFav = favoriteSet.has(a.group.id) ? 1 : 0
    const bFav = favoriteSet.has(b.group.id) ? 1 : 0
    if (bFav !== aFav) return bFav - aFav
    return b.rankings.length - a.rankings.length
  })
  const topCandidates = candidates.slice(0, MAX_PEEK_GROUPS)

  if (topCandidates.length === 0) return { groups: [], userHasGroups, allGroupNames }

  // Fetch rank change snapshots for top 3 groups concurrently
  const snapshotResults = await Promise.all(
    topCandidates.map((c) => getLatestTwoGroupRankingSnapshots(user.id, c.group.id, tournamentId))
  )

  const groups: GroupPeekData[] = topCandidates.map((candidate, idx) => {
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

  return { groups, userHasGroups, allGroupNames }
}

export type HonorRollPosition = 'champion' | 'runnerUp' | 'thirdPlace'
export type IndividualAwardType = 'bestPlayer' | 'topGoalscorer' | 'bestGoalkeeper' | 'bestYoungPlayer'

type TournamentResult = Awaited<ReturnType<typeof findTournamentById>>
type TournamentGuess = Awaited<ReturnType<typeof findTournamentGuessByUserIdTournament>>

function computeHonorRollCorrect(
  tournament: TournamentResult,
  tournamentGuess: TournamentGuess
): HonorRollPosition[] {
  const correct: HonorRollPosition[] = []
  if (!tournamentGuess) return correct
  if (tournament?.champion_team_id && tournamentGuess.champion_team_id === tournament.champion_team_id) {
    correct.push('champion')
  }
  if (tournament?.runner_up_team_id && tournamentGuess.runner_up_team_id === tournament.runner_up_team_id) {
    correct.push('runnerUp')
  }
  if (tournament?.third_place_team_id && tournamentGuess.third_place_team_id === tournament.third_place_team_id) {
    correct.push('thirdPlace')
  }
  return correct
}

function computeIndividualAwardsCorrect(
  tournament: TournamentResult,
  tournamentGuess: TournamentGuess
): IndividualAwardType[] {
  const correct: IndividualAwardType[] = []
  if (!tournamentGuess) return correct
  if (tournament?.best_player_id && tournamentGuess.best_player_id === tournament.best_player_id) {
    correct.push('bestPlayer')
  }
  if (tournament?.top_goalscorer_player_id && tournamentGuess.top_goalscorer_player_id === tournament.top_goalscorer_player_id) {
    correct.push('topGoalscorer')
  }
  if (tournament?.best_goalkeeper_player_id && tournamentGuess.best_goalkeeper_player_id === tournament.best_goalkeeper_player_id) {
    correct.push('bestGoalkeeper')
  }
  if (tournament?.best_young_player_id && tournamentGuess.best_young_player_id === tournament.best_young_player_id) {
    correct.push('bestYoungPlayer')
  }
  return correct
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
  /** Number of teams that have actually qualified (from tournament_group_teams.is_complete) */
  qualifiedTeamsActualCount: number
  individualAwardsScore: number | null
  honorRollScore: number | null
  /** Positions user predicted correctly; null = honor roll not yet scored */
  honorRollCorrect: HonorRollPosition[] | null
  /** Award types user predicted correctly; null = awards not yet scored */
  individualAwardsCorrect: IndividualAwardType[] | null
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

  const [recentGames, statsArray, teams, qualifiedTeamsResult, tournament, tournamentGuess] = await Promise.all([
    findRecentGamesWithUserGuesses(user.id, tournamentId, RECENT_GAMES_LIMIT),
    getTournamentGuessStatsForUsers([user.id], tournamentId),
    findTeamInTournament(tournamentId),
    findQualifiedTeams(tournamentId),
    findTournamentById(tournamentId),
    findTournamentGuessByUserIdTournament(user.id, tournamentId),
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
  const honorRollScoreValue = stats?.honor_roll_score ?? null
  const individualAwardsScoreValue = stats?.individual_awards_score ?? null

  const honorRollCorrect: HonorRollPosition[] | null =
    honorRollScoreValue !== null && tournament
      ? computeHonorRollCorrect(tournament, tournamentGuess)
      : null

  const individualAwardsCorrect: IndividualAwardType[] | null =
    individualAwardsScoreValue !== null && tournament
      ? computeIndividualAwardsCorrect(tournament, tournamentGuess)
      : null

  return {
    recentGames: gameItems,
    qualifiedTeamsScore: stats?.qualified_teams_score ?? null,
    qualifiedTeamsCorrect: stats?.qualified_teams_correct ?? null,
    qualifiedTeamsActualCount: qualifiedTeamsResult.teams.length,
    individualAwardsScore: individualAwardsScoreValue,
    honorRollScore: honorRollScoreValue,
    honorRollCorrect,
    individualAwardsCorrect,
  }
}
