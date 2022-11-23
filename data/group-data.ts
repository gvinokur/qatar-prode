import {Game, Group, GroupName} from "../types/definitions";
import {calculateRoundOf16TeamsByMatch, calculateRoundof8andLowerTeamsByMatch} from "../utils/position-calculator";
import {fetchMatchResultData} from "../services/fifa-data-service";

const groups: Group[] = [{
  name: 'Group A',
  teams: ['Qatar', 'Ecuador', 'Senegal', 'Netherlands'],
}, {
  name: 'Group B',
  teams: ['England', 'Iran', 'USA', 'Wales'],
}, {
  name: 'Group C',
  teams: ['Argentina', 'Saudi Arabia', 'Mexico', 'Poland'],
}, {
  name: 'Group D',
  teams: ['France', 'Australia', 'Denmark', 'Tunisia'],
}, {
  name: 'Group E',
  teams: ['Spain', 'Costa Rica', 'Germany', 'Japan'],
}, {
  name: 'Group F',
  teams: ['Belgium', 'Canada', 'Morocco', 'Croatia'],
}, {
  name: 'Group G',
  teams: ['Brazil', 'Serbia', 'Switzerland', 'Cameroon'],
}, {
  name: 'Group H',
  teams: ['Portugal', 'Ghana', 'Uruguay', 'Korea Republic'],
}]

