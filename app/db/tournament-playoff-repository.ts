import { db } from './database'
import {createBaseFunctions} from "./base-repository";
import {PlayoffRound, PlayoffRoundGameTable, PlayoffRoundTable, TournamentGroupGameTable} from "./tables-definition";
import {jsonArrayFrom} from "kysely/helpers/postgres";

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
