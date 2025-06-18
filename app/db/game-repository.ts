import {createBaseFunctions} from "./base-repository";
import {Game, GameGuess, GameResultNew, GameTable} from "./tables-definition";
import {db} from "./database";
import {jsonArrayFrom, jsonObjectFrom} from "kysely/helpers/postgres";
import {sql} from "kysely";
import {ExtendedGameData} from "../definitions";
import {cache} from "react";

const tableName = 'games'

const baseFunctions = createBaseFunctions<GameTable, Game>(tableName);
export const findGameById = baseFunctions.findById
export const updateGame = baseFunctions.update
export const createGame = baseFunctions.create
export const deleteGame =  baseFunctions.delete

export const findGamesInTournament = cache(async (tournamentId: string, draftResult: boolean = true) => {
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
            'tournament_playoff_rounds.round_name',
            'tournament_playoff_rounds.is_final',
            'tournament_playoff_rounds.is_third_place'
          ])
      ).as('playoffStage'),
      jsonObjectFrom(
        eb.selectFrom('game_results')
          .whereRef('game_results.game_id', '=', 'games.id')
          .where('is_draft', 'in', [false, draftResult])
          .selectAll()
      ).as('gameResult')
    ])
    .where('tournament_id', '=', tournamentId)
    .selectAll()
    .execute() as ExtendedGameData[]
})

export const findFirstGameInTournament = cache(async (tournamentId: string)  => {
 return db.selectFrom(tableName)
   .selectAll()
   .where('tournament_id', '=', tournamentId)
   .orderBy('game_date asc')
   .executeTakeFirst()
})

export const findGamesInGroup = cache(async (groupId: string, completeGame: boolean = false , draftResult: boolean = false) => {
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
                'tournament_playoff_rounds.round_name',
                'tournament_playoff_rounds.is_final',
                'tournament_playoff_rounds.is_third_place'
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
})

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


//----------------------------------------------------------------------------------------------------
interface GameWithResultAndGuess extends Game {
  gameResult: GameResultNew
  gameGuesses: GameGuess[]
}

export const findAllGamesWithPublishedResultsAndGameGuesses = cache(async (forceDrafts: boolean, forceAllGameGuesses: boolean) => {
  return await db.selectFrom(tableName)
    .selectAll()
    .select((eb) =>[
      jsonObjectFrom(
        eb.selectFrom('game_results')
          .whereRef('game_results.game_id', '=', 'games.id')
          .where('is_draft', '=', false)
          .selectAll()
      ).as('gameResult'),
      jsonArrayFrom(
        eb.selectFrom('game_guesses')
          .whereRef('game_guesses.game_id', '=', 'games.id')
          .where('score', 'is', null)
          .selectAll()
      ).as('gameGuesses')
    ])
    .where((eb) =>
      eb.and([
        eb.exists(
          eb.selectFrom('game_results')
            .whereRef('game_results.game_id', '=', 'games.id')
            .$if(!forceDrafts, qb => qb.where('is_draft', 'is', false))
            .selectAll()
        ),
        eb.exists(
          eb.selectFrom('game_guesses')
            .whereRef('game_guesses.game_id', '=', 'games.id')
            .$if(!forceAllGameGuesses, qb => qb.where('score', 'is', null))
            .selectAll()
        )
      ])
    )
    .execute() as GameWithResultAndGuess[]
})

export const findGamesAroundCurrentTime = cache(async (tournamentId: string)  => {
  const gamesAroundCurrentTime = await db.selectFrom(tableName)
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
            'tournament_playoff_rounds.round_name',
            'tournament_playoff_rounds.is_final',
            'tournament_playoff_rounds.is_third_place'
          ])
      ).as('playoffStage'),
      jsonObjectFrom(
        eb.selectFrom('game_results')
          .whereRef('game_results.game_id', '=', 'games.id')
          .selectAll()
      ).as('gameResult'),
      sql<number>`abs(
        extract (epoch from NOW()) -  extract(epoch from ${eb.ref('game_date')})
      )`.as('datediff')
    ])
    .where('tournament_id', '=', tournamentId)
    .orderBy('datediff asc')
    .limit(5)
    .execute() as ExtendedGameData[]

  return gamesAroundCurrentTime.sort((a, b) => a.game_date.getTime() - b.game_date.getTime())
})

export const findGamesInNext24Hours = cache(async (tournamentId: string) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return await db.selectFrom(tableName)
    .selectAll()
    .select((eb) => [
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
            'tournament_playoff_rounds.round_name',
            'tournament_playoff_rounds.is_final',
            'tournament_playoff_rounds.is_third_place'
          ])
      ).as('playoffStage')
    ])
    .where('tournament_id', '=', tournamentId)
    .where('game_date', '>=', now)
    .where('game_date', '<=', tomorrow)
    .orderBy('game_date', 'asc')
    .execute() as ExtendedGameData[];
});