const group_games: Game[] = [{
  "MatchNumber": 1,
  "RoundNumber": 1,
  "DateUtc": "2022-11-20 16:00:00Z",
  "Location": "Al Bayt Stadium",
  "HomeTeam": "Qatar",
  "AwayTeam": "Ecuador",
  "Group": "Group A",
  "localScore": 0,
  "awayScore": 2
}, {
  "MatchNumber": 3,
  "RoundNumber": 1,
  "DateUtc": "2022-11-21 13:00:00Z",
  "Location": "Khalifa International Stadium",
  "HomeTeam": "England",
  "AwayTeam": "Iran",
  "Group": "Group B",
  "localScore": 6,
  "awayScore": 2
}, {
  "MatchNumber": 2,
  "RoundNumber": 1,
  "DateUtc": "2022-11-21 16:00:00Z",
  "Location": "Al Thumama Stadium",
  "HomeTeam": "Senegal",
  "AwayTeam": "Netherlands",
  "Group": "Group A",
  "localScore": 0,
  "awayScore": 2
}, {
  "MatchNumber": 4,
  "RoundNumber": 1,
  "DateUtc": "2022-11-21 19:00:00Z",
  "Location": "Ahmad Bin Ali Stadium",
  "HomeTeam": "USA",
  "AwayTeam": "Wales",
  "Group": "Group B",
  "localScore": 1,
  "awayScore": 1
}, {
  "MatchNumber": 8,
  "RoundNumber": 1,
  "DateUtc": "2022-11-22 10:00:00Z",
  "Location": "Lusail Stadium",
  "HomeTeam": "Argentina",
  "AwayTeam": "Saudi Arabia",
  "Group": "Group C",
  "localScore": 1,
  "awayScore": 2
}, {
  "MatchNumber": 6,
  "RoundNumber": 1,
  "DateUtc": "2022-11-22 13:00:00Z",
  "Location": "Education City Stadium",
  "HomeTeam": "Denmark",
  "AwayTeam": "Tunisia",
  "Group": "Group D",
  "localScore": 0,
  "awayScore": 0
}, {
  "MatchNumber": 7,
  "RoundNumber": 1,
  "DateUtc": "2022-11-22 16:00:00Z",
  "Location": "Stadium 974",
  "HomeTeam": "Mexico",
  "AwayTeam": "Poland",
  "Group": "Group C",
  "localScore": 0,
  "awayScore": 0
}, {
  "MatchNumber": 5,
  "RoundNumber": 1,
  "DateUtc": "2022-11-22 19:00:00Z",
  "Location": "Al Janoub Stadium",
  "HomeTeam": "France",
  "AwayTeam": "Australia",
  "Group": "Group D",
  "localScore": 4,
  "awayScore": 1
}, {
  "MatchNumber": 12,
  "RoundNumber": 1,
  "DateUtc": "2022-11-23 10:00:00Z",
  "Location": "Al Bayt Stadium",
  "HomeTeam": "Morocco",
  "AwayTeam": "Croatia",
  "Group": "Group F",
  "localScore": 0,
  "awayScore": 0
}, {
  "MatchNumber": 11,
  "RoundNumber": 1,
  "DateUtc": "2022-11-23 13:00:00Z",
  "Location": "Khalifa International Stadium",
  "HomeTeam": "Germany",
  "AwayTeam": "Japan",
  "Group": "Group E",
  "localScore": 1,
  "awayScore": 2
}, {
  "MatchNumber": 10,
  "RoundNumber": 1,
  "DateUtc": "2022-11-23 16:00:00Z",
  "Location": "Al Thumama Stadium",
  "HomeTeam": "Spain",
  "AwayTeam": "Costa Rica",
  "Group": "Group E",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 9,
  "RoundNumber": 1,
  "DateUtc": "2022-11-23 19:00:00Z",
  "Location": "Ahmad Bin Ali Stadium",
  "HomeTeam": "Belgium",
  "AwayTeam": "Canada",
  "Group": "Group F",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 13,
  "RoundNumber": 1,
  "DateUtc": "2022-11-24 10:00:00Z",
  "Location": "Al Janoub Stadium",
  "HomeTeam": "Switzerland",
  "AwayTeam": "Cameroon",
  "Group": "Group G",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 14,
  "RoundNumber": 1,
  "DateUtc": "2022-11-24 13:00:00Z",
  "Location": "Education City Stadium",
  "HomeTeam": "Uruguay",
  "AwayTeam": "Korea Republic",
  "Group": "Group H",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 15,
  "RoundNumber": 1,
  "DateUtc": "2022-11-24 16:00:00Z",
  "Location": "Stadium 974",
  "HomeTeam": "Portugal",
  "AwayTeam": "Ghana",
  "Group": "Group H",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 16,
  "RoundNumber": 1,
  "DateUtc": "2022-11-24 19:00:00Z",
  "Location": "Lusail Stadium",
  "HomeTeam": "Brazil",
  "AwayTeam": "Serbia",
  "Group": "Group G",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 17,
  "RoundNumber": 2,
  "DateUtc": "2022-11-25 10:00:00Z",
  "Location": "Ahmad Bin Ali Stadium",
  "HomeTeam": "Wales",
  "AwayTeam": "Iran",
  "Group": "Group B",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 18,
  "RoundNumber": 2,
  "DateUtc": "2022-11-25 13:00:00Z",
  "Location": "Al Thumama Stadium",
  "HomeTeam": "Qatar",
  "AwayTeam": "Senegal",
  "Group": "Group A",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 19,
  "RoundNumber": 2,
  "DateUtc": "2022-11-25 16:00:00Z",
  "Location": "Khalifa International Stadium",
  "HomeTeam": "Netherlands",
  "AwayTeam": "Ecuador",
  "Group": "Group A",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 20,
  "RoundNumber": 2,
  "DateUtc": "2022-11-25 19:00:00Z",
  "Location": "Al Bayt Stadium",
  "HomeTeam": "England",
  "AwayTeam": "USA",
  "Group": "Group B",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 21,
  "RoundNumber": 2,
  "DateUtc": "2022-11-26 10:00:00Z",
  "Location": "Al Janoub Stadium",
  "HomeTeam": "Tunisia",
  "AwayTeam": "Australia",
  "Group": "Group D",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 22,
  "RoundNumber": 2,
  "DateUtc": "2022-11-26 13:00:00Z",
  "Location": "Education City Stadium",
  "HomeTeam": "Poland",
  "AwayTeam": "Saudi Arabia",
  "Group": "Group C",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 23,
  "RoundNumber": 2,
  "DateUtc": "2022-11-26 16:00:00Z",
  "Location": "Stadium 974",
  "HomeTeam": "France",
  "AwayTeam": "Denmark",
  "Group": "Group D",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 24,
  "RoundNumber": 2,
  "DateUtc": "2022-11-26 19:00:00Z",
  "Location": "Lusail Stadium",
  "HomeTeam": "Argentina",
  "AwayTeam": "Mexico",
  "Group": "Group C",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 25,
  "RoundNumber": 2,
  "DateUtc": "2022-11-27 10:00:00Z",
  "Location": "Ahmad Bin Ali Stadium",
  "HomeTeam": "Japan",
  "AwayTeam": "Costa Rica",
  "Group": "Group E",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 26,
  "RoundNumber": 2,
  "DateUtc": "2022-11-27 13:00:00Z",
  "Location": "Al Thumama Stadium",
  "HomeTeam": "Belgium",
  "AwayTeam": "Morocco",
  "Group": "Group F",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 27,
  "RoundNumber": 2,
  "DateUtc": "2022-11-27 16:00:00Z",
  "Location": "Khalifa International Stadium",
  "HomeTeam": "Croatia",
  "AwayTeam": "Canada",
  "Group": "Group F",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 28,
  "RoundNumber": 2,
  "DateUtc": "2022-11-27 19:00:00Z",
  "Location": "Al Bayt Stadium",
  "HomeTeam": "Spain",
  "AwayTeam": "Germany",
  "Group": "Group E",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 29,
  "RoundNumber": 2,
  "DateUtc": "2022-11-28 10:00:00Z",
  "Location": "Al Janoub Stadium",
  "HomeTeam": "Cameroon",
  "AwayTeam": "Serbia",
  "Group": "Group G",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 30,
  "RoundNumber": 2,
  "DateUtc": "2022-11-28 13:00:00Z",
  "Location": "Education City Stadium",
  "HomeTeam": "Korea Republic",
  "AwayTeam": "Ghana",
  "Group": "Group H",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 31,
  "RoundNumber": 2,
  "DateUtc": "2022-11-28 16:00:00Z",
  "Location": "Stadium 974",
  "HomeTeam": "Brazil",
  "AwayTeam": "Switzerland",
  "Group": "Group G",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 32,
  "RoundNumber": 2,
  "DateUtc": "2022-11-28 19:00:00Z",
  "Location": "Lusail Stadium",
  "HomeTeam": "Portugal",
  "AwayTeam": "Uruguay",
  "Group": "Group H",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 35,
  "RoundNumber": 3,
  "DateUtc": "2022-11-29 15:00:00Z",
  "Location": "Khalifa International Stadium",
  "HomeTeam": "Ecuador",
  "AwayTeam": "Senegal",
  "Group": "Group A",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 36,
  "RoundNumber": 3,
  "DateUtc": "2022-11-29 15:00:00Z",
  "Location": "Al Bayt Stadium",
  "HomeTeam": "Netherlands",
  "AwayTeam": "Qatar",
  "Group": "Group A",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 33,
  "RoundNumber": 3,
  "DateUtc": "2022-11-29 19:00:00Z",
  "Location": "Ahmad Bin Ali Stadium",
  "HomeTeam": "Wales",
  "AwayTeam": "England",
  "Group": "Group B",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 34,
  "RoundNumber": 3,
  "DateUtc": "2022-11-29 19:00:00Z",
  "Location": "Al Thumama Stadium",
  "HomeTeam": "Iran",
  "AwayTeam": "USA",
  "Group": "Group B",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 37,
  "RoundNumber": 3,
  "DateUtc": "2022-11-30 15:00:00Z",
  "Location": "Al Janoub Stadium",
  "HomeTeam": "Australia",
  "AwayTeam": "Denmark",
  "Group": "Group D",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 38,
  "RoundNumber": 3,
  "DateUtc": "2022-11-30 15:00:00Z",
  "Location": "Education City Stadium",
  "HomeTeam": "Tunisia",
  "AwayTeam": "France",
  "Group": "Group D",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 39,
  "RoundNumber": 3,
  "DateUtc": "2022-11-30 19:00:00Z",
  "Location": "Stadium 974",
  "HomeTeam": "Poland",
  "AwayTeam": "Argentina",
  "Group": "Group C",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 40,
  "RoundNumber": 3,
  "DateUtc": "2022-11-30 19:00:00Z",
  "Location": "Lusail Stadium",
  "HomeTeam": "Saudi Arabia",
  "AwayTeam": "Mexico",
  "Group": "Group C",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 41,
  "RoundNumber": 3,
  "DateUtc": "2022-12-01 15:00:00Z",
  "Location": "Ahmad Bin Ali Stadium",
  "HomeTeam": "Croatia",
  "AwayTeam": "Belgium",
  "Group": "Group F",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 42,
  "RoundNumber": 3,
  "DateUtc": "2022-12-01 15:00:00Z",
  "Location": "Al Thumama Stadium",
  "HomeTeam": "Canada",
  "AwayTeam": "Morocco",
  "Group": "Group F",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 43,
  "RoundNumber": 3,
  "DateUtc": "2022-12-01 19:00:00Z",
  "Location": "Khalifa International Stadium",
  "HomeTeam": "Japan",
  "AwayTeam": "Spain",
  "Group": "Group E",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 44,
  "RoundNumber": 3,
  "DateUtc": "2022-12-01 19:00:00Z",
  "Location": "Al Bayt Stadium",
  "HomeTeam": "Costa Rica",
  "AwayTeam": "Germany",
  "Group": "Group E",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 45,
  "RoundNumber": 3,
  "DateUtc": "2022-12-02 15:00:00Z",
  "Location": "Al Janoub Stadium",
  "HomeTeam": "Ghana",
  "AwayTeam": "Uruguay",
  "Group": "Group H",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 46,
  "RoundNumber": 3,
  "DateUtc": "2022-12-02 15:00:00Z",
  "Location": "Education City Stadium",
  "HomeTeam": "Korea Republic",
  "AwayTeam": "Portugal",
  "Group": "Group H",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 47,
  "RoundNumber": 3,
  "DateUtc": "2022-12-02 19:00:00Z",
  "Location": "Stadium 974",
  "HomeTeam": "Serbia",
  "AwayTeam": "Switzerland",
  "Group": "Group G",
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 48,
  "RoundNumber": 3,
  "DateUtc": "2022-12-02 19:00:00Z",
  "Location": "Lusail Stadium",
  "HomeTeam": "Cameroon",
  "AwayTeam": "Brazil",
  "Group": "Group G",
  "localScore": null,
  "awayScore": null
}]

