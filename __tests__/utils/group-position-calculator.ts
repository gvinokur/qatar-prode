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
  {
    condition: 'three-way tie at top with head-to-head resolution',
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
        home_team: 'team2',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult21,
        home_team: 'team3',
        away_team: 'team1'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team3',
        away_team: 'team4'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team3',
      'team1',
      'team2',
      'team4',
    ]
  },
  {
    condition: 'three-way tie at bottom with head-to-head resolution',
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
        resultOrGuess: gameResult30,
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult30,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult21,
        home_team: 'team2',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult21,
        home_team: 'team2',
        away_team: 'team4'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team1',
      'team2',
      'team4',
      'team3',
    ]
  },
  {
    condition: 'four-way tie with goal difference resolution',
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
        resultOrGuess: gameResult21,
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
        resultOrGuess: gameResult21,
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: gameResult12,
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team1',
      'team4',
      'team3',
      'team2',
    ]
  },
  {
    condition: 'incomplete group with some games missing',
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
        resultOrGuess: gameResult21,
        home_team: 'team1',
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
    condition: 'tie resolved by goals scored',
    sortByGamesBetweenTeams: false,
    games: [
      {
        ...baseGame,
        resultOrGuess: { home_score: 3, away_score: 2 },
        home_team: 'team1',
        away_team: 'team2'
      },
      {
        ...baseGame,
        resultOrGuess: { home_score: 2, away_score: 1 },
        home_team: 'team3',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: { home_score: 2, away_score: 2 },
        home_team: 'team1',
        away_team: 'team3'
      },
      {
        ...baseGame,
        resultOrGuess: { home_score: 2, away_score: 2 },
        home_team: 'team2',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: { home_score: 1, away_score: 1 },
        home_team: 'team1',
        away_team: 'team4'
      },
      {
        ...baseGame,
        resultOrGuess: { home_score: 1, away_score: 1 },
        home_team: 'team2',
        away_team: 'team3'
      }
    ] as GameWithResultOrGuess[],
    expected: [
      'team1',
      'team3',
      'team2',
      'team4',
    ]
  }
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

  it('should handle empty games array', () => {
    const result = calculateGroupPosition(teamIds, [], false);
    expect(result).toHaveLength(4);
    result.forEach(team => {
      expect(team.games_played).toBe(0);
      expect(team.points).toBe(0);
    });
  });

  it('should handle games with null results', () => {
    const gamesWithNullResults = [
      {
        ...baseGame,
        resultOrGuess: null,
        home_team: 'team1',
        away_team: 'team2'
      }
    ] as GameWithResultOrGuess[];
    
    const result = calculateGroupPosition(teamIds, gamesWithNullResults, false);
    expect(result).toHaveLength(4);
    result.forEach(team => {
      expect(team.games_played).toBe(0);
      expect(team.points).toBe(0);
    });
  });

  it('should handle games with undefined results', () => {
    const gamesWithUndefinedResults = [
      {
        ...baseGame,
        resultOrGuess: undefined,
        home_team: 'team1',
        away_team: 'team2'
      }
    ] as GameWithResultOrGuess[];
    
    const result = calculateGroupPosition(teamIds, gamesWithUndefinedResults, false);
    expect(result).toHaveLength(4);
    result.forEach(team => {
      expect(team.games_played).toBe(0);
      expect(team.points).toBe(0);
    });
  });
})
