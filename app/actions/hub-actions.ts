'use server'

import { db } from '../db/database'
import { findGamesForDashboard, findFirstGameInTournament, findLastGameInTournament, findRecentGamesForDashboard, findFirstGameFullData } from '../db/game-repository'
import { findGameGuessesByUserId } from '../db/game-guess-repository'
import { findTeamInTournament } from '../db/team-repository'
import { findTournamentById } from '../db/tournament-repository'
import { findProdeGroupsByOwner, findProdeGroupsByParticipant } from '../db/prode-group-repository'
import { getGroupRankingSummaries, getLatestRankingsForGroup, getLatestTwoGroupRankingSnapshots } from '../db/group-ranking-repository'
import { getFavoriteGroupIds } from '../db/favorite-groups-repository'
import { getTournamentPredictionCompletion } from '../db/tournament-prediction-completion-repository'
import { findPlayoffRoundsWithAvailabilityInfo, findPlayoffRoundBy } from '../db/tournament-playoff-repository'
import { getScoreHistoryForUsers } from '../db/score-history-repository'
import { getLoggedInUser } from './user-actions'
import { applyLocalizationBatch, applyLocalization } from '../utils/localization-helper'
import { calculateDeadline } from '../utils/countdown-utils'
import { type ScoringConfig, DEFAULT_SCORING } from '../utils/scoring-config'
import { computeNowAvailableRoundIds } from '../utils/playoff-availability'
import { ExtendedGameData } from '../definitions'
import { GameGuessNew, Team } from '../db/tables-definition'
import type { Locale } from '../../i18n.config'
import { PREDICTION_LOCK_OFFSET_MS } from '../utils/prediction-constants'

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
  /** True when the 2-day tournament prediction window has not yet closed */
  qtAndAwardsOpen: boolean
  /** Milliseconds until QT/awards predictions lock (negative = already locked) */
  msUntilPredictionLock: number
  /** True when the last scheduled game has already kicked off — tournament is over */
  tournamentFinished: boolean
  /** game_date of the first tournament game (null if no games) */
  firstGameDate: Date | null
  /** True when the first game has already kicked off (tournament is underway or finished) */
  tournamentHasStarted: boolean
  /** Short display name of the tournament (e.g. "FIFA 2026") for the countdown subtitle */
  tournamentName: string | null
  /** True when games array was backfilled with the opener because no window games were found */
  openerBackfill: boolean
  /** Total number of games in the tournament */
  totalGames: number
  /** Number of games the user has fully predicted (both scores, playoff penalty included) */
  predictedGames: number
  /** Number of group-stage games the user has fully predicted */
  groupStageGamesCompleted: number
  /** Total number of group-stage games in the tournament */
  groupStageGamesTotal: number
  /** Total silver boosts applied across all user games in this tournament */
  silverBoostsUsed: number
  /** Total golden boosts applied across all user games in this tournament */
  goldenBoostsUsed: number
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
  /** Tournament-specific scoring configuration (falls back to DEFAULT_SCORING when unavailable) */
  scoringConfig: ScoringConfig
  /** First playoff round that is "Now Available" for prediction (null when none qualifies). */
  nowAvailablePlayoffRound: { roundId: string; roundName: string; firstGameId: string } | null
}

/** Resolves the first playoff round that is "Now Available" for prediction. */
async function resolveNowAvailablePlayoffRound(
  availableRoundIds: string[],
  guessesMapAll: Record<string, GameGuessNew>,
  locale: Locale
): Promise<ActionCenterData['nowAvailablePlayoffRound']> {
  if (availableRoundIds.length === 0) return null
  const firstAvailableRoundId = availableRoundIds[0]
  const [roundData, roundGames] = await Promise.all([
    findPlayoffRoundBy(firstAvailableRoundId),
    db
      .selectFrom('tournament_playoff_round_games')
      .innerJoin('games', 'games.id', 'tournament_playoff_round_games.game_id')
      .where('tournament_playoff_round_games.tournament_playoff_round_id', '=', firstAvailableRoundId)
      .orderBy('games.game_date', 'asc')
      .select(['games.id', 'games.game_date'])
      .execute(),
  ])
  const firstUnpredictedGame = roundGames.find((g) => {
    const guess = guessesMapAll[g.id]
    if (!guess || guess.home_score === null || guess.away_score === null) return true
    if (guess.home_score === guess.away_score) {
      return !(guess.home_penalty_winner || guess.away_penalty_winner)
    }
    return false
  })
  if (!firstUnpredictedGame || !roundData) return null
  const localizedRound = applyLocalization(roundData, locale, [
    { field: 'round_name', i18nField: 'round_name_i18n' },
  ])
  return {
    roundId: firstAvailableRoundId,
    roundName: localizedRound.round_name,
    firstGameId: firstUnpredictedGame.id,
  }
}

