import {Game, GameGuessNew, GameResultNew, TeamStats} from "../db/tables-definition";
import { getWinner} from "./score-utils";

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
  conduct_score: 0,
  is_complete: false
}

export interface GameWithResultOrGuess extends Game{
  resultOrGuess?: GameResultNew | GameGuessNew | null
}

/**
* Calculates the relative positions of a team in a group based on the games played between them.
 *
* @param teamIds - The Ids of the 4 teams of a given group
* @param games - Games played by the 4 teams of the group, with the scores filled
* @param conductScores - Optional map of team_id to conduct_score; missing keys default to 0
*/
export const calculateGroupPosition = (teamIds: string[], games: GameWithResultOrGuess[], sortByGamesBetweenTeams = false, conductScores: Record<string, number> = {}): TeamStats[] => {
  const gamesWithScores = games.filter(game =>
    (Number.isInteger(game.resultOrGuess?.home_score) && Number.isInteger(game.resultOrGuess?.away_score)))

  const isComplete = gamesWithScores.length === games.length

  const teamsStatsByTeam = Object.fromEntries(teamIds.map(teamId => [
    teamId,
    gamesWithScores.filter(game => game.home_team === teamId|| game.away_team === teamId)
      .reduce(teamStatsGameReducer(teamId), { ...initialTeamStats, team_id: teamId, is_complete: isComplete, conduct_score: conductScores[teamId] ?? 0 })
  ]))

  //Depending on the tournament rules, we may need to calculate differently how teams with the same points are sorted
  const teamStats: TeamStats[] = Object.values(teamsStatsByTeam)
    .sort(sortByGamesBetweenTeams ? pointsBasesTeamStatsComparator : genericTeamStatsComparator)

  //TODO: cannot do anything more right now about 4 way ties if !sortByGameBetweenTeams
  // But if there is a four way tie when calculating by games between teams, then the proper thing to do
  // is to recalculate the group as we would normally do, fully based on stats.
  if(sortByGamesBetweenTeams && teamStats.every(teamStat => teamStat.points === teamStats[0].points)) {
    return calculateGroupPosition(teamIds, games, false, conductScores)
  }

  const threeWayTie = resolveThreeWayTie(teamStats, teamsStatsByTeam, games, sortByGamesBetweenTeams, conductScores)

  if (!threeWayTie) {
    resolveTwoWayTies(teamStats, games, sortByGamesBetweenTeams)
  }

  return teamStats;
}

const resolveThreeWayTie = (
  teamStats: TeamStats[],
  teamsStatsByTeam: Record<string, TeamStats>,
  games: GameWithResultOrGuess[],
  sortByGamesBetweenTeams: boolean,
  conductScores: Record<string, number>
): boolean => {
  if (teamStats.length !== 4) return false

  const equals = sortByGamesBetweenTeams ? pointsBasedTeamStatsEquals : genericTeamStatsEquals
  const topThreeWayTie = equals(teamStats[0], teamStats[1]) && equals(teamStats[1], teamStats[2])
  const bottomThreeWayTie = equals(teamStats[1], teamStats[2]) && equals(teamStats[2], teamStats[3])

  if (!topThreeWayTie && !bottomThreeWayTie) return false

  //Three way ties
  // Among the top 3 or bottom 3 teams
  const baseIndex = topThreeWayTie ? 0 : 1
  const tiedTeams = teamStats.slice(baseIndex, baseIndex + 3).map(teamStat => teamStat.team_id)
  const tiedTeamGames = games.filter(game =>
    tiedTeams.includes(game.home_team as string) && tiedTeams.includes(game.away_team as string))

  if (sortByGamesBetweenTeams) {
    // H2H mode: rank the 3 tied teams by their H2H aggregate stats (pts → GD → goals),
    // falling through to overall stats when H2H criteria are exhausted.
    //
    // Bug fix (story #443): the old code called calculateGroupPosition then immediately
    // re-sorted with genericTeamStatsComparator, which could undo 2-way tie resolution
    // done inside the recursive call when two teams had equal aggregate H2H stats.
    // The correct approach is to sort by H2H aggregate stats directly using a two-phase
    // comparator (H2H first → overall fallthrough), without a secondary sort.
    const h2hStats = calculateGroupPosition(tiedTeams, tiedTeamGames, false, conductScores)
    const h2hStatsById = Object.fromEntries(h2hStats.map(s => [s.team_id, s]))

    const sorted = tiedTeams.slice().sort((teamIdA, teamIdB) => {
      const h2hA = h2hStatsById[teamIdA]
      const h2hB = h2hStatsById[teamIdB]
      // Phase 1: H2H aggregate criteria (pts → GD → goals scored)
      if (h2hB.points !== h2hA.points) return h2hB.points - h2hA.points
      if (h2hB.goal_difference !== h2hA.goal_difference) return h2hB.goal_difference - h2hA.goal_difference
      if (h2hB.goals_for !== h2hA.goals_for) return h2hB.goals_for - h2hA.goals_for
      // Phase 2: fallthrough to overall stats (GD → goals → conduct)
      return getMagicNumber(teamsStatsByTeam[teamIdB]) - getMagicNumber(teamsStatsByTeam[teamIdA])
    })

    sorted.forEach((teamId, index) => {
      teamStats[baseIndex + index] = teamsStatsByTeam[teamId]
    })
  } else {
    // Standard mode: sort tied teams by their H2H sub-stats as a tiebreaker
    // (preserving existing behaviour)
    const threeWayTieStats = calculateGroupPosition(tiedTeams, tiedTeamGames, false, conductScores)
      .sort(genericTeamStatsComparator)

    threeWayTieStats.forEach((teamStat, index) => {
      teamStats[baseIndex + index] = teamsStatsByTeam[teamStat.team_id]
    })
  }

  return true
}

const resolveTwoWayTies = (
  teamStats: TeamStats[],
  games: GameWithResultOrGuess[],
  sortByGamesBetweenTeams: boolean
): void => {
  const equals = sortByGamesBetweenTeams ? pointsBasedTeamStatsEquals : genericTeamStatsEquals

  for(let i = 0; i < teamStats.length - 1; i++) {
    if (!equals(teamStats[i], teamStats[i+1])) continue

    const tiedTeams = new Set([teamStats[i].team_id, teamStats[i+1].team_id])
    const teamsGame = games.find(game =>
      tiedTeams.has(game.home_team as string) && tiedTeams.has(game.away_team as string))
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

/**
 * Calculate a magic number for team sorting based on FIFA tiebreaker rules:
 * 1. Points (most important)
 * 2. Goal difference
 * 3. Goals for
 * 4. Conduct score (lower is better, so we subtract it)
 * 5. FIFA ranking (not implemented)
 *
 * Weight hierarchy: 10M points > 10K goal diff > 100 goals for > 1 conduct score
 * This ensures conduct_score can never override goals_for even at high values
 */
const getMagicNumber = (t: TeamStats) =>
  (t.points * 10000000 + t.goal_difference * 10000 + t.goals_for * 100 - (t.conduct_score || 0));
