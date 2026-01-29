'use server'

import {
  createTournament,
  findAllActiveTournaments, findAllTournaments,
  findTournamentById,
  updateTournament
} from "../db/tournament-repository";
import {
  Game, PlayoffRoundNew, PlayoffRoundUpdate,
  Team,
  Tournament,
  TournamentGroup,
  TournamentNew
} from "../db/tables-definition";
import {
  findFirstGameInTournament,
  findGamesAroundCurrentTime,
  findGamesInGroup,
  findGamesInTournament
} from "../db/game-repository";
import {
  createTournamentGroup,
  createTournamentGroupTeam,
  deleteTournamentGroupTeams,
  findGroupsInTournament,
  findGroupsWithGamesAndTeamsInTournament,
  findTeamsInGroup,
  findTournamentgroupById,
  updateTournamentGroup
} from "../db/tournament-group-repository";
import {
  createPlayoffRound,
  findPlayoffStagesWithGamesInTournament,
  updatePlayoffRound
} from "../db/tournament-playoff-repository";
import {CompleteGroupData, CompletePlayoffData} from "../definitions";
import {toMap} from "../utils/ObjectUtils";
import {getLoggedInUser} from "./user-actions";
import {createS3Client, getS3KeyFromURL} from "./s3";
import {findTeamInGroup, findTeamInTournament} from "../db/team-repository";

/**
 * Get all tournaments, including dev and inactive ones
 */
export async function getAllTournaments () {
  const tournaments = await findAllTournaments()
  return tournaments
}

export async function getTournaments () {
  const user = await getLoggedInUser()
  const tournaments = await findAllActiveTournaments(user?.id)
  return tournaments
}

/**
 * Get games for dashboard display (last 24h + next 48h)
 * This unified function replaces both getGamesAroundMyTime and getGamesClosingWithin48Hours
 */
export async function getGamesForDashboard(tournamentId: string) {
  const { findGamesForDashboard } = await import('../db/game-repository')
  return await findGamesForDashboard(tournamentId)
}

// Backward compatibility aliases (deprecated)
export async function getGamesAroundMyTime(tournamentId: string) {
  return await getGamesForDashboard(tournamentId)
}

export async function getGamesClosingWithin48Hours(tournamentId: string) {
  return await getGamesForDashboard(tournamentId)
}

export async function getTeamsMap(objectId: string, teamParent: 'tournament' | 'group' = 'tournament') {
  const teams: Team[] = teamParent === 'tournament' ? await findTeamInTournament(objectId) : await findTeamInGroup(objectId)
  const teamsMap: {[k:string]: Team} = toMap(teams)

  return teamsMap;
}

export async function getCompleteGroupData(groupId: string, includeDraftResults:boolean = false) {
  const group = await findTournamentgroupById(groupId)

  if(group) {
    const allGroups = await findGroupsInTournament(group.tournament_id)

    const teamsMap = await getTeamsMap(group.id, 'group')

    const games = await findGamesInGroup(group.id, true, includeDraftResults)
    const gamesMap: {[k: string]: Game} = toMap(games)

    const teamPositions = await findTeamsInGroup(groupId)

    return {
      group,
      allGroups,
      teamsMap,
      gamesMap,
      teamPositions
    } as CompleteGroupData
  } else {
    throw 'Invalid group id'
  }
}

export async function getCompletePlayoffData(tournamentId: string, includeDraftResults:boolean = true) {
  const playoffStages = await findPlayoffStagesWithGamesInTournament(tournamentId)
  const teamsMap = await getTeamsMap(tournamentId)
  const games: Game[] = await findGamesInTournament(tournamentId, includeDraftResults)
  const gamesMap: {[k: string]: Game} = toMap(games)
  const tournamentStartDate: Date =
    // new Date(2024, 4,1) //For debug purposes
    games.sort((a, b) => a.game_date.getTime() - b.game_date.getTime())[0]?.game_date

  return {
    playoffStages,
    teamsMap,
    gamesMap,
    tournamentStartDate
  } as CompletePlayoffData
}

