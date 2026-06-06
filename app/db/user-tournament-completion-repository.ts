import { sql } from 'kysely'
import { db } from './database'

export interface UserTournamentCompletionRow {
  userId: string
  nickname: string
  isEmailVerified: boolean
  gamesPredicted: number
  totalGames: number
  qualifiersFilled: number
  qualifiersTotal: number
  awardsFilled: number
  awardsTotal: number
  groupCount: number
  groupNames: string[]
  overallPct: number
}

interface RawCompletionRow {
  user_id: string
  nickname: string
  is_email_verified: boolean
  games_predicted: string
  total_games: string
  qualifiers_filled: string
  qualifiers_total: string
  awards_filled: string
  group_count: string
  group_names: string[] | null
}

interface CountRow {
  count: string
}

export async function getUserTournamentCompletionsPaginated(
  tournamentId: string,
  page: number,
  pageSize: number
): Promise<{ rows: UserTournamentCompletionRow[]; total: number }> {
  const offset = page * pageSize

  const [rowsResult, countResult] = await Promise.all([
    sql<RawCompletionRow>`
      SELECT
        u.id AS user_id,
        u.nickname,
        u.email_verified AS is_email_verified,
        COALESCE(gg.games_predicted, 0) AS games_predicted,
        COALESCE(tg_total.total_games, 0) AS total_games,
        COALESCE(qp.qualifiers_filled, 0) AS qualifiers_filled,
        COALESCE(tq.total_qualifiers, 0) AS qualifiers_total,
        (
          CASE WHEN tgu.champion_team_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN tgu.runner_up_team_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN tgu.third_place_team_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN tgu.best_player_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN tgu.top_goalscorer_player_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN tgu.best_goalkeeper_player_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN tgu.best_young_player_id IS NOT NULL THEN 1 ELSE 0 END
        ) AS awards_filled,
        COALESCE(grp.group_count, 0) AS group_count,
        COALESCE(grp.group_names, '{}') AS group_names
      FROM users u
      LEFT JOIN tournament_guesses tgu
        ON tgu.user_id = u.id AND tgu.tournament_id = ${tournamentId}
      LEFT JOIN (
        SELECT gg_inner.user_id, COUNT(*) AS games_predicted
        FROM game_guesses gg_inner
        JOIN games g ON gg_inner.game_id = g.id AND g.tournament_id = ${tournamentId}
        WHERE gg_inner.home_score IS NOT NULL AND gg_inner.away_score IS NOT NULL
        GROUP BY gg_inner.user_id
      ) gg ON gg.user_id = u.id
      LEFT JOIN (
        SELECT tugpp.user_id,
          COUNT(*) FILTER (WHERE (pos->>'predicted_to_qualify')::boolean = true) AS qualifiers_filled
        FROM tournament_user_group_positions_predictions tugpp
        JOIN tournament_groups tgrp ON tugpp.group_id = tgrp.id AND tgrp.tournament_id = ${tournamentId}
        CROSS JOIN jsonb_array_elements(tugpp.team_predicted_positions) AS pos
        GROUP BY tugpp.user_id
      ) qp ON qp.user_id = u.id
      LEFT JOIN (
        SELECT combined.user_id,
          COUNT(*) AS group_count,
          array_agg(combined.name ORDER BY combined.name) AS group_names
        FROM (
          SELECT pgp.participant_id AS user_id, pg.name
          FROM prode_group_participants pgp
          JOIN prode_groups pg ON pg.id = pgp.prode_group_id
          UNION
          SELECT pg.owner_user_id AS user_id, pg.name
          FROM prode_groups pg
        ) combined
        GROUP BY combined.user_id
      ) grp ON grp.user_id = u.id
      CROSS JOIN (
        SELECT COUNT(*) AS total_games
        FROM games
        WHERE tournament_id = ${tournamentId}
      ) tg_total
      CROSS JOIN (
        SELECT
          (SELECT COUNT(*) FROM tournament_groups WHERE tournament_id = ${tournamentId})::integer * 2 +
          COALESCE(
            (SELECT CASE WHEN allows_third_place_qualification THEN max_third_place_qualifiers ELSE 0 END
             FROM tournaments WHERE id = ${tournamentId}),
            0
          ) AS total_qualifiers
      ) tq
      ORDER BY (
        COALESCE(gg.games_predicted, 0) +
        COALESCE(qp.qualifiers_filled, 0) +
        CASE WHEN tgu.champion_team_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN tgu.runner_up_team_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN tgu.third_place_team_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN tgu.best_player_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN tgu.top_goalscorer_player_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN tgu.best_goalkeeper_player_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN tgu.best_young_player_id IS NOT NULL THEN 1 ELSE 0 END
      ) DESC, u.nickname ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `.execute(db),

    sql<CountRow>`SELECT COUNT(*) AS count FROM users`.execute(db),
  ])

  const rows = rowsResult.rows.map((row) => {
    const totalAll = Number(row.total_games) + Number(row.qualifiers_total) + 7
    const completedAll =
      Number(row.games_predicted) + Number(row.qualifiers_filled) + Number(row.awards_filled)
    const overallPct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0

    return {
      userId: row.user_id,
      nickname: row.nickname,
      isEmailVerified: row.is_email_verified,
      gamesPredicted: Number(row.games_predicted),
      totalGames: Number(row.total_games),
      qualifiersFilled: Number(row.qualifiers_filled),
      qualifiersTotal: Number(row.qualifiers_total),
      awardsFilled: Number(row.awards_filled),
      awardsTotal: 7,
      groupCount: Number(row.group_count),
      groupNames: row.group_names ?? [],
      overallPct,
    }
  })

  const total = Number(countResult.rows[0]?.count ?? 0)

  return { rows, total }
}
