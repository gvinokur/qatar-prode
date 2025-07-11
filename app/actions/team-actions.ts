'use server'

import { getLoggedInUser } from './user-actions';
import {Player, PlayerNew, Team} from '../db/tables-definition';
import {createS3Client, deleteThemeLogoFromS3} from "./s3";
import {createTeam as createTeamInDb, updateTeam as updateTeaminDb, findTeamInTournament} from "../db/team-repository";
import {createTournamentTeam} from "../db/tournament-repository";
import * as cheerio from 'cheerio';
import {
  createPlayer,
  findAllPlayersInTournamentWithTeamData,
  deleteAllPlayersInTournamentTeam as deleteAllPlayersInTournamentTeamDb,
  deletePlayer, updatePlayer
} from "../db/player-repository";
import {getTournamentStartDate} from "./tournament-actions";

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
      
      // Check if error is related to body size limit
      if (error instanceof Error && error.message.includes('Body exceeded')) {
        throw new Error('Logo file is too large. Maximum file size allowed is 5MB. Please choose a smaller image file.');
      }
      
      throw new Error('Failed to upload team logo. Please try again with a smaller file.');
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
export async function updateTeam(teamId: string, formData: FormData): Promise<Team> {
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
  let logoKey = teamData.theme?.s3_logo_key || null;

  if (logoFile) {
    try {

      const res = await s3Client.uploadFile(Buffer.from(await logoFile.arrayBuffer()));
      logoUrl = res.location;
      logoKey = res.key

      // Delete old logo if exists
      await deleteThemeLogoFromS3(teamData.theme);

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
      logo: logoUrl,
      s3_logo_key: logoKey,
      is_s3_logo: true,
    }
  };

  // Update team in database
  const updatedTeam = await updateTeaminDb(teamId, finalTeamData);
  return updatedTeam;
}

/**
 * Get all players in a tournament grouped by their teams
 */
export async function getPlayersInTournament(tournamentId: string): Promise<{team: Team, players: Player[]}[]> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can access this data');
  }

  try {
    // Get all players with their team data
    const teams = await findTeamInTournament(tournamentId);
    const playersWithTeams = await findAllPlayersInTournamentWithTeamData(tournamentId);

    // Group players by team
    const teamMap =
      Object.fromEntries(teams.map(team => [team.id, { team, players: [] as Player[] }]));

    playersWithTeams.forEach(playerWithTeam => {
      const { team, ...player } = playerWithTeam;

      teamMap[team.id]?.players?.push(player);
    });

    // Convert map to array
    return Array.from(Object.values(teamMap));
  } catch (error) {
    console.error('Error fetching players in tournament:', error);
    throw new Error('Failed to fetch players in tournament');
  }
}

/**
 * Player data interface
 */
interface PlayerData {
  name: string;
  position: string;
  ageAtTournament: number;
}

const positioMap: {[key:string]: string} = {
  'Goalkeeper': 'GK',
  'Defender': 'DF',
  'Centre-Back': 'DF',
  'Left-Back': 'DF',
  'Right-Back': 'DF',
  'Midfield': 'MF',
  'Midfielder': 'MF',
  'Defensive Midfielder': 'MF',
  'Central Midfielder': 'MF',
  'Attacking Midfielder': 'MF',
  'Right Midfielder': 'MF',
  'Left Midfielder': 'MF',
  'Right Winger': 'FW',
  'Left Winger': 'FW',
  'Centre-Forward': 'FW',
  'Attack': 'FW',
}

function calculateAge(birth: Date, future: Date) {
  let age = future.getFullYear() - birth.getFullYear();
  const monthDiff = future.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && future.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Fetch player data from Transfermarkt for a given team
 */
export async function getTransfermarktPlayerData(
  transfermarktTeamName: string,
  transfermarktTeamId: string,
  tournamentId: string
): Promise<PlayerData[]> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can access this data');
  }

  try {
    // Construct the URL
    const url = `https://www.transfermarkt.com/${transfermarktTeamName}/kader/verein/${transfermarktTeamId}/saison_id/2024/plus/1`;

    // Set headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.transfermarkt.com/',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };

    // Fetch the page
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Parse the HTML
    const $ = cheerio.load(html);
    const players: PlayerData[] = [];
    const tournamentStartDate = await getTournamentStartDate(tournamentId);

    // Select the table rows containing player data
    $('.items > tbody > tr.odd, .items > tbody > tr.even').each((index, element) => {
      // Extract player name
      const name = $(element).find('td > table  .hauptlink a').text().trim();

      // Extract position
      let position = $(element).find('td:first-child')?.attr('title')?.trim() || 'Unknown';
      if (positioMap[position]) {
        position = positioMap[position];
      }

      // Extract date of birth
      const dobElement = $(element).find('> td:nth-child(3)');
      let ageAtTournament = 18;

      if (dobElement.length) {
        // Get the text and remove any content in parentheses (age)
        let dobText = dobElement.text().trim().replace(/\s*\([^)]*\)\s*/g, '');

        try {
          // Parse the date string
          const date = new Date(dobText);

          // Check if date is valid
          if (!isNaN(date.getTime())) {
            // Format as MM/DD/YYYY
            ageAtTournament = calculateAge(date, tournamentStartDate);
          }
        } catch (e) {
          console.error(`Error parsing date: ${dobText}`, e);
        }
      }

      // Only add if we have at least a name
      if (name) {
        players.push({
          name,
          position,
          ageAtTournament
        });
      }
    });

    return players;
  } catch (error) {
    console.error('Error fetching player data from Transfermarkt:', error);
    throw new Error('Failed to fetch player data from Transfermarkt');
  }
}

export async function deleteAllTeamPlayersInTournament(tournamentId: string, teamId: string): Promise<void> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can access this data');
  }

  await deleteAllPlayersInTournamentTeamDb(tournamentId, teamId);
}

export async function createTournamentTeamPlayers(players: PlayerNew[]): Promise<Player[]> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can access this data');
  }
  return Promise.all(players.map(player => createPlayer(player)));
}

export async function deleteTournamentTeamPlayers(players: Player[]): Promise<void> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can access this data');
  }

  await Promise.all(players.map(player => deletePlayer(player.id)));
}

export async function moveTournamentTeamPlayer(player: Player, newTeamId: string): Promise<Player> {
  // Check if user is admin
  const user = await getLoggedInUser();
  if (!user?.isAdmin) {
    throw new Error('Unauthorized: Only administrators can access this data');
  }

  return updatePlayer(player.id, { team_id: newTeamId });
}