/** Builds a ScoringConfig from a tournament row, falling back to defaults for absent fields. */
function buildScoringConfig(
  tournament: Awaited<ReturnType<typeof findTournamentById>> | undefined | null
): ScoringConfig {
  if (!tournament) return DEFAULT_SCORING
  return {
    game_exact_score_points: tournament.game_exact_score_points ?? DEFAULT_SCORING.game_exact_score_points,
    game_correct_goal_difference_points: tournament.game_correct_goal_difference_points ?? DEFAULT_SCORING.game_correct_goal_difference_points,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? DEFAULT_SCORING.game_correct_outcome_points,
    champion_points: tournament.champion_points ?? DEFAULT_SCORING.champion_points,
    runner_up_points: tournament.runner_up_points ?? DEFAULT_SCORING.runner_up_points,
    third_place_points: tournament.third_place_points ?? DEFAULT_SCORING.third_place_points,
    individual_award_points: tournament.individual_award_points ?? DEFAULT_SCORING.individual_award_points,
    qualified_team_points: tournament.qualified_team_points ?? DEFAULT_SCORING.qualified_team_points,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? DEFAULT_SCORING.exact_position_qualified_points,
    max_silver_games: tournament.max_silver_games ?? DEFAULT_SCORING.max_silver_games,
    max_golden_games: tournament.max_golden_games ?? DEFAULT_SCORING.max_golden_games,
  }
}

export interface TournamentHubPageData {
  scoringConfig: ScoringConfig
  totalGames: number
  isStarted: boolean
  isNearStart: boolean
  isFinished: boolean
  qualifiersTotal: number
  awardsTotal: number
  firstGameDate: Date | null
  tournamentHasStarted: boolean
  tournamentJustStarted: boolean
  tournamentName: string | null
}

/**
 * Returns shared tournament data needed by all dashboard widgets, including
 * timing fields for hero banners. Does NOT require authentication — safe to
 * call for logged-off users.
 */
export async function getTournamentHubPageData(tournamentId: string, locale: Locale): Promise<TournamentHubPageData> {
  const [tournament, firstGame, lastGame, totalGamesResult, firstStageRound] = await Promise.all([
    findTournamentById(tournamentId),
    findFirstGameInTournament(tournamentId),
    findLastGameInTournament(tournamentId),
    db
      .selectFrom('games')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('tournament_id', '=', tournamentId)
      .executeTakeFirst(),
    db
      .selectFrom('tournament_playoff_rounds')
      .select('total_games')
      .where('tournament_id', '=', tournamentId)
      .where('is_first_stage', '=', true)
      .executeTakeFirst(),
  ])

  const PRE_TOURNAMENT_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000
  const CELEBRATION_WINDOW_MS = 48 * 60 * 60 * 1000
  const now = Date.now()
  const totalGames = Number(totalGamesResult?.count ?? 0)
  const isStarted = !!firstGame && firstGame.game_date.getTime() <= now
  const isNearStart = !!firstGame && firstGame.game_date.getTime() - now <= PRE_TOURNAMENT_ACTIVE_WINDOW_MS
  const isFinished = !!lastGame && lastGame.game_date.getTime() < now
  const qualifiersTotal = (firstStageRound?.total_games ?? 0) * 2
  const firstGameDate = firstGame?.game_date ?? null
  const tournamentHasStarted = firstGameDate !== null && firstGameDate.getTime() <= now
  const tournamentJustStarted = !!(
    firstGameDate &&
    firstGameDate.getTime() < now &&
    now - firstGameDate.getTime() < CELEBRATION_WINDOW_MS
  )

  return {
    scoringConfig: buildScoringConfig(tournament),
    totalGames,
    isStarted,
    isNearStart,
    isFinished,
    qualifiersTotal,
    awardsTotal: 7,
    firstGameDate,
    tournamentHasStarted,
    tournamentJustStarted,
    tournamentName: computeTournamentName(tournament, locale),
  }
}