const round_of_16: Game[] = [{
  "MatchNumber": 49,
  "RoundNumber": 4,
  "DateUtc": "2022-12-03 15:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1A",
  "AwayTeam": "2B",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 50,
  "RoundNumber": 4,
  "DateUtc": "2022-12-03 19:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1C",
  "AwayTeam": "2D",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 52,
  "RoundNumber": 4,
  "DateUtc": "2022-12-04 15:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1D",
  "AwayTeam": "2C",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 51,
  "RoundNumber": 4,
  "DateUtc": "2022-12-04 19:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1B",
  "AwayTeam": "2A",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 53,
  "RoundNumber": 4,
  "DateUtc": "2022-12-05 15:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1E",
  "AwayTeam": "2F",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 54,
  "RoundNumber": 4,
  "DateUtc": "2022-12-05 19:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1G",
  "AwayTeam": "2H",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 55,
  "RoundNumber": 4,
  "DateUtc": "2022-12-06 15:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1F",
  "AwayTeam": "2E",
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 56,
  "RoundNumber": 4,
  "DateUtc": "2022-12-06 19:00:00Z",
  "Location": "TBA",
  "HomeTeam": "1H",
  "AwayTeam": "2G",
  "Group": null,
  "localScore": null,
  "awayScore": null
}].map(game => ({
  ...game,
  HomeTeam: {
    group: `Group ${game.HomeTeam.charAt(1)}` as GroupName,
    position: Number.parseInt(game.HomeTeam.charAt(0))
  },
  AwayTeam: {
    group: `Group ${game.AwayTeam.charAt(1)}` as GroupName,
    position: Number.parseInt(game.AwayTeam.charAt(0))
  }
}))

