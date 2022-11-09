import {Game, TeamStats} from "../types/definitions";

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

/**
 *
 * @param teams - Names of the 4 teams of a given group
 * @param games - Games played by the 4 teams of the group, with the scores filled
 */
export const calculateGroupPosition = (teams: string[], games: Game[]) => {
  const gamesWithScores = games.filter(game => (game.HomeTeamScore !== null && game.AwayTeamScore !== null))
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
    calculateGameData(game.HomeTeamScore || 0, game.AwayTeamScore || 0)
    : calculateGameData(game.AwayTeamScore || 0, game.HomeTeamScore || 0);;
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
