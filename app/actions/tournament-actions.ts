'use server'

import {findAllActiveTournaments, findTournamentById, findTournamentByName} from "../db/tournament-repository";
import {findGuessedQualifiedTeams, findTeamInGroup, findTeamInTournament} from "../db/team-repository";
import {Game, GameResult, Team, Tournament} from "../db/tables-definition";
import {
  findFirstGameInTournament,
  findGamesAroundCurrentTime,
  findGamesInGroup,
  findGamesInTournament
} from "../db/game-repository";
import {
  findGroupsInTournament,
  findGroupsWithGamesAndTeamsInTournament, findTeamsInGroup,
  findTournamentgroupById
} from "../db/tournament-group-repository";
import {findPlayoffStagesWithGamesInTournament} from "../db/tournament-playoff-repository";
import {CompleteGroupData, CompletePlayoffData, CompleteTournamentData} from "../definitions";
import {findTournamentGuessByUserIdTournament} from "../db/tournament-guess-repository";
import {toMap} from "../utils/ObjectUtils";

export async function getTournaments () {
  const tournaments = await findAllActiveTournaments()
  return tournaments
}

export async function getGamesAroundMyTime(tournamentId: string) {
  return await findGamesAroundCurrentTime(tournamentId)
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

export async function getCompletePlayoffData(tournamentId: string) {
  const playoffStages = await findPlayoffStagesWithGamesInTournament(tournamentId)
  const teamsMap = await getTeamsMap(tournamentId)
  const games: Game[] = await findGamesInTournament(tournamentId)
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
