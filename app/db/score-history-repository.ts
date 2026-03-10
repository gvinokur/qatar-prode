import { db } from "./database";
import { TournamentScoreHistory, TournamentScoreHistoryNew } from "./tables-definition";

/**
 * Upsert a daily score snapshot for a user+tournament+date combination.
 * If a row already exists for that date, all six score segment fields are overwritten
 * (last-write-wins — safe for same-day recalculations).
 *
 * total_points is GENERATED ALWAYS in the DB and must NOT be included in the insert/update.
 */
export async function writeScoreSnapshot(snapshot: TournamentScoreHistoryNew): Promise<TournamentScoreHistory> {
  return db
    .insertInto('tournament_score_history')
    .values(snapshot)
    .onConflict((oc) =>
      oc
        .columns(['user_id', 'tournament_id', 'snapshot_date'])
        .doUpdateSet({
          total_game_score: snapshot.total_game_score,
          total_boost_bonus: snapshot.total_boost_bonus,
          honor_roll_score: snapshot.honor_roll_score,
          individual_awards_score: snapshot.individual_awards_score,
          qualified_teams_score: snapshot.qualified_teams_score,
          group_position_score: snapshot.group_position_score,
        })
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

/**
 * Fetch all score history rows for the given users in a tournament,
 * ordered by snapshot_date ascending (oldest first).
 */
export async function getScoreHistoryForUsers(
  userIds: string[],
  tournamentId: string
): Promise<TournamentScoreHistory[]> {
  if (userIds.length === 0) return [];

  return db
    .selectFrom('tournament_score_history')
    .selectAll()
    .where('tournament_id', '=', tournamentId)
    .where('user_id', 'in', userIds)
    .orderBy('snapshot_date', 'asc')
    .execute();
}
