import {db} from "./database";
import {jsonObjectFrom} from "kysely/helpers/postgres";
import {sql} from "kysely";
import {ExtendedGameData} from "../definitions";

/**
 * Find games across all tournaments that finished recently and have no published result.
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @see applyLocalization() in /app/utils/localization-helper.ts must be called in Server Action layer
 */
export async function findRecentUnscoredGames(hoursBack: number): Promise<ExtendedGameData[]> {
  return await db.selectFrom('games')
    .selectAll('games')
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
            'tournament_playoff_rounds.round_name_i18n',
            'tournament_playoff_rounds.is_final',
            'tournament_playoff_rounds.is_third_place'
          ])
      ).as('playoffStage'),
      jsonObjectFrom(
        eb.selectFrom('game_results')
          .whereRef('game_results.game_id', '=', 'games.id')
          .where('game_results.is_draft', '=', true)
          .selectAll()
      ).as('gameResult')
    ])
    .leftJoin('game_results as published_results', (join) =>
      join
        .onRef('published_results.game_id', '=', 'games.id')
        .on('published_results.is_draft', '=', false)
    )
    .where('published_results.game_id', 'is', null)
    .where('games.game_date', '>=', sql<Date>`NOW() - INTERVAL '${sql.raw(String(hoursBack))} hours'`)
    .where('games.game_date', '<=', sql<Date>`NOW()`)
    .orderBy('games.game_date', 'asc')
    .execute() as ExtendedGameData[]
}
