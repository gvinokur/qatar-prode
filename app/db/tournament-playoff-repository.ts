import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {PlayoffRound, PlayoffRoundGameTable, PlayoffRoundTable} from "./tables-definition";
import {jsonArrayFrom} from "kysely/helpers/postgres";
import { PlayoffRoundAvailabilityInfo } from '../utils/playoff-availability';

const baseFunctions = createBaseFunctions<PlayoffRoundTable, PlayoffRound>('tournament_playoff_rounds');
export const findPlayoffRoundBy = baseFunctions.findById
export const updatePlayoffRound = baseFunctions.update
export const createPlayoffRound = baseFunctions.create
export const deletePlayoffRound =  baseFunctions.delete

export async function createPlayoffRoundGame(playoffRoundGame: PlayoffRoundGameTable) {
  return await db.insertInto('tournament_playoff_round_games')
    .values(playoffRoundGame)
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deletePlayoffRoundGame(gameId: string) {
  return await db.deleteFrom('tournament_playoff_round_games')
    .where('game_id', '=', gameId)
    .executeTakeFirstOrThrow()
}

/**
 * Returns a list of playoff stages, sorted by round number ascending.
 * @param tournamentId
 * @returns Promise<ExtendedPlayoffData[]> sorted by round number ascending
 */
export async function findPlayoffStagesWithGamesInTournament(tournamentId: string) {
  return await db.selectFrom('tournament_playoff_rounds')
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .select((eb) => [
      jsonArrayFrom(
        eb.selectFrom('tournament_playoff_round_games')
          .innerJoin('games', 'games.id', 'tournament_playoff_round_games.game_id')
          .orderBy('games.game_number', 'asc')
          .select('game_id')
          .whereRef('tournament_playoff_round_games.tournament_playoff_round_id', '=', 'tournament_playoff_rounds.id')
      ).as('games')
    ])
    .orderBy('round_order', 'asc')
    .orderBy('is_final', 'desc')
    .execute()
}

export async function deleteAllPlayoffRoundsInTournament(tournamentId: string) {
  return await db.deleteFrom('tournament_playoff_rounds')
    .where('tournament_id', '=', tournamentId)
    .execute()
}

/**
 * Returns availability info for every playoff round in a tournament, ordered by round_order asc.
 * Used by getActionCenterGames and getPlayoffRoundsAvailability to detect "Now Available" rounds.
 */
export async function findPlayoffRoundsWithAvailabilityInfo(
  tournamentId: string,
  userId: string
): Promise<PlayoffRoundAvailabilityInfo[]> {
  const rounds = await db
    .selectFrom('tournament_playoff_rounds')
    .where('tournament_id', '=', tournamentId)
    .select(['id', 'round_order'])
    .orderBy('round_order', 'asc')
    .execute()

  if (rounds.length === 0) return []

  const roundIds = rounds.map((r) => r.id)

  // All games in these rounds with team-assignment info and dates
  const games = await db
    .selectFrom('tournament_playoff_round_games')
    .innerJoin('games', 'games.id', 'tournament_playoff_round_games.game_id')
    .where('tournament_playoff_round_games.tournament_playoff_round_id', 'in', roundIds)
    .select([
      'tournament_playoff_round_games.tournament_playoff_round_id as round_id',
      'games.id as game_id',
      'games.game_date',
      'games.home_team',
      'games.away_team',
    ])
    .execute()

  // User's completed playoff game guesses (scores + penalty resolution for tied games)
  const completedGameIdsResult = await db
    .selectFrom('game_guesses')
    .innerJoin(
      'tournament_playoff_round_games',
      'tournament_playoff_round_games.game_id',
      'game_guesses.game_id'
    )
    .where('game_guesses.user_id', '=', userId)
    .where('game_guesses.home_score', 'is not', null)
    .where('game_guesses.away_score', 'is not', null)
    .where((eb) =>
      eb.or([
        eb('game_guesses.home_score', '!=', eb.ref('game_guesses.away_score')),
        eb('game_guesses.home_penalty_winner', '=', true),
        eb('game_guesses.away_penalty_winner', '=', true),
      ])
    )
    .where('tournament_playoff_round_games.tournament_playoff_round_id', 'in', roundIds)
    .select('game_guesses.game_id')
    .execute()

  const completedGameIds = new Set(completedGameIdsResult.map((r) => r.game_id))

  // Last group-stage game date → used as previousStageLastGameDate for the first playoff round
  const lastGroupGameResult = await db
    .selectFrom('games')
    .where('tournament_id', '=', tournamentId)
    .where('game_type', '=', 'group')
    .select((eb) => eb.fn.max('game_date').as('max_date'))
    .executeTakeFirst()

  const lastGroupGameDate = lastGroupGameResult?.max_date
    ? new Date(lastGroupGameResult.max_date)
    : null

  // Group games by round and compute per-round max game date
  const gamesByRound = new Map<string, typeof games>()
  for (const game of games) {
    const existing = gamesByRound.get(game.round_id) ?? []
    existing.push(game)
    gamesByRound.set(game.round_id, existing)
  }

  const roundMaxDates = new Map<string, Date | null>()
  for (const [roundId, roundGames] of gamesByRound) {
    const maxDate = roundGames.reduce<Date | null>((max, g) => {
      const d = new Date(g.game_date)
      return max === null || d > max ? d : max
    }, null)
    roundMaxDates.set(roundId, maxDate)
  }

  return rounds.map((round, index) => {
    const roundGames = gamesByRound.get(round.id) ?? []
    const hasTeamsDefined = roundGames.some(
      (g) => g.home_team != null && g.away_team != null
    )
    const totalGames = roundGames.length
    const completedGames = roundGames.filter((g) => completedGameIds.has(g.game_id)).length

    const previousStageLastGameDate =
      index === 0 ? lastGroupGameDate : (roundMaxDates.get(rounds[index - 1].id) ?? null)

    return {
      roundId: round.id,
      roundOrder: round.round_order,
      hasTeamsDefined,
      previousStageLastGameDate,
      hasUnpredictedGames: completedGames < totalGames,
    }
  })
}