const MAX_URGENT_CARDS = 5
const FALLBACK_CARD_COUNT = 5
const FALLBACK_WINDOW_MS = 5 * 24 * 60 * 60 * 1000 // 5-day lookahead for fallback carousel

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

/** Fetches and localizes the first tournament game for pre-tournament backfill. */
async function fetchOpenerBackfill(
  tournamentId: string,
  firstGameDate: Date | null,
  now: number,
  guessesArray: GameGuessNew[],
  locale: Locale
): Promise<{ games: ExtendedGameData[]; gameGuesses: Record<string, GameGuessNew> }> {
  if (!firstGameDate || firstGameDate.getTime() <= now) {
    return { games: [], gameGuesses: {} }
  }
  const fullOpenerGame = await findFirstGameFullData(tournamentId)
  if (!fullOpenerGame) {
    return { games: [], gameGuesses: {} }
  }
  const [localizedOpener] = applyLocalizationBatch([fullOpenerGame], locale, [
    { field: 'location', i18nField: 'location_i18n' },
  ]) as ExtendedGameData[]
  const openerGuess = guessesArray.find((g) => g.game_id === fullOpenerGame.id)
  return {
    games: [localizedOpener],
    gameGuesses: openerGuess ? { [fullOpenerGame.id]: openerGuess } : {},
  }
}

/** Returns the localized short name of the tournament, or null if no tournament. */
function computeTournamentName(
  tournament: Awaited<ReturnType<typeof findTournamentById>> | undefined | null,
  locale: Locale
): string | null {
  if (!tournament) return null
  return applyLocalization(tournament, locale, [
    { field: 'short_name', i18nField: 'short_name_i18n' },
  ]).short_name
}

/** Minimal public tournament timing fields needed for hero banners. */
export interface TournamentTiming {
  firstGameDate: Date | null
  tournamentHasStarted: boolean
  tournamentJustStarted: boolean
  tournamentName: string | null
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

  const [games, guessesArray, teams, tournament, firstGame, lastGame, playoffRoundsInfo] = await Promise.all([
    findGamesForDashboard(tournamentId),
    findGameGuessesByUserId(user.id, tournamentId),
    findTeamInTournament(tournamentId),
    findTournamentById(tournamentId),
    findFirstGameInTournament(tournamentId),
    findLastGameInTournament(tournamentId),
    findPlayoffRoundsWithAvailabilityInfo(tournamentId, user.id),
  ])

  // Use the same completion logic as the Predictions Dashboard for consistent progress data
  // Pass firstGame?.game_date so getTournamentPredictionCompletion skips a redundant DB call
  const predictionCompletion = tournament
    ? await getTournamentPredictionCompletion(user.id, tournamentId, tournament, firstGame?.game_date ?? null)
    : null

  const now = Date.now()
  const tournamentFinished = !!lastGame && lastGame.game_date.getTime() < now
  const firstGameDate = firstGame?.game_date ?? null
  const totalGames = predictionCompletion?.totalGames ?? 0
  const predictedGames = predictionCompletion?.completedGames ?? 0
  const groupStageGamesCompleted = predictionCompletion?.completedGroupGames ?? 0
  const groupStageGamesTotal = predictionCompletion?.totalGroupGames ?? 0
  const silverBoostsUsed = predictionCompletion?.silverBoostsUsed ?? 0
  const goldenBoostsUsed = predictionCompletion?.goldenBoostsUsed ?? 0
  const awardsCompleted = (predictionCompletion?.finalStandings.completed ?? 0) + (predictionCompletion?.awards.completed ?? 0)
  const awardsTotal = (predictionCompletion?.finalStandings.total ?? 0) + (predictionCompletion?.awards.total ?? 0)
  const qualifiersCompleted = predictionCompletion?.qualifiers.completed ?? 0
  const qualifiersTotal = predictionCompletion?.qualifiers.total ?? 0
  const tournamentJustStarted = !!(
    firstGameDate &&
    firstGameDate.getTime() < now &&
    now - firstGameDate.getTime() < CELEBRATION_WINDOW_MS
  )
  const tournamentHasStarted = firstGameDate !== null && firstGameDate.getTime() <= now

