import {Game, GameGuessNew, GameResultNew, TeamStats} from "../db/tables-definition";
import {getGameWinner, getWinner} from "./score-utils";

const initialTeamStats: TeamStats = {
  team_id: '',
  games_played: 0,
  points: 0,
  win: 0,
  draw: 0,
  loss: 0,
  goals_for: 0,
  goals_against: 0,
  goal_difference: 0,
  is_complete: false
}

export interface GameWithResultOrGuess extends Game{
  resultOrGuess?: GameResultNew | GameGuessNew
}

/**
*
* @param teamIds - The Ids of the 4 teams of a given group
* @param games - Games played by the 4 teams of the group, with the scores filled
*/
export const calculateGroupPosition = (teamIds: string[], games: GameWithResultOrGuess[], sortByGamesBetweenTeams = false): TeamStats[] => {
  const gamesWithScores = games.filter(game =>
    (Number.isInteger(game.resultOrGuess?.home_score) && Number.isInteger(game.resultOrGuess?.away_score)))

  const isComplete = gamesWithScores.length === games.length

  const teamsStatsByTeam = Object.fromEntries(teamIds.map(teamId => [
    teamId,
    gamesWithScores.filter(game => game.home_team === teamId|| game.away_team === teamId)
      .reduce(teamStatsGameReducer(teamId), { ...initialTeamStats, team_id: teamId, is_complete: isComplete })
  ]))

  //Depending on the tournament rules, we may need to calculate differently how teams with the same points are sorted
  const teamStats: TeamStats[] = Object.values(teamsStatsByTeam)
    .sort(sortByGamesBetweenTeams ? pointsBasesTeamStatsComparator : genericTeamStatsComparator)

  //TODO: cannot do anything more right now about 4 way ties if !sortByGameBetweenTeams
  // But if there is a four way tie when calculating by games between teams, then the proper thing to do
  // is to recalculate the group as we would normally do, fully based on stats.
  if(sortByGamesBetweenTeams) {
    const allSamePoints = teamStats.every(teamStat => teamStat.points === teamStats[0].points)

    if(allSamePoints) {
      return calculateGroupPosition(teamIds, games, false)
    }
  }

  let threeWayTie = false
  //Three way ties
  if (teamStats.length === 4) {
    const equals = sortByGamesBetweenTeams ? pointsBasedTeamStatsEquals : genericTeamStatsEquals
    const topThreeWayTie = equals(teamStats[0], teamStats[1]) && equals(teamStats[1], teamStats[2])
    const bottomThreeWayTie = equals(teamStats[1], teamStats[2]) && equals(teamStats[2], teamStats[3])
    threeWayTie = topThreeWayTie || bottomThreeWayTie
    if(threeWayTie) {
      //Three way ties
      // Among the top 3 teams
      const baseIndex = topThreeWayTie  ? 0 : 1
      const tiedTeams = teamStats.slice(baseIndex, baseIndex + 3).map(teamStat => teamStat.team_id)
      const tiedTeamGames = games.filter(game =>
        tiedTeams.includes(game.home_team as string) && tiedTeams.includes(game.away_team as string));
      const threeWayTieStats = calculateGroupPosition(tiedTeams, tiedTeamGames, sortByGamesBetweenTeams).sort(genericTeamStatsComparator);

      threeWayTieStats.forEach((teamStat, index) => {
        teamStats[baseIndex + index] = teamsStatsByTeam[teamStat.team_id]
      })
    }
  }
  if (!threeWayTie) {
    for(let i = 0; i < teamStats.length - 1; i++) {
      const equals = sortByGamesBetweenTeams ? pointsBasedTeamStatsEquals : genericTeamStatsEquals
      if(equals(teamStats[i], teamStats[i+1])) {
        const tiedTeams = [teamStats[i].team_id, teamStats[i+1].team_id];
        const teamsGame = games.find(game =>
          tiedTeams.includes(game.home_team as string) && tiedTeams.includes(game.away_team as string));
        const winnerTeam = getWinner(teamsGame?.resultOrGuess?.home_score,
          teamsGame?.resultOrGuess?.away_score,
          undefined,
          undefined,
          teamsGame?.home_team,
          teamsGame?.away_team)
        //First sort by matches played between the 2 teams
        if (winnerTeam && winnerTeam != teamStats[i].team_id) {
          const temp = teamStats[i]
          teamStats[i] = teamStats[i+1];
          teamStats[i+1] = temp
        } else if (!winnerTeam && sortByGamesBetweenTeams) {
          // If there was no winner, and I haven't yet sorted by stats, sort by stats.
          if (genericTeamStatsComparator(teamStats[i], teamStats[i + 1]) > 0) {
            const temp = teamStats[i]
            teamStats[i] = teamStats[i + 1];
            teamStats[i + 1] = temp
          }
        }
      }
    }
  }

  return teamStats;
}

/**
 *
 * @param teamId
 */
const teamStatsGameReducer = (teamId: string) => (tempTeamStats: TeamStats, game: GameWithResultOrGuess) => {
  const gameData = (game.home_team === teamId) ?
    calculateGameData(game.resultOrGuess?.home_score || 0, game.resultOrGuess?.away_score || 0)
    : calculateGameData(game.resultOrGuess?.away_score || 0, game.resultOrGuess?.home_score || 0);;
  return {
    ...tempTeamStats,
    games_played: tempTeamStats.games_played + 1,
    points: tempTeamStats.points + gameData.points,
    win: tempTeamStats.win + gameData.win,
    draw: tempTeamStats.draw + gameData.draw,
    loss: tempTeamStats.loss + gameData.loss,
    goals_for: tempTeamStats.goals_for + gameData.goals_for,
    goals_against: tempTeamStats.goals_against + gameData.goals_against,
    goal_difference: tempTeamStats.goal_difference + gameData.goal_difference
  }
}

const calculateGameData = (teamScore: number, opponentScore: number) => ({
  points: (teamScore > opponentScore) ? 3 : (teamScore === opponentScore ? 1 : 0),
  win: (teamScore > opponentScore ? 1 : 0),
  draw: (teamScore === opponentScore ? 1: 0),
  loss: (teamScore < opponentScore ? 1: 0),
  goals_for: teamScore,
  goals_against: opponentScore,
  goal_difference: teamScore-opponentScore
})

const genericTeamStatsEquals = (a: TeamStats, b: TeamStats): boolean => getMagicNumber(a) === getMagicNumber(b)

const pointsBasedTeamStatsEquals = (a: TeamStats, b: TeamStats): boolean => a.points === b.points

/**
 * Sort teams by their whole stats as it's customary in tournaments
 * @param a
 * @param b
 */
export const genericTeamStatsComparator = (a: TeamStats, b: TeamStats): number => {
  const comparator = getMagicNumber(b) - getMagicNumber(a);
  return comparator;
}

/**
 * A first pass comparator that uses only the points to sort teams
 * @param a
 * @param b
 */
export const pointsBasesTeamStatsComparator = (a: TeamStats, b: TeamStats): number => {
  const comparator = b.points - a.points;
  return comparator;
}

const getMagicNumber = (t: TeamStats) =>
  (t.goals_for + t.goal_difference * 1000 + t.points * 1000000);
