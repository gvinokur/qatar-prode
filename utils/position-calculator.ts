import {Game, GameGuess, TeamStats, GameGuessDictionary} from "../types/definitions";
import {
  allGamesByMatchNumber,
  final,
  group_games,
  groups,
  round_of_16,
  round_of_eight,
  semifinals,
  third_place
} from "../data/group-data";

import {getLoser, getWinner} from "./score-utils";

const initialTeamStats: TeamStats = {
  team: '',
  gamesPlayed: 0,
  points: 0,
  win: 0,
  draw: 0,
  loss: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
}

type TeamsByMatch = { [key: number]: { homeTeam: string, awayTeam: string } }

const isGroupComplete = (groupGames: Game[]) => {
  return groupGames.filter(game => game.localScore !== null && game.awayScore !== null).length === 6;
}

/**
 *
 * @param gameGuesses - user guesses or null to calculate based on actual scores
 */
export const calculateRoundOf16TeamsByMatch = (gameGuesses?: GameGuessDictionary): TeamsByMatch => {
  const calculateOnlyCompletedGroups = !gameGuesses;
  const positionTeamMap = groups.reduce((tempMap, group) => {
    const thisGroupGames = group_games.filter(game => game.Group === group.name);
    if (calculateOnlyCompletedGroups && !isGroupComplete(thisGroupGames)) {
      return tempMap;
    }
    const groupPositions = calculateGroupPosition(
      group.teams,
      thisGroupGames.filter(game => game.Group === group.name).map(game => gameGuesses ? ({
        ...game,
        localScore: gameGuesses[game.MatchNumber]?.localScore,
        awayScore: gameGuesses[game.MatchNumber]?.awayScore,
      }): game));
    return {
      ...tempMap,
      [`1-${group.name}`]: groupPositions[0]?.team,
      [`2-${group.name}`]: groupPositions[1]?.team,
    }
  }, {})

  const currentMap = Object.fromEntries(
    round_of_16.map(game => [
      game.MatchNumber,
      {
        // @ts-ignore
        homeTeam: positionTeamMap[`${game.HomeTeam.position}-${game.HomeTeam.group}`] as string,
        // @ts-ignore
        awayTeam: positionTeamMap[`${game.AwayTeam.position}-${game.AwayTeam.group}`] as string,
      }]))

  return currentMap
}

/**
 *
 * @param currentMap
 * @param gameGuesses - user guesses or null to calculate based on actual scores
 */
export const calculateRoundof8andLowerTeamsByMatch = (currentMap: { [key: number]: { homeTeam: string, awayTeam: string } }, gameGuesses?: GameGuessDictionary): TeamsByMatch => {
  const mapGame = (currentMap: { [key: number]: { homeTeam: string, awayTeam: string } }, fn: (guessOrGame: GameGuess | Game, homeTeam: string, awayTeam: string ) => string | null) => (game: Game): any[] => [
    game.MatchNumber,
    {
      // @ts-ignore
      homeTeam:
        fn(gameGuesses ? gameGuesses[game.HomeTeam as number] : allGamesByMatchNumber[game.HomeTeam as number],
          currentMap[game.HomeTeam as number]?.homeTeam,
          currentMap[game.HomeTeam as number]?.awayTeam),
      // @ts-ignore
      awayTeam:
        fn(gameGuesses ? gameGuesses[game.AwayTeam as number] : allGamesByMatchNumber[game.AwayTeam as number],
          currentMap[game.AwayTeam as number]?.homeTeam,
          currentMap[game.AwayTeam as number]?.awayTeam),
    }];
  currentMap = {
    ...currentMap,
    ...Object.fromEntries(round_of_eight.map(mapGame(currentMap, getWinner)))
  }
  currentMap = {
    ...currentMap,
    ...Object.fromEntries(semifinals.map(mapGame(currentMap, getWinner)))
  }
  const finalArray = mapGame(currentMap, getWinner)(final);
  const thirdPlaceArray = mapGame(currentMap, getLoser)(third_place);
  currentMap = {
    ...currentMap,
    [finalArray[0]]: finalArray[1],
    [thirdPlaceArray[0]]: thirdPlaceArray[1]
  }
  return currentMap;
}

/**
 *
 * @param teams - Names of the 4 teams of a given group
 * @param games - Games played by the 4 teams of the group, with the scores filled
 */
