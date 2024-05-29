import {createBaseFunctions} from "./base-repository";
import {Team, TeamTable, TournamentTable} from "./tables-definition";
import {db} from "./database";

const tableName = 'teams'

const baseFunctions = createBaseFunctions<TeamTable, Team>(tableName);
export const findTeamById = baseFunctions.findById
export const updateTeam = baseFunctions.update
export const createTeam = baseFunctions.create
export const deleteTeam =  baseFunctions.delete

export async function getTeamByName(name: string) {
  return await db.selectFrom(tableName)
    .where('name', '=', name)
    .selectAll()
    .executeTakeFirst()
}

export async function findTeamInTournament(tournamentId: string) {
  return await db.selectFrom(tableName)
    .innerJoin('tournament_teams', 'tournament_teams.team_id', 'teams.id')
    .selectAll(tableName)
    .execute();
}

export async function findTeamInGroup(groupId: string) {
  return await db.selectFrom(tableName)
    .innerJoin('tournament_group_teams', 'tournament_group_teams.team_id', 'teams.id')
    .where('tournament_group_teams.tournament_group_id', '=', groupId)
    .selectAll(tableName)
    .execute();
}
