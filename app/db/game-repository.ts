import {createBaseFunctions} from "./base-repository";
import {Game, GameTable} from "./tables-definition";
import {db} from "./database";
import {jsonObjectFrom} from "kysely/helpers/postgres";

const tableName = 'games'

const baseFunctions = createBaseFunctions<GameTable, Game>(tableName);
export const findGameById = baseFunctions.findById
export const updateGame = baseFunctions.update
export const createGame = baseFunctions.create
export const deleteGame =  baseFunctions.delete

export async function findGamesInTournament(tournamentId: string) {
  return await db.selectFrom(tableName)
    .selectAll()
    .select((eb) =>[
      jsonObjectFrom(
        eb.selectFrom('tournament_group_games')
          .innerJoin('tournament_groups', 'tournament_groups.id', 'tournament_group_games.tournament_group_id')
          .whereRef('tournament_group_games.game_id', '=', 'games.id')
          .select([
            'tournament_group_games.tournament_group_id',
            'tournament_groups.group_letter'
          ])
      ).as('group'),
      jsonObjectFrom(
        eb.selectFrom('tournament_playoff_round_games')
          .innerJoin('tournament_playoff_rounds',
            'tournament_playoff_rounds.id',
            'tournament_playoff_round_games.tournament_playoff_round_id')
          .whereRef('tournament_playoff_round_games.game_id', '=', 'games.id')
          .select([
            'tournament_playoff_round_games.tournament_playoff_round_id',
            'tournament_playoff_rounds.round_name'
          ])
      ).as('playoffStage'),
      jsonObjectFrom(
        eb.selectFrom('game_results')
          .whereRef('game_results.game_id', '=', 'games.id')
          .selectAll()
      ).as('gameResult')
    ])
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .execute()
}

export async function findFirstGameInTournament(tournamentId: string) {
 return db.selectFrom(tableName)
   .selectAll()
   .where('tournament_id', '=', tournamentId)
   .orderBy('game_date asc')
   .executeTakeFirst()
}

export async function findGamesInGroup(groupId: string, completeGame: boolean = false , draftResult: boolean = false) {
  const query = db.selectFrom(tableName)
    .innerJoin('tournament_group_games', 'tournament_group_games.game_id', 'games.id')
    .selectAll(tableName)
    .where('tournament_group_games.tournament_group_id', '=', groupId)

    if(completeGame) {
      return query
        .select((eb) =>[
          jsonObjectFrom(
            eb.selectFrom('tournament_group_games')
              .innerJoin('tournament_groups', 'tournament_groups.id', 'tournament_group_games.tournament_group_id')
              .whereRef('tournament_group_games.game_id', '=', 'games.id')
              .select([
                'tournament_group_games.tournament_group_id',
                'tournament_groups.group_letter'
              ])
          ).as('group'),
          jsonObjectFrom(
            eb.selectFrom('tournament_playoff_round_games')
              .innerJoin('tournament_playoff_rounds',
                'tournament_playoff_rounds.id',
                'tournament_playoff_round_games.tournament_playoff_round_id')
              .whereRef('tournament_playoff_round_games.game_id', '=', 'games.id')
              .select([
                'tournament_playoff_round_games.tournament_playoff_round_id',
                'tournament_playoff_rounds.round_name'
              ])
          ).as('playoffStage'),
          jsonObjectFrom(
            eb.selectFrom('game_results')
              .whereRef('game_results.game_id', '=', 'games.id')
              //Always include non draft results
              .where('is_draft', 'in', [false, draftResult])
              .selectAll()
          ).as('gameResult')
        ]).execute()
    }

    return query
      .execute()
}

export async function deleteAllGamesFromTournament(tournamentId: string) {
  const games = await findGamesInTournament(tournamentId)
  const waitForAllDeletes = Promise.all(games.map(async (game) => {
    await db.deleteFrom('tournament_playoff_round_games')
      .where('game_id', '=', game.id)
      .execute()
    await db.deleteFrom('tournament_group_games')
      .where('game_id', '=', game.id)
      .execute()
    await deleteGame(game.id)
  }))
  return waitForAllDeletes
}
