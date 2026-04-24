import { db } from "./database";
import { TournamentScoreHistory, TournamentScoreHistoryNew } from "./tables-definition";
import { getPreviousDayYYYYMMDD } from "../utils/date-utils";

export async function hasScoreHistory(userId: string, tournamentId: string): Promise<boolean> {
  const row = await db
    .selectFrom('tournament_score_history')
    .select('user_id')
    .where('user_id', '=', userId)
    .where('tournament_id', '=', tournamentId)
    .limit(1)
    .executeTakeFirst();
  return row !== undefined;
}

/**
 * Upsert a daily score snapshot for a user+tournament+date combination.
 * If a row already exists for that date, all six score segment fields are overwritten
 * (last-write-wins — safe for same-day recalculations).
 *
 * On first write for a user+tournament, automatically inserts a Day Zero entry
 * (all scores = 0) for the day before snapshot_date to give charts a zero baseline.
 *
 * total_points is GENERATED ALWAYS in the DB and must NOT be included in the insert/update.
 */
export async function writeScoreSnapshot(snapshot: TournamentScoreHistoryNew): Promise<TournamentScoreHistory> {
  const hasHistory = await hasScoreHistory(snapshot.user_id, snapshot.tournament_id);

  if (!hasHistory) {
    const dayZero: TournamentScoreHistoryNew = {
      user_id: snapshot.user_id,
      tournament_id: snapshot.tournament_id,
      snapshot_date: getPreviousDayYYYYMMDD(snapshot.snapshot_date),
      total_game_score: 0,
      total_boost_bonus: 0,
      honor_roll_score: 0,
      individual_awards_score: 0,
      qualified_teams_score: 0,
      group_position_score: 0,
    };
    await db
      .insertInto('tournament_score_history')
      .values(dayZero)
      .onConflict((oc) =>
        oc
          .columns(['user_id', 'tournament_id', 'snapshot_date'])
          .doUpdateSet({
            total_game_score: dayZero.total_game_score,
            total_boost_bonus: dayZero.total_boost_bonus,
            honor_roll_score: dayZero.honor_roll_score,
            individual_awards_score: dayZero.individual_awards_score,
            qualified_teams_score: dayZero.qualified_teams_score,
            group_position_score: dayZero.group_position_score,
          })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

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
