'use server'

import { getLoggedInUser } from './user-actions';
import { Team } from '../db/tables-definition';
import {createS3Client, getS3KeyFromURL} from "./s3";
import {createTeam as createTeamInDb, updateTeam as updateTeaminDb, findTeamInTournament, findTeamInGroup} from "../db/team-repository";
import {createTournamentTeam} from "../db/tournament-repository";

// Initialize S3 client
const s3Client = createS3Client('team_logos')

/**
 * Create a new team and associate it with a tournament
 */
export async function createTeam(formData: FormData, tournamentId: string): Promise<Team> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage teams');
  }

  // Parse team data
  const teamDataStr = formData.get('team') as string;
  if (!teamDataStr) {
    throw new Error('Team data is required');
  }

  const teamData = JSON.parse(teamDataStr);

  // Handle logo upload if provided
  const logoFile = formData.get('logo') as File;
  let logoUrl = null;

  if (logoFile) {
    try {
      // Upload to S3
      const res = await s3Client.uploadFile(Buffer.from(await logoFile.arrayBuffer()));
      // Construct the URL to the uploaded file
      logoUrl = res.location;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload team logo');
    }
  }

  // Update team data with logo URL
  const finalTeamData = {
    ...teamData,
    theme: {
      ...teamData.theme,
      logo: logoUrl
    }
  };

  // Create team in database
  const newTeam = await createTeamInDb(finalTeamData)
  await createTournamentTeam({
    tournament_id: tournamentId,
    team_id: newTeam.id
  });
  return newTeam;
}

/**
 * Update an existing team
 */
export async function updateTeam(teamId: string, formData: FormData, tournamentId: string): Promise<Team> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can manage teams');
  }

  // Parse team data
  const teamDataStr = formData.get('team') as string;
  if (!teamDataStr) {
    throw new Error('Team data is required');
  }

  const teamData = JSON.parse(teamDataStr);

  // Handle logo upload if provided
  const logoFile = formData.get('logo') as File;
  let logoUrl = teamData.theme?.logo || null;

  if (logoFile) {
    try {

      const res = await s3Client.uploadFile(Buffer.from(await logoFile.arrayBuffer()));
      logoUrl = res.location;

      // Delete old logo if exists
      if (teamData.theme?.logo) {
        const oldLogoUrl = teamData.theme.logo;
        const logoKey = getS3KeyFromURL(oldLogoUrl);
        if (logoKey) {
          await s3Client.deleteFile(logoKey);
        }
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload team logo');
    }
  }

  // Update team data with logo URL
  const finalTeamData = {
    ...teamData,
    theme: {
      ...teamData.theme,
      logo: logoUrl
    }
  };

  // Update team in database
  const updatedTeam = await updateTeaminDb(teamId, finalTeamData);
  return updatedTeam;
}