const round_of_eight:Game[] = [
  {
    "MatchNumber": 58,
    "RoundNumber": 5,
    "DateUtc": "2022-12-09 15:00:00Z",
    "Location": "TBA",
    "HomeTeam": 49,
    "AwayTeam": 50,
    "Group": null,
    "localScore": null,
    "awayScore": null
  }, {
    "MatchNumber": 57,
    "RoundNumber": 5,
    "DateUtc": "2022-12-09 19:00:00Z",
    "Location": "TBA",
    "HomeTeam": 53,
    "AwayTeam": 54,
    "Group": null,
    "localScore": null,
    "awayScore": null
  }, {
    "MatchNumber": 60,
    "RoundNumber": 5,
    "DateUtc": "2022-12-10 15:00:00Z",
    "Location": "TBA",
    "HomeTeam": 51,
    "AwayTeam": 52,
    "Group": null,
    "localScore": null,
    "awayScore": null
  }, {
    "MatchNumber": 59,
    "RoundNumber": 5,
    "DateUtc": "2022-12-10 19:00:00Z",
    "Location": "TBA",
    "HomeTeam": 55,
    "AwayTeam": 56,
    "Group": null,
    "localScore": null,
    "awayScore": null
  }
]

const semifinals: Game[] = [{
  "MatchNumber": 61,
  "RoundNumber": 6,
  "DateUtc": "2022-12-13 19:00:00Z",
  "Location": "TBA",
  "HomeTeam": 58,
  "AwayTeam": 57,
  "Group": null,
  "localScore": null,
  "awayScore": null
}, {
  "MatchNumber": 62,
  "RoundNumber": 6,
  "DateUtc": "2022-12-14 19:00:00Z",
  "Location": "TBA",
  "HomeTeam": 59,
  "AwayTeam": 60,
  "Group": null,
  "localScore": null,
  "awayScore": null
}]

