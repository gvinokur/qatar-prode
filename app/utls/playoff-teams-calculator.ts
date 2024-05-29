import {ExtendedGroupData, ExtendedPlayoffRoundData, TeamStats} from "../definitions";
import {Game, GameGuess, GameResult, GroupFinishRule} from "../db/tables-definition";
import {string} from "prop-types";
import {calculateGroupPosition, GameWithResultOrGuess} from "./group-position-calculator";

export function calculatePlayoffTeams(
  firstPlayoffStage: ExtendedPlayoffRoundData,
  groups: ExtendedGroupData[],
  gamesMap: {[k:string]: Game},
  gameResultsMap: {[k:string]: GameResult},
  gameGuessesMap: {[k:string]: GameGuess}
) {
  // Calculate all groups based on either all Results if they are available or all guesses
  const groupTableMap = Object.fromEntries(
    groups.map(group => {
      const gamesWithResult: GameWithResultOrGuess[] = group
        .games
        .filter(({game_id}) => !!gameResultsMap[game_id])
        .map(({game_id}) => ({
          ...gamesMap[game_id],
          resultOrGuess: gameResultsMap[game_id]
        }))

      const gamesWithGuess: GameWithResultOrGuess[] = group
        .games
        .filter(({game_id}) => !!gameGuessesMap[game_id])
        .map(({game_id}) => ({
          ...gamesMap[game_id],
          resultOrGuess: gameGuessesMap[game_id]
        }))

      const allGamesWithResult = gamesWithResult.length === group.games.length

      const allGamesWithGuesses = gamesWithGuess.length === group.games.length

      let groupPositions:TeamStats[] = []
      if(allGamesWithGuesses || allGamesWithResult) {
        groupPositions = calculateGroupPosition(group.teams.map(({team_id}) => team_id),
          allGamesWithResult ? gamesWithResult : gamesWithGuess)
      }
      const positionsMap = Object.fromEntries(
        groupPositions.map((teamStat, index) => [index+1, teamStat]))

      return [group.group_letter.toUpperCase(), positionsMap]
    }))

  const calculatedTeamsPerGame = Object.fromEntries(firstPlayoffStage.games.map(({game_id}) => {
    const game = gamesMap[game_id]
    const homeRule = game.home_team_rule as GroupFinishRule
    const awayRule = game.away_team_rule as GroupFinishRule

    const homeTeam = groupTableMap?.[homeRule.group.toUpperCase()]?.[homeRule.position]
    const awayTeam = groupTableMap?.[awayRule.group.toUpperCase()]?.[awayRule.position]

    return [
      game_id,
      {
        game_id,
        homeTeam,
        awayTeam,
      }]
  }))

  return calculatedTeamsPerGame;
}