export async function getTournamentAndGroupsData(tournamentId:string) {
  const tournament = await findTournamentById(tournamentId)
  const allGroups = await findGroupsInTournament(tournamentId)

  return {
    tournament,
    allGroups
  }
}

export async function getTournamentStartDate(tournamentId: string) {
  const firstGame = await findFirstGameInTournament(tournamentId)
  return firstGame?.game_date || new Date(2024,0,1)
}

/**
 * Deactivates a tournament by setting is_active to false
 * @param tournamentId - The ID of the tournament to deactivate
 * @returns The updated tournament or an error
 */
export async function deactivateTournament(tournamentId: string) {
  const user = await getLoggedInUser();

  // Check if user is admin
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can deactivate tournaments');
  }

  // Check if tournament exists
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  // Update the tournament to set is_active to false
  return await updateTournament(tournamentId, { is_active: false });
}

// S3 client will be created when needed

/**
 * Create or update a tournament with optional logo upload
 * @param tournamentId - Tournament ID (null for new tournaments)
 * @param tournamentData - Tournament data to create/update
 * @param logoFile - Optional logo file to upload
 * @returns The created/updated tournament
 */
export async function createOrUpdateTournament(
  tournamentId: string | null,
  tournamentFormData: any,
): Promise<Tournament> {
  // Check if user is admin
  await validateAdminUser();
  
  const { tournamentData, logoFile } = parseFormData(tournamentFormData);
  const existingTournament = await getExistingTournament(tournamentId);
  
  const { logoUrl, logoKey } = await handleLogoUpload(logoFile, existingTournament);
  
  const updatedTournamentData = prepareTournamentData(tournamentData, existingTournament, logoUrl, logoKey);
  
  const result = await saveOrUpdateTournament(tournamentId, updatedTournamentData);
  
  await cleanupOldLogo(existingTournament, logoFile, logoUrl);
  
  return result;
}

async function validateAdminUser(): Promise<void> {
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage tournaments');
  }
}

function parseFormData(formData: any): { tournamentData: any; logoFile: any } {
  const data = Object.fromEntries(formData);
  return {
    tournamentData: JSON.parse(data.tournament),
    logoFile: data.logo
  };
}

async function getExistingTournament(tournamentId: string | null): Promise<Tournament | null> {
  if (!tournamentId) return null;
  
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }
  
  return tournament;
}

async function handleLogoUpload(logoFile: any, existingTournament: Tournament | null): Promise<{ logoUrl: string | null; logoKey: string | null }> {
  if (!logoFile) {
    return {
      logoUrl: existingTournament?.theme?.logo || null,
      logoKey: existingTournament?.theme?.s3_logo_key || null
    };
  }
  
  try {
    const s3Client = createS3Client('tournament-logos');
    const res = await s3Client.uploadFile(Buffer.from(await logoFile.arrayBuffer()));
    return {
      logoUrl: res.location,
      logoKey: res.key
    };
  } catch (error) {
    console.error('Error uploading logo:', error);
    
    if (error instanceof Error && error.message.includes('Body exceeded')) {
      throw new Error('Logo file is too large. Maximum file size allowed is 5MB. Please choose a smaller image file.');
    }
    
    throw new Error('Failed to upload logo. Please try again with a smaller file.');
  }
}

function prepareTournamentData(
  tournamentData: any,
  existingTournament: Tournament | null,
  logoUrl: string | null,
  logoKey: string | null
): any {
  return {
    ...tournamentData,
    theme: {
      ...(tournamentData.theme),
      ...(existingTournament?.theme || {}),
      logo: logoUrl || undefined,
      s3_logo_key: logoKey || undefined,
      is_s3_logo: true
    }
  };
}

async function saveOrUpdateTournament(tournamentId: string | null, tournamentData: any): Promise<Tournament> {
  if (tournamentId) {
    return await updateTournament(tournamentId, tournamentData);
  }
  return await createTournament(tournamentData as TournamentNew);
}

