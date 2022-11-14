import {Game, GameGuess, TeamStats} from "../types/definitions";
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
  points: 0,
  win: 0,
  draw: 0,
  loss: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0
}

type GameGuessDictionary = {
  [key: number]: GameGuess
};

type TeamsByMatch = { [key: number]: { homeTeam: string, awayTeam: string } }

/**
 *
 * @param gameGuesses - user guesses or null to calculate based on actual scores
 */
export const calculateRoundOf16TeamsByMatch = (gameGuesses?: GameGuessDictionary): TeamsByMatch => {
  const positionTeamMap = groups.reduce((tempMap, group) => {
    const groupPositions = calculateGroupPosition(
      group.teams,
      group_games.filter(game => game.Group === group.name).map(game => gameGuesses ? ({
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
const calculateRoundof8andLowerTeamsByMatch = (currentMap: { [key: number]: { homeTeam: string, awayTeam: string } }, gameGuesses?: GameGuessDictionary): TeamsByMatch => {
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
  const teamStats: TeamStats[] = teams.map(team => {
    return gamesWithScores.filter(game => game.HomeTeam === team || game.AwayTeam === team)
      .reduce(teamStatsGameReducer(team), { ...initialTeamStats, team })
    }).sort(teamStatsComparator)
  return teamStats;
}

const teamStatsComparator = (a: TeamStats, b: TeamStats): number => {
  const comparator = getMagicNumber(b) - getMagicNumber(a);
  if (comparator === 0) {
    //Do something to compare with games, may be complex if more than two teams tied here
  }
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
