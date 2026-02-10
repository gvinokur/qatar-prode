import {ExtendedGameData, ExtendedGroupData, ExtendedPlayoffRoundData} from "../definitions";
import {Game, GameGuess, GameGuessNew, GameResultNew, GroupFinishRule, TeamStats} from "../db/tables-definition";
import {calculateGroupPosition, GameWithResultOrGuess, genericTeamStatsComparator} from "./group-position-calculator";
import {isTeamWinnerRule} from "./playoffs-rule-helper";
import {getGuessLoser, getGuessWinner} from "./score-utils";
import {getThirdPlaceRulesMapForTournament} from "../db/tournament-third-place-rules-repository";
import {groupCompleteReducer} from "./team-stats-utils";

export async function calculatePlayoffTeams(
  tournamentId: string,
  firstPlayoffStage: ExtendedPlayoffRoundData,
  groups: ExtendedGroupData[],
  gamesMap: {[k:string]: Game},
  gameResultsMap: {[k:string]: GameResultNew},
  gameGuessesMap: {[k:string]: GameGuess}
) {
  // Calculate all groups based on either all Results if they are available or all guesses
  const groupTableMap = Object.fromEntries(
    groups.map(group => {
      const gamesWithResult: GameWithResultOrGuess[] = group
        .games
        .filter(({game_id}) =>
          (!!gameResultsMap[game_id] &&
            Number.isInteger(gameResultsMap[game_id].home_score) &&
            Number.isInteger(gameResultsMap[game_id].away_score)))
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
        groupPositions = calculateGroupPosition(
          group.teams.map(({team_id}) => team_id),
          allGamesWithResult ? gamesWithResult : gamesWithGuess,
          group.sort_by_games_between_teams
        )
      }
      const positionsMap = Object.fromEntries(
        groupPositions.map((teamStat, index) => [index+1, teamStat]))

      return [group.group_letter.toUpperCase(), positionsMap]
    }))

  const thirdPlaceTeamRules: string[] =[]

  firstPlayoffStage.games.forEach(({game_id}) => {
    const game = gamesMap[game_id]
    const homeRule = game.home_team_rule as GroupFinishRule
    const awayRule = game.away_team_rule as GroupFinishRule
    if (homeRule.position === 3) {
      thirdPlaceTeamRules.push(homeRule.group)
    }
    if(awayRule.position === 3) {
      thirdPlaceTeamRules.push(awayRule.group)
    }
  })

  let thirdPlaceGroupMap: {[k:string]: string} = {}

  if (thirdPlaceTeamRules) {
    type ThirdPositionTeamTuple = [string, TeamStats]

    const thirdTeams = Object.entries(groupTableMap).map(([groupLetter, positionsMap]) => {
      const thirdPositionTeam = positionsMap[3]
      return [groupLetter, thirdPositionTeam] as ThirdPositionTeamTuple
    })
      .filter(([, thirdPositionTeam]) => !!thirdPositionTeam)
      .sort((a, b) => {
        const teamAStats = a[1]
        const teamBStats = b[1]
        return genericTeamStatsComparator(teamAStats, teamBStats);
      })

    //Wait until all groups are finished to make this calculation.
    if(thirdTeams.length === groups.length) {
      const topThirdTeams = thirdTeams.filter((value, index) => index < thirdPlaceTeamRules.length)
      const topThirdTeamGroups = topThirdTeams.map(([letter, ]) => letter).sort((a, b) => a.localeCompare(b))
      const combinationKey = topThirdTeamGroups.join('')

      // Fetch rules from database, with fallback to legacy hardcoded rules
      const tournamentRules = await getThirdPlaceRulesMapForTournament(tournamentId);
      if (Object.keys(tournamentRules).length > 0) {
        thirdPlaceGroupMap = tournamentRules[combinationKey] || {};
      } else {
        // Fallback to legacy hardcoded rules for backward compatibility
        thirdPlaceGroupMap = LEGACY_RULES_BY_CHAMPIONSHIP[''][combinationKey] || {};
      }
    }
  }

  const calculatedTeamsPerGame = Object.fromEntries(firstPlayoffStage.games.map(({game_id}) => {
    const game = gamesMap[game_id]
    const homeRule = game.home_team_rule as GroupFinishRule
    const awayRule = game.away_team_rule as GroupFinishRule
    let homeGroup = homeRule.group.toUpperCase()
    let awayGroup = awayRule.group.toUpperCase()
    if(homeRule.position === 3) {
      homeGroup = thirdPlaceGroupMap[homeGroup]
    }
    if(awayRule.position === 3) {
      awayGroup = thirdPlaceGroupMap[awayGroup]
    }

    const homeTeam = groupTableMap?.[homeGroup]?.[homeRule.position]
    const awayTeam = groupTableMap?.[awayGroup]?.[awayRule.position]

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

// Calculate the teams for the playoff games based on the positions of the teams in the groups
// If the group is not complete, it returns undefined for the specific team/game
export async function calculatePlayoffTeamsFromPositions(
  tournamentId: string,
  firstPlayoffStage: ExtendedPlayoffRoundData,
  gamesMap: {[k:string]: Game},
  positionsByGroup: {[group_letter: string]: TeamStats[]}
) {
  // Keep only groups that are complete
  const groupTableMap = Object.fromEntries(
    Object.entries(positionsByGroup).filter(([_, teamPositions]) => {
      //How do I know all games where played?
      return groupCompleteReducer(teamPositions)
    }))

  const thirdPlaceTeamRules: string[] =[]

  firstPlayoffStage.games.forEach(({game_id}) => {
    const game = gamesMap[game_id]
    const homeRule = game.home_team_rule as GroupFinishRule
    const awayRule = game.away_team_rule as GroupFinishRule
    if (homeRule.position === 3) {
      thirdPlaceTeamRules.push(homeRule.group)
    }
    if(awayRule.position === 3) {
      thirdPlaceTeamRules.push(awayRule.group)
    }
  })

  let thirdPlaceGroupMap: {[k:string]: string} = {}

  if (thirdPlaceTeamRules) {
    type ThirdPositionTeamTuple = [string, TeamStats]

    const thirdTeams = Object.entries(groupTableMap).map(([groupLetter, positionsMap]) => {
      const thirdPositionTeam = positionsMap[2] // 0-indexed: position 3 is at index 2
      return [groupLetter, thirdPositionTeam] as ThirdPositionTeamTuple
    })
      .filter(([, thirdPositionTeam]) => !!thirdPositionTeam)
      .sort((a, b) => {
        const teamAStats = a[1]
        const teamBStats = b[1]
        return genericTeamStatsComparator(teamAStats, teamBStats);
      })
    //Wait until all groups are finished to make this calculation.
    if(thirdTeams.length === Object.keys(positionsByGroup).length) {
      const topThirdTeams = thirdTeams.filter((value, index) => index < thirdPlaceTeamRules.length)
      const topThirdTeamGroups = topThirdTeams.map(([letter, ]) => letter).sort((a, b) => a.localeCompare(b))
      const combinationKey = topThirdTeamGroups.join('')

      // Fetch rules from database, with fallback to legacy hardcoded rules
      const tournamentRules = await getThirdPlaceRulesMapForTournament(tournamentId);
      if (Object.keys(tournamentRules).length > 0) {
        thirdPlaceGroupMap = tournamentRules[combinationKey] || {};
      } else {
        // Fallback to legacy hardcoded rules for backward compatibility
        thirdPlaceGroupMap = LEGACY_RULES_BY_CHAMPIONSHIP[''][combinationKey] || {};
      }
    }
  }

  const calculatedTeamsPerGame = Object.fromEntries(firstPlayoffStage.games.map(({game_id}) => {
    const game = gamesMap[game_id]
    const homeRule = game.home_team_rule as GroupFinishRule
    const awayRule = game.away_team_rule as GroupFinishRule
    let homeGroup = homeRule.group.toUpperCase()
    let awayGroup = awayRule.group.toUpperCase()
    if(homeRule.position === 3) {
      homeGroup = thirdPlaceGroupMap[homeGroup]
    }
    if(awayRule.position === 3) {
      awayGroup = thirdPlaceGroupMap[awayGroup]
    }

    const homeTeam = groupTableMap?.[homeGroup]?.[homeRule.position - 1]
    const awayTeam = groupTableMap?.[awayGroup]?.[awayRule.position - 1]

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

type Rules = {[k:string]: {[k:string]: string}}

// Re-export groupCompleteReducer for backwards compatibility
export { groupCompleteReducer } from './team-stats-utils';

/**
 * Legacy hardcoded third-place assignment rules for EURO format (6 groups, 4 third-place qualifiers)
 * Kept for backward compatibility with existing tournaments
 * New tournaments should use database-stored rules instead
 */
const LEGACY_RULES_BY_CHAMPIONSHIP: {[k: string]: Rules} =
  {
  '': {
    'ABCD': {
      'A/D/E/F': 'A',
      'D/E/F': 'D',
      'A/B/C/D': 'B',
      'A/B/C': 'C'
    },
    'ABCE': {
      'A/D/E/F': 'A',
      'D/E/F': 'E',
      'A/B/C/D': 'B',
      'A/B/C': 'C'
    },
    'ABCF': {
      'A/D/E/F': 'A',
      'D/E/F': 'F',
      'A/B/C/D': 'B',
      'A/B/C': 'C'
    },
    'ABDE': {
      'A/D/E/F': 'D',
      'D/E/F': 'E',
      'A/B/C/D': 'A',
      'A/B/C': 'B'
    },
    'ABDF': {
      'A/D/E/F': 'D',
      'D/E/F': 'F',
      'A/B/C/D': 'A',
      'A/B/C': 'B'
    },
    'ABEF': {
      'A/D/E/F': 'E',
      'D/E/F': 'F',
      'A/B/C/D': 'B',
      'A/B/C': 'A'
    },
    'ACDE': {
      'A/D/E/F': 'E',
      'D/E/F': 'D',
      'A/B/C/D': 'C',
      'A/B/C': 'A'
    },
    'ACDF': {
      'A/D/E/F': 'F',
      'D/E/F': 'D',
      'A/B/C/D': 'C',
      'A/B/C': 'A'
    },
    'ACEF': {
      'A/D/E/F': 'E',
      'D/E/F': 'F',
      'A/B/C/D': 'C',
      'A/B/C': 'A'
    },
    'ADEF': {
      'A/D/E/F': 'E',
      'D/E/F': 'F',
      'A/B/C/D': 'D',
      'A/B/C': 'A'
    },
    'BCDE': {
      'A/D/E/F': 'E',
      'D/E/F': 'D',
      'A/B/C/D': 'B',
      'A/B/C': 'C'
    },
    'BCDF': {
      'A/D/E/F': 'F',
      'D/E/F': 'D',
      'A/B/C/D': 'C',
      'A/B/C': 'B'
    },
    'BCEF': {
      'A/D/E/F': 'F',
      'D/E/F': 'E',
      'A/B/C/D': 'C',
      'A/B/C': 'B'
    },
    'BDEF': {
      'A/D/E/F': 'F',
      'D/E/F': 'E',
      'A/B/C/D': 'D',
      'A/B/C': 'B'
    },
    'CDEF': {
      'A/D/E/F': 'F',
      'D/E/F': 'E',
      'A/B/C/D': 'D',
      'A/B/C': 'C'
    },
  }
}

export function calculateTeamNamesForPlayoffGame(isPlayoffGame: boolean, game: ExtendedGameData, gameGuesses: {
  [k: string]: GameGuessNew
}, gamesMap: {
  [p: string]: Game
} | undefined) {
  /**
   * Recalculate the home and away teams for playoffs of rounds below the first playoff round every time
   * a guess in the playoffs change.
   * Only do this before the games have been played and an actual team exists.
   */
  if (isPlayoffGame && !game.home_team && !game.away_team
    && isTeamWinnerRule(game.home_team_rule) && isTeamWinnerRule(game.away_team_rule)) {
    let homeTeam
    let awayTeam

    const homeTeamRule = game.home_team_rule
    const homeGameGuess = Object.values(gameGuesses)
      .find(guess => guess.game_number === homeTeamRule.game)
    const homeGame = gamesMap && Object.values(gamesMap)
      .find(game => game.game_number === homeTeamRule.game)

    if (homeGameGuess) {
      homeTeam = homeTeamRule.winner ?
        getGuessWinner(homeGameGuess,
          homeGame?.home_team || homeGameGuess?.home_team,
          homeGame?.away_team || homeGameGuess?.away_team) :
        getGuessLoser(homeGameGuess,
          homeGame?.home_team || homeGameGuess?.home_team,
          homeGame?.away_team || homeGameGuess?.away_team)
    }

    const awayTeamRule = game.away_team_rule
    const awayGameGuess = Object.values(gameGuesses)
      .find(guess => guess.game_number === awayTeamRule.game)
    const awayGame = gamesMap && Object.values(gamesMap)
      .find(game => game.game_number === awayTeamRule.game)

    if (awayGameGuess) {
      awayTeam = awayTeamRule.winner ?
        getGuessWinner(awayGameGuess,
          awayGame?.home_team || awayGameGuess?.home_team,
          awayGame?.away_team || awayGameGuess?.away_team) :
        getGuessLoser(awayGameGuess,
          awayGame?.home_team || awayGameGuess?.home_team,
          awayGame?.away_team || awayGameGuess?.away_team)
    }
    return {
      homeTeam,
      awayTeam
    }
  }
}
