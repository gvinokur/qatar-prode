'use server'

import { findGamesForDashboard, findFirstGameInTournament, findLastGameInTournament } from '../db/game-repository'
import { findGameGuessesByUserId } from '../db/game-guess-repository'
import { findTeamInTournament } from '../db/team-repository'
import { findTournamentById } from '../db/tournament-repository'
import { getLoggedInUser } from './user-actions'
import { applyLocalizationBatch } from '../utils/localization-helper'
import { calculateDeadline } from '../utils/countdown-utils'
import { ExtendedGameData } from '../definitions'
import { GameGuessNew, Team } from '../db/tables-definition'
import type { Locale } from '../../i18n.config'

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
    .slice(0, MAX_URGENT_CARDS) as ExtendedGameData[]

  let selectedGames: ExtendedGameData[]
  let mode: ActionCenterData['mode']

  if (urgentGames.length > 0) {
    selectedGames = urgentGames
    mode = 'urgent'
  } else {
    // Fallback: next 3 games by game_date asc (open or already predicted)
    const upcomingGames = [...games]
      .sort((a, b) => a.game_date.getTime() - b.game_date.getTime())
      .slice(0, FALLBACK_CARD_COUNT) as ExtendedGameData[]
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
