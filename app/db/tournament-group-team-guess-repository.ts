import { db } from './database'
import {TournamentGroupTeamStatsGuessNew} from "./tables-definition";


export async function upsertTournamentGroupTeamGuesses(groupTeamGuesses: TournamentGroupTeamStatsGuessNew[]) {
  return Promise.all(groupTeamGuesses.map(async ({user_id, tournament_group_id, team_id, ...withUpdate }) => {
    return db.insertInto('tournament_group_team_stats_guess')
      .values({
        user_id,
        tournament_group_id,
        team_id,
        ...withUpdate
      })
      .onConflict(oc =>
        oc.columns(['user_id', 'tournament_group_id', 'team_id'])
          .doUpdateSet(withUpdate)
      )
      .returningAll()
      .executeTakeFirst()
  }))
}

export async function findAllTournamentGroupTeamGuessInGroup(userId: string, groupId: string) {
  return db.selectFrom('tournament_group_team_stats_guess')
    .where('user_id', '=', userId)
    .where('tournament_group_id', '=', groupId)
    .selectAll()
    .orderBy('position asc')
    .execute()
}

export async function findAllUserTournamentGroupsWithoutGuesses(tournamentId: string, forceRecalculation:boolean = false) {
  return db.selectFrom(['users', 'tournament_groups'])
    .select(["users.id as user_id", 'tournament_groups.id as tournament_group_id'])
    .where('tournament_groups.tournament_id', '=', tournamentId)
    .$if(!forceRecalculation, qb => qb.where(eb =>
      eb.not(
        eb.exists(
          eb.selectFrom('tournament_group_team_stats_guess')
            .where('user_id', '=', eb.ref('users.id'))
            .where('tournament_group_id', '=', eb.ref('tournament_groups.id'))
            .selectAll()
        )
      )
    ))
    .execute()
}
