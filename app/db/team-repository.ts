import {createBaseFunctions} from "./base-repository";
import {Team, TeamTable} from "./tables-definition";
import {db} from "./database";
import {cache} from 'react'

const tableName = 'teams'

const baseFunctions = createBaseFunctions<TeamTable, Team>(tableName);
export const findTeamById = baseFunctions.findById
export const updateTeam = baseFunctions.update
export const createTeam = baseFunctions.create
export const deleteTeam =  baseFunctions.delete

export const getTeamByName = cache(async (name: string)=> {
  return await db.selectFrom(tableName)
    .where('name', '=', name)
    .selectAll()
    .executeTakeFirst()
})

export const findTeamInTournament = cache(async (tournamentId: string) => {
  return await db.selectFrom(tableName)
    .innerJoin('tournament_teams', 'tournament_teams.team_id', 'teams.id')
    .where('tournament_teams.tournament_id', '=', tournamentId)
    .selectAll(tableName)
    .execute();
})

export const findTeamInGroup = cache(async (groupId: string) => {
  return await db.selectFrom(tableName)
    .innerJoin('tournament_group_teams', 'tournament_group_teams.team_id', 'teams.id')
    .where('tournament_group_teams.tournament_group_id', '=', groupId)
    .selectAll(tableName)
    .execute();
})

export const findGuessedQualifiedTeams = cache(async (tournamentId: string, userId: string, inGroupId?:string) => {
 const query = db.selectFrom(tableName)
   .selectAll()
   .where(eb =>
     eb.exists(
       eb.selectFrom('game_guesses')
         .innerJoin('games', 'games.id', 'game_guesses.game_id')
         .where('game_type', '=', 'first_round')
         .where('games.tournament_id', '=', tournamentId)
         .where('game_guesses.user_id', '=', userId)
         .where(ieb => ieb.or([
           ieb('teams.id', '=', ieb.cast<string>(ieb.ref('game_guesses.home_team'),'uuid')),
           ieb('teams.id', '=', ieb.cast<string>(ieb.ref('game_guesses.away_team'),'uuid')),
         ]))
     )
   )
   .$if(typeof inGroupId === 'string', qb =>
     qb.where(eb =>
       eb.exists(
         eb.selectFrom('tournament_group_teams')
           .selectAll()
           // @ts-ignore
           .where('tournament_group_teams.tournament_group_id', '=', inGroupId)
           .whereRef('tournament_group_teams.team_id', '=', 'teams.id')
       )
     ));

   return await query.execute()
})

export const findQualifiedTeams= cache(async (tournamentId: string, inGroupId?:string)  => {
  return await db.selectFrom(tableName)
    .selectAll()
    .where(eb =>
      eb.exists(
        eb.selectFrom('games')
          .where('game_type', '=', 'first_round')
          .where('games.tournament_id', '=', tournamentId)
          .where(ieb => ieb.or([
            ieb('teams.id', '=', ieb.cast<string>(ieb.ref('home_team'),'uuid')),
            ieb('teams.id', '=', ieb.cast<string>(ieb.ref('away_team'),'uuid')),
          ]))
      )
    )
    .$if(typeof inGroupId === 'string', qb =>
      qb.where(eb =>
        eb.exists(
          eb.selectFrom('tournament_group_teams')
            .selectAll()
            // @ts-ignore
            .where('tournament_group_teams.tournament_group_id', '=', inGroupId)
            .whereRef('tournament_group_teams.team_id', '=', 'teams.id')
        )
      ))
    .execute()
})