export const calculateGroupPosition = (teams: string[], games: Game[]) => {
  const gamesWithScores = games.filter(game => (game.localScore !== null && game.awayScore !== null))
  const teamsStatsByTeam = Object.fromEntries(teams.map(team => [
    team,
    gamesWithScores.filter(game => game.HomeTeam === team || game.AwayTeam === team)
      .reduce(teamStatsGameReducer(team), { ...initialTeamStats, team })
  ]))
  const teamStats: TeamStats[] = Object.values(teamsStatsByTeam).sort(teamStatsComparator)

  //TODO: cannot do anything more right now about 4 way ties

  let threeWayTie = false
  //Three way ties
  if (teamStats.length === 4) {
    const topThreeWayTie = equalTeamStats(teamStats[0], teamStats[1]) && equalTeamStats(teamStats[1], teamStats[2])
    const bottomThreeWayTie = equalTeamStats(teamStats[1], teamStats[2]) && equalTeamStats(teamStats[2], teamStats[3])
    threeWayTie = topThreeWayTie || bottomThreeWayTie
    if(threeWayTie) {
      //Three way ties
      // Among the top 3 teams
      const baseIndex = topThreeWayTie  ? 0 : 1
      const tiedTeams = teamStats.slice(baseIndex, baseIndex + 3).map(teamStat => teamStat.team)
      const tiedTeamGames = games.filter(game => tiedTeams.includes(game.HomeTeam as string) && tiedTeams.includes(game.AwayTeam as string));
      const threeWayTieStats = calculateGroupPosition(tiedTeams, tiedTeamGames).sort(teamStatsComparator);

      threeWayTieStats.forEach((teamStat, index) => {
        teamStats[baseIndex + index] = teamsStatsByTeam[teamStat.team]
      })
    }
  }
  if (!threeWayTie) {
    for(let i = 0; i < teamStats.length - 1; i++) {
      if(equalTeamStats(teamStats[i], teamStats[i+1])) {
        const tiedTeams = [teamStats[i].team, teamStats[i+1].team];
        const teamsGame = games.find(game => tiedTeams.includes(game.HomeTeam as string) && tiedTeams.includes(game.AwayTeam as string));
        const winnerTeam = teamsGame && teamsGame.localScore !== null && teamsGame.awayScore !== null &&
          (teamsGame.localScore > teamsGame.awayScore ? teamsGame.HomeTeam : (teamsGame.awayScore > teamsGame.localScore && teamsGame.AwayTeam)) as string;
        if (winnerTeam && winnerTeam != teamStats[i].team) {
          const temp = teamStats[i]
          teamStats[i] = teamStats[i+1];
          teamStats[i+1] = temp
        }
      }
    }
  }


  return teamStats;
}

const equalTeamStats = (a: TeamStats, b: TeamStats): boolean => getMagicNumber(a) === getMagicNumber(b)

const teamStatsComparator = (a: TeamStats, b: TeamStats): number => {
  const comparator = getMagicNumber(b) - getMagicNumber(a);
  return comparator;
}

const getMagicNumber = (t: TeamStats) =>
  (t.goalsFor + t.goalDifference * 1000 + t.points * 1000000);

const teamStatsGameReducer = (team: string) => (tempTeamStats: TeamStats, game: Game) => {
  const gameData = (game.HomeTeam === team) ?
    calculateGameData(game.localScore || 0, game.awayScore || 0)
    : calculateGameData(game.awayScore || 0, game.localScore || 0);;
  return {
    ...tempTeamStats,
    gamesPlayed: tempTeamStats.gamesPlayed + 1,
    points: tempTeamStats.points + gameData.points,
    win: tempTeamStats.win + gameData.win,
    draw: tempTeamStats.draw + gameData.draw,
    loss: tempTeamStats.loss + gameData.loss,
    goalsFor: tempTeamStats.goalsFor + gameData.goalsFor,
    goalsAgainst: tempTeamStats.goalsAgainst + gameData.goalsAgainst,
    goalDifference: tempTeamStats.goalDifference + gameData.goalDifference
  }
}

const calculateGameData = (teamScore: number, opponentScore: number) => ({
  points: (teamScore > opponentScore) ? 3 : (teamScore === opponentScore ? 1 : 0),
  win: (teamScore > opponentScore ? 1 : 0),
  draw: (teamScore === opponentScore ? 1: 0),
  loss: (teamScore < opponentScore ? 1: 0),
  goalsFor: teamScore,
  goalsAgainst: opponentScore,
  goalDifference: teamScore-opponentScore
})

const calculatePlayoffsTeams = () => {
  const roundOf16TeamsByMatch = calculateRoundOf16TeamsByMatch();
  round_of_16.forEach(game => {
    game.CalculatedHomeTeam = roundOf16TeamsByMatch[game.MatchNumber]?.homeTeam;
    game.CalculatedAwayTeam = roundOf16TeamsByMatch[game.MatchNumber]?.awayTeam;
  })
  const roundof8andLowerTeamsByMatch = calculateRoundof8andLowerTeamsByMatch(roundOf16TeamsByMatch);
  [...round_of_eight, ...semifinals, final].forEach(game => {
    game.CalculatedHomeTeam = roundof8andLowerTeamsByMatch[game.MatchNumber]?.homeTeam;
    game.CalculatedAwayTeam = roundof8andLowerTeamsByMatch[game.MatchNumber]?.awayTeam;
  });
  third_place.CalculatedHomeTeam = roundof8andLowerTeamsByMatch[third_place.MatchNumber]?.homeTeam;
  third_place.CalculatedAwayTeam = roundof8andLowerTeamsByMatch[third_place.MatchNumber]?.awayTeam;
}

calculatePlayoffsTeams();