  const { qtAndAwardsOpen, msUntilPredictionLock } = computePredictionLockState(
    tournament,
    firstGame?.game_date
  )

  const guessesMapAll = Object.fromEntries(guessesArray.map((g) => [g.game_id, g]))

  // Determine if any playoff round is "Now Available" for prediction
  const availableRoundIds = computeNowAvailableRoundIds(playoffRoundsInfo, now)
  const nowAvailablePlayoffRound = await resolveNowAvailablePlayoffRound(availableRoundIds, guessesMapAll, locale)

  if (games.length === 0) {
    const localizedTeams = applyLocalizationBatch(teams, locale, [
      { field: 'name', i18nField: 'name_i18n' },
    ])
    const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))

    // Backfill with opener game when no window games found and tournament hasn't started
    const { games: openerGames, gameGuesses: openerGameGuesses } = await fetchOpenerBackfill(
      tournamentId,
      firstGameDate,
      now,
      guessesArray,
      locale
    )
    const openerBackfill = openerGames.length > 0

    return {
      games: openerGames,
      gameGuesses: openerGameGuesses,
      teamsMap,
      tournamentMaxSilver: tournament?.max_silver_games ?? 0,
      tournamentMaxGolden: tournament?.max_golden_games ?? 0,
      mode: openerBackfill ? 'fallback' : 'empty',
      qtAndAwardsOpen,
      msUntilPredictionLock,
      tournamentFinished,
      firstGameDate,
      tournamentHasStarted,
      tournamentName: computeTournamentName(tournament, locale),
      openerBackfill,
      totalGames,
      predictedGames,
      groupStageGamesCompleted,
      groupStageGamesTotal,
      silverBoostsUsed,
      goldenBoostsUsed,
      awardsCompleted,
      awardsTotal,
      qualifiersCompleted,
      qualifiersTotal,
      tournamentJustStarted,
      scoringConfig: buildScoringConfig(tournament),
      nowAvailablePlayoffRound,
    }
  }

  // Build from already-defined guessesMapAll (defined above the early return)

  // Urgent mode: games with no *complete* prediction and an open deadline.
  // Mirrors the client-side isGuessComplete and server-side getTournamentPredictionCompletion:
  // a guess with missing scores, or a tied playoff without a penalty winner, is NOT complete.
  const urgentGames = games
    .filter((g) => {
      const deadline = calculateDeadline(g.game_date)
      if (deadline <= now) return false
      const guess = guessesMapAll[g.id]
      if (!guess) return true
      if (guess.home_score === null || guess.home_score === undefined) return true
      if (guess.away_score === null || guess.away_score === undefined) return true
      if (!!g.playoffStage && guess.home_score === guess.away_score) {
        return !(guess.home_penalty_winner || guess.away_penalty_winner)
      }
      return false
    })
    .sort((a, b) => {
      const diff = calculateDeadline(a.game_date) - calculateDeadline(b.game_date)
      return diff === 0 ? (a.game_number || 0) - (b.game_number || 0) : diff
    })
    .slice(0, MAX_URGENT_CARDS)

  let selectedGames: ExtendedGameData[]
  let mode: ActionCenterData['mode']

  if (urgentGames.length > 0) {
    selectedGames = urgentGames
    mode = 'urgent'
  } else {
    // Fallback: upcoming games within the next 5 days whose deadline hasn't passed.
    // The 5-day window surfaces playoff games from the next round as the date approaches,
    // rather than hardcoding "next N games" which can be weeks away between rounds.
    const windowEnd = now + FALLBACK_WINDOW_MS
    const upcomingGames = [...games]
      .filter((g) => calculateDeadline(g.game_date) > now && g.game_date.getTime() <= windowEnd)
      .sort((a, b) => {
        const diff = a.game_date.getTime() - b.game_date.getTime()
        return diff === 0 ? (a.game_number || 0) - (b.game_number || 0) : diff
      })
      .slice(0, FALLBACK_CARD_COUNT)
    selectedGames = upcomingGames
    mode = upcomingGames.length > 0 ? 'fallback' : 'empty'
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
  const gameGuesses = Object.fromEntries(
    localizedGames
      .filter((g) => guessesMapAll[g.id] !== undefined)
      .map((g) => [g.id, guessesMapAll[g.id]] as [string, GameGuessNew])
  )

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
    tournamentHasStarted,
    tournamentName: computeTournamentName(tournament, locale),
    openerBackfill: false,
    totalGames,
    predictedGames,
    groupStageGamesCompleted,
    groupStageGamesTotal,
    silverBoostsUsed,
    goldenBoostsUsed,
    awardsCompleted,
    awardsTotal,
    qualifiersCompleted,
    qualifiersTotal,
    tournamentJustStarted,
    scoringConfig: buildScoringConfig(tournament),
    nowAvailablePlayoffRound,
  }
}

