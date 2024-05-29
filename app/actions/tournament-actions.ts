import {findAllActiveTournaments, findTournamentById, findTournamentByName} from "../db/tournament-repository";
import {findTeamInGroup, findTeamInTournament} from "../db/team-repository";
import {Game, GameResult, Team, Tournament} from "../db/tables-definition";
import {findGamesInGroup, findGamesInTournament} from "../db/game-repository";
import {
  findGroupsInTournament,
  findGroupsWithGamesAndTeamsInTournament,
  findTournamentgroupById
} from "../db/tournament-group-repository";
import {findPlayoffStagesWithGamesInTournament} from "../db/tournament-playoff-repository";
import {CompleteGroupData, CompletePlayoffData, CompleteTournamentData} from "../definitions";
import {findTournamentGuessByUserIdTournament} from "../db/tournament-guess-repository";


export async function getTournaments () {
  const tournaments = await findAllActiveTournaments()
  return tournaments
}

export async function getCompleteTournament(tournamentId: string) {
  const tournament = await findTournamentById(tournamentId)
  if(tournament) {
    const teams: Team[] = await findTeamInTournament(tournament.id);
    const teamsMap: {[k:string]: Team} = Object.fromEntries(teams.map((team: Team) => ([team.id, team])))

    const games: Game[] = await findGamesInTournament(tournament.id)
    const gamesMap: {[k: string]: Game} = Object.fromEntries(games.map((game: Game) => ([game.id, game])))

    const groups = await findGroupsWithGamesAndTeamsInTournament(tournament.id)

    const playoffRounds = await findPlayoffStagesWithGamesInTournament(tournament.id)

    const tournamentData: CompleteTournamentData = {
      tournament,
      teams,
      teamsMap,
      games,
      gamesMap,
      groups,
      playoffRounds
    }

    return tournamentData;
  } else {
    //Throw some kind of error
    throw 'Invalid group id'
  }
}

export async function getCompleteGroupData(groupId: string) {
  const group = await findTournamentgroupById(groupId)

  if(group) {
    const allGroups = await findGroupsInTournament(group.tournament_id)

    const teams: Team[] = await findTeamInGroup(group.id)
    const teamsMap: {[k:string]: Team} = Object.fromEntries(teams.map((team: Team) => ([team.id, team])))

    const games = await findGamesInGroup(group.id)
    const gamesMap: {[k: string]: Game} = Object.fromEntries(games.map((game: Game) => ([game.id, game])))

    return {
      group,
      allGroups,
      teams,
      teamsMap,
      games,
      gamesMap
    } as CompleteGroupData
  } else {
    throw 'Invalid group id'
  }
}

export async function getCompletePlayoffData(tournamentId: string) {
  const playoffStages = await findPlayoffStagesWithGamesInTournament(tournamentId)
  const allGroups = await findGroupsWithGamesAndTeamsInTournament(tournamentId)

  const teams: Team[] = await findTeamInTournament(tournamentId);
  const teamsMap: {[k:string]: Team} = Object.fromEntries(teams.map((team: Team) => ([team.id, team])))

  const games: Game[] = await findGamesInTournament(tournamentId)
  const gamesMap: {[k: string]: Game} = Object.fromEntries(games.map((game: Game) => ([game.id, game])))

  const gameResults: GameResult[] = []
  const gameResultsMap: {[k:string]: GameResult} = Object.fromEntries(
    gameResults.map(gameResult => [gameResult.game_id, gameResult]))

  const tournamentStartDate: Date =
    // new Date(2024, 4,1) //For debug purposes
    games.sort((a, b) => a.game_date.getTime() - b.game_date.getTime())[0]?.game_date

  return {
    playoffStages,
    allGroups,
    teamsMap,
    gamesMap,
    gameResultsMap,
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