async function cleanupOldLogo(existingTournament: Tournament | null, logoFile: any, newLogoUrl: string | null): Promise<void> {
  if (!existingTournament || !logoFile) return;
  
  const existingLogoKey = existingTournament.theme?.s3_logo_key || getS3KeyFromURL(existingTournament.theme?.logo || '');
  const existingLogoUrl = existingTournament.theme?.logo;
  
  if (existingLogoKey && newLogoUrl !== existingLogoUrl) {
    try {
      const s3Client = createS3Client('tournament-logos');
      await s3Client.deleteFile(existingLogoKey);
    } catch (error) {
      console.error('Error deleting old logo:', error);
    }
  }
}

export async function getTournamentById(tournamentId: string) {
  return await findTournamentById(tournamentId);
}

export async function getCompleteTournamentGroups(tournamentId: string) {
  return await findGroupsWithGamesAndTeamsInTournament(tournamentId);
}

/**
 * Creates or updates a tournament group with the specified teams
 * @param tournamentId - The ID of the tournament
 * @param groupData - The group data (id is required for updates, omit for creation)
 * @param teamIds - Array of team IDs to associate with the group
 * @returns The updated groups for the tournament
 */
export async function createOrUpdateTournamentGroup(
  tournamentId: string,
  groupData: {
    id?: string;
    group_letter: string;
    sort_by_games_between_teams?: boolean;
  },
  teamIds: string[]
) {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage tournament groups');
  }

  let group: TournamentGroup;
  let existingTeamsIds: string[] = [];

  // Determine if we're creating or updating
  if (groupData.id) {
    // Update existing group
    group = await updateTournamentGroup(groupData.id, {
      group_letter: groupData.group_letter,
      sort_by_games_between_teams: groupData.sort_by_games_between_teams || false
    });

    existingTeamsIds = (await findTeamInGroup(group.id)).map(team => team.id);
  } else {
    // Create new group
    group = await createTournamentGroup({
      tournament_id: tournamentId,
      group_letter: groupData.group_letter,
      sort_by_games_between_teams: groupData.sort_by_games_between_teams || false
    });
  }

  // Create new team associations
  let createTeams = true;
  if(existingTeamsIds) {
    if (teamIds.length !== existingTeamsIds.length ||
      existingTeamsIds.some(existingTeamId => !teamIds.includes(existingTeamId))) {
      await deleteTournamentGroupTeams(group.id);
    } else {
      createTeams = false;
      }
  }
  if(createTeams && teamIds.length > 0) {
    await Promise.all(teamIds.map((teamId, index) => {
      return createTournamentGroupTeam({
        tournament_group_id: group.id,
        team_id: teamId,
        position: index,
        games_played: 0,
        points: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        conduct_score: 0,
        is_complete: false
      })
    }));
  }

  // Return the updated list of groups for the tournament
  return await findGroupsWithGamesAndTeamsInTournament(tournamentId);
}

export async function getPlayoffRounds(tournamentId: string) {
  return findPlayoffStagesWithGamesInTournament(tournamentId);
}

/**
 * Creates or updates a playoff stage
 * @param playoffRoundData - The playoff stage data to create or update
 * @returns The created/updated playoff stage
 */
export async function createOrUpdatePlayoffRound(playoffRoundData: PlayoffRoundNew | PlayoffRoundUpdate): Promise<any> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage playoff stages');
  }

  try {
    let result;

    if (playoffRoundData.id) {
      // Update existing playoff stage
      result = await updatePlayoffRound(playoffRoundData.id, playoffRoundData);
    } else {
      // Create new playoff stage
      result = await createPlayoffRound(playoffRoundData as PlayoffRoundNew);
    }

    return result;
  } catch (error: any) {
    console.error('Error creating/updating playoff round:', error);
    throw new Error(error.message || 'Failed to save playoff stage');
  }
}