/**
 * Lightweight Server Action for the Games page. Returns IDs of playoff rounds that are
 * "Now Available" for prediction without fetching full ActionCenterData.
 */
export async function getPlayoffRoundsAvailability(tournamentId: string): Promise<string[]> {
  const user = await getLoggedInUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }
  const rounds = await findPlayoffRoundsWithAvailabilityInfo(tournamentId, user.id)
  return computeNowAvailableRoundIds(rounds, Date.now())
}

/**
 * Carousel-only data needed to refresh the active games widget after all urgent games are
 * predicted. Lighter than ActionCenterData — skips the 7+ sequential queries in
 * getTournamentPredictionCompletion and fetches only what the carousel needs.
 */
export interface CarouselGamesData {
  games: ExtendedGameData[]
  gameGuesses: Record<string, GameGuessNew>
  teamsMap: Record<string, Team>
  tournamentMaxSilver: number
  tournamentMaxGolden: number
  mode: 'urgent' | 'fallback' | 'empty'
  /** IDs of games in urgent mode (empty for fallback/empty modes) */
  urgentGameIds: string[]
  /** Number of games the user has fully predicted (lightweight query, not getTournamentPredictionCompletion) */
  predictedGames: number
  /** Total silver boosts applied across all user games in this tournament */
  silverBoostsUsed: number
  /** Total golden boosts applied across all user games in this tournament */
  goldenBoostsUsed: number
}

/**
 * Lightweight carousel-only refetch. Called by GamesActiveSection when all urgent games
 * become complete. Does NOT call getTournamentPredictionCompletion — instead runs two
 * parallel aggregate queries covering predicted count and boost usage.
 */