const third_place: Game = {
  "MatchNumber": 63,
  "RoundNumber": 7,
  "DateUtc": "2022-12-17 15:00:00Z",
  "Location": "TBA",
  "HomeTeam": 61,
  "AwayTeam": 62,
  "Group": null,
  "localScore": null,
  "awayScore": null
}

const final: Game = {
  "MatchNumber": 64,
  "RoundNumber": 7,
  "DateUtc": "2022-12-18 15:00:00Z",
  "Location": "TBA",
  "HomeTeam": 61,
  "AwayTeam": 62,
  "Group": null,
  "localScore": null,
  "awayScore": null
}

const playoff_games = [...round_of_16, ...round_of_eight, ...semifinals, final, third_place];

const applyTestingData = (groupStageOnly: boolean = false ) => {
  const gamesToSimulate = groupStageOnly ? group_games :
    [...group_games, ...round_of_16, ...round_of_eight, ...semifinals, third_place, final ];
  gamesToSimulate.forEach(game => {
    if (game.localScore !== null && game.awayScore !== null) {
      return
    }
    game.localScore = Math.round(Math.random()*3)
    game.awayScore = Math.round(Math.random()*3)
    if (game.localScore === game.awayScore && game.RoundNumber > 3) {
      game.localPenaltyScore = Math.round(Math.random()*2.7)
      do {
        game.awayPenaltyScore = Math.round(Math.random()*4.3)
      } while (game.awayPenaltyScore === game.localPenaltyScore)
      game.localPenaltyWinner = game.localPenaltyScore > game.awayPenaltyScore;
      game.awayPenaltyWinner = game.awayPenaltyScore > game.localPenaltyScore;
    }
  })
}

const allGamesByMatchNumber: { [key: number]: Game} = Object.fromEntries([...group_games, ...round_of_16, ...round_of_eight, ...semifinals, final, third_place]
    .map(game => [game.MatchNumber, game]))

if(process.env.NEXT_PUBLIC_SIMULATE_GAMES) {
  applyTestingData()
}

const applyResults = async () => {
  const resultData: Partial<Game>[] = await fetchMatchResultData();
  resultData.forEach(gameResult => {
    if (gameResult.localScore !== null
      && gameResult.localScore !== undefined
      && gameResult.awayScore !== null
      && gameResult.awayScore !== undefined
      && gameResult.MatchNumber) {
      const game = allGamesByMatchNumber[gameResult.MatchNumber]
      if (game) {
        game.localScore = gameResult.localScore
        game.awayScore = gameResult.awayScore
        if (gameResult.localPenaltyScore !== undefined
          && gameResult.localPenaltyScore !== null
          && gameResult.awayPenaltyScore !== undefined
          && gameResult.awayPenaltyScore !== null) {
          game.localPenaltyScore = gameResult.localPenaltyScore
          game.awayPenaltyScore = gameResult.awayPenaltyScore
          game.localPenaltyWinner = game.localPenaltyScore > game.awayPenaltyScore;
          game.awayPenaltyWinner = game.awayPenaltyScore > game.localPenaltyScore;
        }
      }
    }
  })
}

applyResults()

export {
  groups, group_games, round_of_16, round_of_eight, semifinals, third_place, final, playoff_games, allGamesByMatchNumber
}
