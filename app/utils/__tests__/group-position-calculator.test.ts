import { describe, it, expect } from 'vitest';
import { calculateGroupPosition } from '../group-position-calculator';
import type { GameWithResultOrGuess } from '../group-position-calculator';

const makeGame = (home: string, away: string, homeScore: number, awayScore: number): GameWithResultOrGuess => ({
  id: `${home}-${away}`,
  home_team: home,
  away_team: away,
  game_number: 1,
  tournament_group_id: 'g1',
  resultOrGuess: { home_score: homeScore, away_score: awayScore } as any,
})

// All-draw group: A, B, C, D each draw every game → 3 pts each, GD=0, GF=2
const ALL_DRAW_GAMES: GameWithResultOrGuess[] = [
  makeGame('A', 'B', 1, 1),
  makeGame('A', 'C', 1, 1),
  makeGame('A', 'D', 1, 1),
  makeGame('B', 'C', 1, 1),
  makeGame('B', 'D', 1, 1),
  makeGame('C', 'D', 1, 1),
]
const TEAMS = ['A', 'B', 'C', 'D']

describe('calculateGroupPosition — conduct_score tiebreaker', () => {
  it('ranks team with lower conduct_score first when all other stats are equal', () => {
    const positions = calculateGroupPosition(TEAMS, ALL_DRAW_GAMES, false, {
      A: 0, B: 2, C: 5, D: 10,
    })
    expect(positions.map(p => p.team_id)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('ranks team with conduct_score=0 above team with conduct_score=5', () => {
    const positions = calculateGroupPosition(['X', 'Y'], [
      makeGame('X', 'Y', 1, 1),
    ], false, { X: 0, Y: 5 })
    expect(positions[0].team_id).toBe('X')
    expect(positions[1].team_id).toBe('Y')
  })

  it('conductScores parameter is optional — omitting it preserves existing behavior', () => {
    // Without conductScores, all-draw group falls back to insertion order / stable sort
    const withParam = calculateGroupPosition(TEAMS, ALL_DRAW_GAMES, false, {})
    const withoutParam = calculateGroupPosition(TEAMS, ALL_DRAW_GAMES, false)
    expect(withParam.map(p => p.team_id)).toEqual(withoutParam.map(p => p.team_id))
  })

  it('goal_difference beats conduct_score: better GD wins even with conduct_score=0 on the other side', () => {
    // A beats C 2-0, A draws B 0-0, B beats C 1-0
    // A: 4pts, GD+2; B: 4pts, GD+1; C: 0pts
    const games = [
      makeGame('A', 'C', 2, 0),
      makeGame('A', 'B', 0, 0),
      makeGame('B', 'C', 1, 0),
    ]
    // Give A the worst conduct (highest number) — it should still rank first due to GD
    const positions = calculateGroupPosition(['A', 'B', 'C'], games, false, { A: 99, B: 0, C: 0 })
    expect(positions[0].team_id).toBe('A')
    expect(positions[1].team_id).toBe('B')
  })

  it('goals_for beats conduct_score: more goals_for wins even with conduct_score=0 on the other side', () => {
    // All 3 teams draw all games, but with different scorelines → same pts, same GD, different GF
    // A draws B 2-2 (+2 GF each), A draws C 1-1 (+1 GF each), B draws C 0-0
    // A: 2pts, GD=0, GF=3; B: 2pts, GD=0, GF=2; C: 2pts, GD=0, GF=1
    const games = [
      makeGame('A', 'B', 2, 2),
      makeGame('A', 'C', 1, 1),
      makeGame('B', 'C', 0, 0),
    ]
    // Give A the worst conduct — it should still rank first due to GF
    const positions = calculateGroupPosition(['A', 'B', 'C'], games, false, { A: 99, B: 0, C: 0 })
    expect(positions[0].team_id).toBe('A')
    expect(positions[1].team_id).toBe('B')
    expect(positions[2].team_id).toBe('C')
  })

  it('three-way tie: teams ranked by conduct_score when all other stats from H2H are equal', () => {
    // 4-team group: D beats everyone. A, B, C all draw each other and lose to D.
    // A, B, C all have equal pts/GD/GF among themselves → conduct_score is the tiebreaker.
    const games = [
      makeGame('A', 'B', 1, 1),
      makeGame('A', 'C', 1, 1),
      makeGame('B', 'C', 1, 1),
      makeGame('D', 'A', 2, 0),
      makeGame('D', 'B', 2, 0),
      makeGame('D', 'C', 2, 0),
    ]
    const positions = calculateGroupPosition(['A', 'B', 'C', 'D'], games, false, {
      A: 1, B: 3, C: 5, D: 0,
    })
    // D has most pts so ranks first; among A/B/C, lower conduct = higher rank
    expect(positions[0].team_id).toBe('D')
    expect(positions[1].team_id).toBe('A')
    expect(positions[2].team_id).toBe('B')
    expect(positions[3].team_id).toBe('C')
  })

  it('team ID missing from conductScores map defaults to 0 (treated as best conduct)', () => {
    // X has conduct=5 explicit; Y is missing from the map → defaults to 0 → Y ranks first
    const positions = calculateGroupPosition(['X', 'Y'], [
      makeGame('X', 'Y', 1, 1),
    ], false, { X: 5 })
    expect(positions[0].team_id).toBe('Y')
    expect(positions[1].team_id).toBe('X')
  })
})

describe('calculateGroupPosition — 3-way tie bug fix (story #443)', () => {
  /**
   * Before the bug fix, resolveThreeWayTie called calculateGroupPosition recursively
   * on the 3 tied teams' H2H games and then re-sorted with genericTeamStatsComparator.
   * If two teams had identical H2H aggregate stats but one won the direct match,
   * the re-sort would undo the direct-match resolution.
   *
   * After the fix: in H2H mode (sortByGamesBetweenTeams=true), the two-phase comparator
   * (H2H aggregate → overall fallthrough) is used directly, without a secondary sort.
   */
  it('H2H 3-way tie: direct-match winner is not undone by a secondary sort', () => {
    // D beats everyone. A, B, C are 3-way tied on points.
    // Among A/B/C: A beats B 1-0, B draws C 0-0, A draws C 0-0.
    // H2H aggregate: A=4pts, B=1pt, C=1pt → A ranks 1st among the trio.
    // B and C draw their H2H game → resolved by overall stats or alphabetical.
    const games = [
      makeGame('A', 'B', 1, 0), // A wins H2H
      makeGame('A', 'C', 0, 0), // draw
      makeGame('B', 'C', 0, 0), // draw
      makeGame('D', 'A', 3, 0),
      makeGame('D', 'B', 3, 0),
      makeGame('D', 'C', 3, 0),
    ]
    const positions = calculateGroupPosition(['A', 'B', 'C', 'D'], games, true)
    // D wins group with most points. Among A/B/C: A should rank 1st due to H2H win.
    expect(positions[0].team_id).toBe('D')
    expect(positions[1].team_id).toBe('A')
    // B and C are still tied (draw between them); order determined by overall stats / id sort
    expect(['B', 'C']).toContain(positions[2].team_id)
    expect(['B', 'C']).toContain(positions[3].team_id)
  })

  it('H2H 3-way tie with identical H2H stats falls through to overall GD tiebreaker', () => {
    // All 3 tied teams draw all their H2H games (equal H2H stats).
    // Different overall GD should break the tie.
    // D beats everyone. A/B/C draw each other.
    // A has better overall GD than B (lost by less to D).
    const games = [
      makeGame('A', 'B', 1, 1),
      makeGame('A', 'C', 1, 1),
      makeGame('B', 'C', 1, 1),
      makeGame('D', 'A', 1, 0), // A loses by 1
      makeGame('D', 'B', 3, 0), // B loses by 3
      makeGame('D', 'C', 2, 0), // C loses by 2
    ]
    const positions = calculateGroupPosition(['A', 'B', 'C', 'D'], games, true)
    expect(positions[0].team_id).toBe('D')
    // A has best overall GD (-1) among tied trio, then C (-2), then B (-3)
    expect(positions[1].team_id).toBe('A')
    expect(positions[2].team_id).toBe('C')
    expect(positions[3].team_id).toBe('B')
  })

  it('standard mode 3-way tie: same aggregate stats → conduct score tiebreaker unchanged', () => {
    // Verify that standard mode (sortByGamesBetweenTeams=false) behaviour is unchanged.
    const games = [
      makeGame('A', 'B', 1, 1),
      makeGame('A', 'C', 1, 1),
      makeGame('B', 'C', 1, 1),
      makeGame('D', 'A', 2, 0),
      makeGame('D', 'B', 2, 0),
      makeGame('D', 'C', 2, 0),
    ]
    const positions = calculateGroupPosition(['A', 'B', 'C', 'D'], games, false, {
      A: 1, B: 3, C: 5, D: 0,
    })
    expect(positions[0].team_id).toBe('D')
    expect(positions[1].team_id).toBe('A')
    expect(positions[2].team_id).toBe('B')
    expect(positions[3].team_id).toBe('C')
  })
})

describe('calculateGroupPosition — sortByGamesBetweenTeams tie resolution', () => {
  it('swaps two tied teams when head-to-head is a draw but one has better overall stats', () => {
    // 4-team group. A and B both have 4pts. Head-to-head A vs B is 0-0 (no winner).
    // B has more goals_for (2 > 1) so genericTeamStatsComparator should rank B higher.
    // This exercises the `!winnerTeam && sortByGamesBetweenTeams && comparator > 0` swap.
    const games = [
      makeGame('A', 'B', 0, 0), // head-to-head draw
      makeGame('A', 'C', 1, 0), // A wins
      makeGame('D', 'A', 2, 0), // D beats A
      makeGame('B', 'C', 2, 0), // B wins
      makeGame('D', 'B', 3, 0), // D beats B
      makeGame('C', 'D', 0, 1), // D beats C
    ]
    // A: 4pts, GD=-1, GF=1 | B: 4pts, GD=-1, GF=2 → B should rank above A
    const positions = calculateGroupPosition(['A', 'B', 'C', 'D'], games, true)
    const aIndex = positions.findIndex(p => p.team_id === 'A')
    const bIndex = positions.findIndex(p => p.team_id === 'B')
    expect(bIndex).toBeLessThan(aIndex)
  })
})