export async function getCarouselGames(
  tournamentId: string,
  locale: Locale
): Promise<CarouselGamesData> {
  const user = await getLoggedInUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }

  const [games, guessesArray, teams, tournament] = await Promise.all([
    findGamesForDashboard(tournamentId),
    findGameGuessesByUserId(user.id, tournamentId),
    findTeamInTournament(tournamentId),
    findTournamentById(tournamentId),
  ])

  // Run lightweight aggregate queries in parallel — replaces the 7+ sequential queries
  // in getTournamentPredictionCompletion with just the three counts we need.
  const [predictedGamesResult, silverBoostsResult, goldenBoostsResult] = await Promise.all([
    db
      .selectFrom('games')
      .innerJoin('game_guesses', 'game_guesses.game_id', 'games.id')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('games.tournament_id', '=', tournamentId)
      .where('game_guesses.user_id', '=', user.id)
      .where('game_guesses.home_score', 'is not', null)
      .where('game_guesses.away_score', 'is not', null)
      .where((eb) =>
        eb.or([
          eb('games.game_type', '=', 'group'),
          eb.and([
            eb('games.game_type', '!=', 'group'),
            eb.or([
              eb('game_guesses.home_score', '!=', eb.ref('game_guesses.away_score')),
              eb('game_guesses.home_penalty_winner', '=', true),
              eb('game_guesses.away_penalty_winner', '=', true),
            ]),
          ]),
        ])
      )
      .executeTakeFirst(),
    db
      .selectFrom('game_guesses')
      .innerJoin('games', 'games.id', 'game_guesses.game_id')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('games.tournament_id', '=', tournamentId)
      .where('game_guesses.user_id', '=', user.id)
      .where('game_guesses.boost_type', '=', 'silver')
      .executeTakeFirst(),
    db
      .selectFrom('game_guesses')
      .innerJoin('games', 'games.id', 'game_guesses.game_id')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('games.tournament_id', '=', tournamentId)
      .where('game_guesses.user_id', '=', user.id)
      .where('game_guesses.boost_type', '=', 'golden')
      .executeTakeFirst(),
  ])

  const predictedGames = Number(predictedGamesResult?.count ?? 0)
  const silverBoostsUsed = Number(silverBoostsResult?.count ?? 0)
  const goldenBoostsUsed = Number(goldenBoostsResult?.count ?? 0)
  const tournamentMaxSilver = tournament?.max_silver_games ?? 0
  const tournamentMaxGolden = tournament?.max_golden_games ?? 0

  const now = Date.now()
  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' },
  ])
  const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))

  if (games.length === 0) {
    return {
      games: [],
      gameGuesses: {},
      teamsMap,
      tournamentMaxSilver,
      tournamentMaxGolden,
      mode: 'empty',
      urgentGameIds: [],
      predictedGames,
      silverBoostsUsed,
      goldenBoostsUsed,
    }
  }

  const guessesMapAll = Object.fromEntries(guessesArray.map((g) => [g.game_id, g]))

  // Same urgent-game filtering as getActionCenterGames — mirrors isGuessComplete logic
  const urgentGames = games
    .filter((g) => {
      const deadline = calculateDeadline(g.game_date)
      if (deadline <= now) return false
      const guess = guessesMapAll[g.id]
      if (!guess) return true
      if (guess.home_score === null || guess.home_score === undefined) return true
      if (guess.away_score === null || guess.away_score === undefined) return true
      if (!!g.playoffStage && guess.home_score === guess.away_score) {
        return !(guess.home_penalty_winner || guess.away_penalty_winner)
      }
      return false
    })
    .sort((a, b) => {
      const diff = calculateDeadline(a.game_date) - calculateDeadline(b.game_date)
      return diff === 0 ? (a.game_number || 0) - (b.game_number || 0) : diff
    })
    .slice(0, MAX_URGENT_CARDS)

  let selectedGames: ExtendedGameData[]
  let mode: CarouselGamesData['mode']
  let urgentGameIds: string[]

  if (urgentGames.length > 0) {
    selectedGames = urgentGames
    mode = 'urgent'
    urgentGameIds = urgentGames.map((g) => g.id)
  } else {
    const windowEnd = now + FALLBACK_WINDOW_MS
    const upcomingGames = [...games]
      .filter((g) => calculateDeadline(g.game_date) > now && g.game_date.getTime() <= windowEnd)
      .sort((a, b) => {
        const diff = a.game_date.getTime() - b.game_date.getTime()
        return diff === 0 ? (a.game_number || 0) - (b.game_number || 0) : diff
      })
      .slice(0, FALLBACK_CARD_COUNT)
    selectedGames = upcomingGames
    mode = upcomingGames.length > 0 ? 'fallback' : 'empty'
    urgentGameIds = []
  }

  const localizedGames = applyLocalizationBatch(selectedGames, locale, [
    { field: 'location', i18nField: 'location_i18n' },
  ]) as ExtendedGameData[]

  const gameGuesses = Object.fromEntries(
    localizedGames
      .filter((g) => guessesMapAll[g.id] !== undefined)
      .map((g) => [g.id, guessesMapAll[g.id]] as [string, GameGuessNew])
  )

  return {
    games: localizedGames,
    gameGuesses,
    teamsMap,
    tournamentMaxSilver,
    tournamentMaxGolden,
    mode,
    urgentGameIds,
    predictedGames,
    silverBoostsUsed,
    goldenBoostsUsed,
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

  // Phase 1: lightweight summary — 2 DB round-trips for all N groups.
  // Returns ranked member count + user presence per group, replacing N full-ranking queries.
  const summaries = await getGroupRankingSummaries(
    allGroups.map((g) => g.id),
    user.id,
    tournamentId
  )

  // Filter: only groups where the current user has a ranking entry
  const rankedSummaries = summaries.filter((s) => s.userIsRanked)

  // Sort: favorites first (by ranked member count desc), then non-favorites (by ranked member count desc)
  const favoriteSet = new Set(favoriteGroupIds)
  rankedSummaries.sort((a, b) => {
    const aFav = favoriteSet.has(a.groupId) ? 1 : 0
    const bFav = favoriteSet.has(b.groupId) ? 1 : 0
    if (bFav !== aFav) return bFav - aFav
    return b.rankedCount - a.rankedCount
  })

  const topSummaries = rankedSummaries.slice(0, MAX_PEEK_GROUPS)

  if (topSummaries.length === 0) return { groups: [], userHasGroups, allGroupNames }

  // Phase 2: fetch full rankings + rank-change snapshots only for the top 3 groups, in parallel.
  const [rankingsForTop, snapshotResults] = await Promise.all([
    Promise.all(topSummaries.map((s) => getLatestRankingsForGroup(s.groupId, tournamentId))),
    Promise.all(topSummaries.map((s) => getLatestTwoGroupRankingSnapshots(user.id, s.groupId, tournamentId))),
  ])

  const groups: GroupPeekData[] = topSummaries.map((summary, idx) => {
    const group = allGroupsMap.get(summary.groupId)!
    const rankings = rankingsForTop[idx]
    const snapshots = snapshotResults[idx]

    // Compute rank change: previous rank minus current rank (positive = moved up)
    let rankChange: number | null = null
    if (snapshots.length === 2) {
      rankChange = snapshots[1].rank - snapshots[0].rank
    }

    // Build 3-row window around the user using array index (not rank value)
    // to guarantee exactly 3 rows even when ties exist at adjacent ranks
    const total = rankings.length
    const userEntry = rankings.find((r) => r.userId === user.id)!
    const userRank = userEntry.rank
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

export type GameStatus = 'finished' | 'pending' | 'about_to_start'

export interface RecentGameResultItem {
  gameId: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number | null
  awayScore: number | null
  homePenaltyScore: number | null
  awayPenaltyScore: number | null
  userHomeGuess: number | null
  userAwayGuess: number | null
  userHomePenaltyWinner: boolean | null
  userAwayPenaltyWinner: boolean | null
  basePoints: number
  boostType: 'silver' | 'golden' | null
  boostBonus: number
  finalPoints: number
  predictionTier: 'exact' | 'goal_difference' | 'correct' | 'missed' | null
  gameDate: Date
  gameStatus: GameStatus
}

export interface RecentResultsData {
  recentGames: RecentGameResultItem[]
}

const RECENT_GAMES_LIMIT = 10

/**
 * Fetches recent game results for all games with a closed prediction window,
 * including games the user did not predict. Removes QT/award data.
 */
export async function getRecentResultsData(
  tournamentId: string,
  locale: Locale
): Promise<RecentResultsData> {
  const user = await getLoggedInUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }

  const [recentGames, teams] = await Promise.all([
    findRecentGamesForDashboard(user.id, tournamentId, RECENT_GAMES_LIMIT),
    findTeamInTournament(tournamentId),
  ])

  const localizedTeams = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' },
  ])
  const teamsMap = Object.fromEntries(localizedTeams.map((t) => [t.id, t]))

  const now = new Date()

  const gameItems: RecentGameResultItem[] = recentGames.map((g) => {
    const basePoints = g.guessScore ?? 0
    const finalPoints = g.finalScore ?? g.guessScore ?? 0
    const boostBonus = finalPoints - basePoints

    let gameStatus: GameStatus
    if (g.homeScore !== null) {
      gameStatus = 'finished'
    } else if (g.gameDate > now) {
      gameStatus = 'about_to_start'
    } else {
      gameStatus = 'pending'
    }

    return {
      gameId: g.gameId,
      homeTeamName: (teamsMap[g.homeTeamId] as Team | undefined)?.name ?? g.homeTeamId,
      awayTeamName: (teamsMap[g.awayTeamId] as Team | undefined)?.name ?? g.awayTeamId,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homePenaltyScore: g.homePenaltyScore,
      awayPenaltyScore: g.awayPenaltyScore,
      userHomeGuess: g.userHomeGuess,
      userAwayGuess: g.userAwayGuess,
      userHomePenaltyWinner: g.userHomePenaltyWinner,
      userAwayPenaltyWinner: g.userAwayPenaltyWinner,
      basePoints,
      boostType: g.boostType,
      boostBonus,
      finalPoints,
      predictionTier: g.predictionTier,
      gameDate: g.gameDate,
      gameStatus,
    }
  })

  return { recentGames: gameItems }
}

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires'

