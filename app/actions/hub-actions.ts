'use server'

import { findGamesForDashboard } from '../db/game-repository'
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
}

const MAX_URGENT_CARDS = 4
const FALLBACK_CARD_COUNT = 3

/**
 * Fetches and ranks upcoming games for the Tournament Hub Action Center.
 * Returns up to 4 unpredicted open games (urgent mode), or 3 upcoming games
 * when all open-deadline games have been predicted (fallback mode), or empty
 * when no games exist in the window.
 */
export async function getActionCenterGames(
  tournamentId: string,
  locale: Locale
): Promise<ActionCenterData> {
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
  }
}
