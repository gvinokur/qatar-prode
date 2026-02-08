import {createBaseFunctions} from "./base-repository";
import {Team, TeamTable} from "./tables-definition";
import {db} from "./database";
import {cache} from 'react'

const tableName = 'teams'

/**
 * Represents a qualified team with their final group position
 */
export interface QualifiedTeamWithPosition {
  id: string;
  name: string;
  short_name: string;
  group_id: string;
  final_position: number; // 1, 2, or 3
}

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


   if(userId === '45bd6e70-ed7b-41b6-a860-e05b5a19deb3') {
    // console.log(query.compile()) - removed for production
   }
   return await query.execute()
})

/**
 * Helper: Create QualifiedTeamWithPosition from standing data
 */
function createQualifiedTeam(
  standing: { id: string; name: string; short_name: string; group_id: string },
  position: number
): QualifiedTeamWithPosition {
  return {
    id: standing.id,
    name: standing.name,
    short_name: standing.short_name,
    group_id: standing.group_id,
    final_position: position,
  };
}

/**
 * Helper: Add top 2 teams from complete groups
 */
function addTopTwoFromCompleteGroups(
  groupedStandings: Record<string, Array<{ id: string; name: string; short_name: string; group_id: string; position: number; is_complete: boolean }>>,
  results: QualifiedTeamWithPosition[]
): void {
  for (const standings of Object.values(groupedStandings)) {
    const groupComplete = standings.every(s => s.is_complete);
    if (!groupComplete) continue;

    // DB positions are 0-indexed: 0 = 1st place, 1 = 2nd place
    const first = standings.find(s => s.position === 0);
    const second = standings.find(s => s.position === 1);

    if (first) results.push(createQualifiedTeam(first, 1));
    if (second) results.push(createQualifiedTeam(second, 2));
  }
}

/**
 * Helper: Add 3rd place teams that qualified via playoff bracket
 */
function addThirdPlaceQualifiers(
  groupedStandings: Record<string, Array<{ id: string; name: string; short_name: string; group_id: string; position: number; is_complete: boolean }>>,
  playoffTeamIds: Set<string>,
  results: QualifiedTeamWithPosition[]
): void {
  for (const standings of Object.values(groupedStandings)) {
    // DB positions are 0-indexed: 2 = 3rd place
    const third = standings.find(s => s.position === 2);
    if (third && third.is_complete && playoffTeamIds.has(third.id)) {
      results.push(createQualifiedTeam(third, 3));
    }
  }
}

/**
 * Find qualified teams with their final group positions.
 * Returns progressive results:
 * - 1st & 2nd place teams from complete groups (immediate)
 * - 3rd place qualifiers only when playoff bracket is determined
 *
 * This allows scoring to progress as groups finish rather than blocking
 * until all groups are complete.
 */
export const findQualifiedTeams = cache(async (tournamentId: string, inGroupId?: string): Promise<QualifiedTeamWithPosition[]> => {
  // 1. Get all group standings with completion status
  const groupStandings = await db
    .selectFrom('tournament_group_teams')
    .innerJoin('teams', 'teams.id', 'tournament_group_teams.team_id')
    .innerJoin('tournament_groups', 'tournament_groups.id', 'tournament_group_teams.tournament_group_id')
    .where('tournament_groups.tournament_id', '=', tournamentId)
    .$if(typeof inGroupId === 'string', qb =>
      qb.where('tournament_groups.id', '=', inGroupId!)
    )
    .select([
      'teams.id',
      'teams.name',
      'teams.short_name',
      'tournament_group_teams.tournament_group_id as group_id',
      'tournament_group_teams.position',
      'tournament_group_teams.is_complete',
    ])
    .execute();

  // Debug logging
  if (inGroupId) {
    console.log('[findQualifiedTeams] Group standings for groupId:', inGroupId);
    console.log('[findQualifiedTeams] Standings:', JSON.stringify(groupStandings.map(s => ({
      id: s.id,
      name: s.name,
      position: s.position,
      is_complete: s.is_complete
    })), null, 2));
  }

  const results: QualifiedTeamWithPosition[] = [];

  // 2. Group standings by group_id
  const groupedStandings = groupStandings.reduce((acc, standing) => {
    if (!acc[standing.group_id]) acc[standing.group_id] = [];
    acc[standing.group_id].push(standing);
    return acc;
  }, {} as Record<string, typeof groupStandings>);

  // 3. Add 1st and 2nd place from complete groups
  addTopTwoFromCompleteGroups(groupedStandings, results);

  // 4. Add 3rd place qualifiers (determined by playoff bracket)
  const playoffTeams = await db
    .selectFrom('games')
    .where('game_type', '=', 'first_round')
    .where('tournament_id', '=', tournamentId)
    .select(['home_team', 'away_team'])
    .execute();

  if (playoffTeams.length > 0) {
    const playoffTeamIds = new Set<string>();
    playoffTeams.forEach(game => {
      if (game.home_team) playoffTeamIds.add(game.home_team);
      if (game.away_team) playoffTeamIds.add(game.away_team);
    });

    addThirdPlaceQualifiers(groupedStandings, playoffTeamIds, results);
  }

  // Debug logging
  if (inGroupId) {
    console.log('[findQualifiedTeams] Final qualified teams:', JSON.stringify(results.map(r => ({
      id: r.id,
      name: r.name,
      final_position: r.final_position
    })), null, 2));
  }

  return results;
})