function getYesterdayYYYYMMDD(): number {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterday)
  return Number.parseInt(formatted.replaceAll('-', ''), 10)
}

function formatSnapshotDate(snapshotDate: number, locale: Locale): string {
  const year = Math.floor(snapshotDate / 10000)
  const month = Math.floor((snapshotDate % 10000) / 100) - 1
  const day = snapshotDate % 100
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(
    new Date(year, month, day)
  )
}

export interface StatsAtAGlanceData {
  hasData: boolean
  totalPoints: number
  matchesPoints: number
  qualifiedTeamsPoints: number
  awardsPoints: number
  momentumPoints: number
  matchesDelta: number
  qualifiedTeamsDelta: number
  awardsDelta: number
  snapshotDateLabel: string | null
  isYesterday: boolean
  sparklineData: number[]
  sparklineStartDateLabel: string | null
}

/**
 * Fetches the logged-in user's score history for the tournament and returns a compact
 * summary for the Stats at a Glance widget: current totals, per-category deltas since
 * the previous snapshot, and the last 7 snapshots as sparkline data.
 */
export async function getStatsAtAGlanceData(
  tournamentId: string,
  locale: Locale
): Promise<StatsAtAGlanceData> {
  const user = await getLoggedInUser()
  if (!user?.id) {
    throw new Error('Unauthorized')
  }

  const history = await getScoreHistoryForUsers([user.id], tournamentId)

  const empty: StatsAtAGlanceData = {
    hasData: false,
    totalPoints: 0,
    matchesPoints: 0,
    qualifiedTeamsPoints: 0,
    awardsPoints: 0,
    momentumPoints: 0,
    matchesDelta: 0,
    qualifiedTeamsDelta: 0,
    awardsDelta: 0,
    snapshotDateLabel: null,
    isYesterday: false,
    sparklineData: [],
    sparklineStartDateLabel: null,
  }

  if (history.length === 0) return empty

  const latest = history.at(-1)!
  const prev = history.length >= 2 ? history.at(-2)! : null

  const totalPoints = latest.total_points
  const matchesPoints = latest.total_game_score + latest.total_boost_bonus
  const qualifiedTeamsPoints = latest.qualified_teams_score + latest.group_position_score
  const awardsPoints = latest.honor_roll_score + latest.individual_awards_score

  const momentumPoints = prev ? totalPoints - prev.total_points : 0
  const matchesDelta = prev
    ? matchesPoints - (prev.total_game_score + prev.total_boost_bonus)
    : 0
  const qualifiedTeamsDelta = prev
    ? qualifiedTeamsPoints - (prev.qualified_teams_score + prev.group_position_score)
    : 0
  const awardsDelta = prev
    ? awardsPoints - (prev.honor_roll_score + prev.individual_awards_score)
    : 0

  const isYesterday = prev ? prev.snapshot_date === getYesterdayYYYYMMDD() : false
  const snapshotDateLabel = prev ? formatSnapshotDate(prev.snapshot_date, locale) : null
  const sparklineWindow = history.slice(-7)
  const sparklineData = sparklineWindow.map((row) => row.total_points)
  const sparklineStartDateLabel =
    sparklineWindow.length >= 2
      ? formatSnapshotDate(sparklineWindow[0].snapshot_date, locale)
      : null

  return {
    hasData: true,
    totalPoints,
    matchesPoints,
    qualifiedTeamsPoints,
    awardsPoints,
    momentumPoints,
    matchesDelta,
    qualifiedTeamsDelta,
    awardsDelta,
    snapshotDateLabel,
    isYesterday,
    sparklineData,
    sparklineStartDateLabel,
  }
}
