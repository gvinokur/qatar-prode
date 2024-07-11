import '@testing-library/jest-dom'

import {calculateGroupPosition, GameWithResultOrGuess} from '../../app/utils/group-position-calculator';
import {ExtendedGameData} from "../../app/definitions";


const gameResult21 = {home_score: 2, away_score: 1} as any;
const gameResult11 = {home_score: 1, away_score: 1} as any;
const gameResult20 = {home_score: 2, away_score: 0} as any;
const gameResult12 = {home_score: 1, away_score: 2} as any;
const gameResult02 = {home_score: 0, away_score: 2} as any;
const gameResult00 = {home_score: 0, away_score: 0} as any;
const gameResult30 = {home_score: 3, away_score: 0} as any;
const gameResult03 = {home_score: 0, away_score: 3} as any;
const teamIds= ['team1', 'team2', 'team3', 'team4']
const baseGame: Partial<ExtendedGameData> = {
  id: '1',
  tournament_id: 'tournament1',
  game_type: 'group',
  location: 'location1',
  game_date : new Date(),
}

const fixtures = [
  {
    condition: 'no tiebreak needed',
    sortByGamesBetweenTeams: false,
    games: [
      {
        ...baseGame,
        resultOrGuess: gameResult21,
        home_team: 'team1',
        away_team: 'team2'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult11,
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult20,
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult02,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team4',
      'team1',
      'team3',
      'team2',
    ]
  },
  {
    condition: '2 team tiebreak indiferent by stats',
    sortByGamesBetweenTeams: false,
    games: [
      {
        ...baseGame,
        resultOrGuess: gameResult21,
        home_team: 'team1',
        away_team: 'team2'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult20,
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team1',
      'team4',
      'team2',
      'team3',
    ]
  },
  {
    condition: '2 team tiebreak indiferent by games',
    sortByGamesBetweenTeams: true,
    games: [
      {
        ...baseGame,
        resultOrGuess: gameResult21,
        home_team: 'team1',
        away_team: 'team2'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult20,
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team1',
      'team4',
      'team2',
      'team3',
    ]
  },
  {
    condition: '2 team tiebreak different by stats',
    sortByGamesBetweenTeams: false,
    games: [
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team1',
        away_team: 'team2'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult20,
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team1',
      'team4',
      'team2',
      'team3',
    ]
  },
  {
    condition: '2 team tiebreak different by games',
    sortByGamesBetweenTeams: true,
    games: [
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team1',
        away_team: 'team2'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult20,
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult00,
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team4',
      'team1',
      'team2',
      'team3',
    ]
  },
]


describe('calculateGroupPosition', () => {
  fixtures.forEach(({condition, games, expected, sortByGamesBetweenTeams}) => {
    it(`should calculate group position with ${condition}`, () => {
      const actual = calculateGroupPosition(teamIds, games, sortByGamesBetweenTeams)
      actual.forEach((team, index) => {
        expect(team.team_id).toBe(expected[index])
      })
    })
  })
})
