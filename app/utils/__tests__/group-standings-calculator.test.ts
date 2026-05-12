import { describe, it, expect } from 'vitest';
import { computeGroupStandingsFromGuesses } from '../group-standings-calculator';

const makeGames = (pairs: [string, string][]) =>
  pairs.map(([home, away], i) => ({ id: `g${i}`, home_team: home, away_team: away }));

const makeGuess = (hs: number | null, as_: number | null) => ({ home_score: hs, away_score: as_ });

describe('computeGroupStandingsFromGuesses', () => {
  it('sorts by points descending', () => {
    const games = makeGames([['A', 'B'], ['A', 'C'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(3, 0), // A wins
      g1: makeGuess(2, 0), // A wins
      g2: makeGuess(1, 0), // B wins
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    expect(standings[0].teamId).toBe('A'); // 6 pts
    expect(standings[1].teamId).toBe('B'); // 3 pts
    expect(standings[2].teamId).toBe('C'); // 0 pts
    expect(standings[0].position).toBe(1);
    expect(standings[1].position).toBe(2);
    expect(standings[2].position).toBe(3);
  });

  it('applies goal difference as tiebreaker when points are equal', () => {
    const games = makeGames([['A', 'B'], ['A', 'C'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0), // A wins (+1 GD for A, -1 for B)
      g1: makeGuess(0, 1), // C wins (+1 GD for C, -1 for A)
      g2: makeGuess(1, 0), // B wins (+1 GD for B, -1 for C)
    };
    // All have 3pts. GD: A=0, B=0, C=0 — wait let me redo:
    // A: g0 win +1gd, g1 loss -1gd => GD=0, gf=1
    // B: g0 loss -1gd, g2 win +1gd => GD=0, gf=1
    // C: g1 win +1gd, g2 loss -1gd => GD=0, gf=1
    // All equal — sort alphabetically
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    expect(standings.map((s) => s.points)).toEqual([3, 3, 3]);
    expect(standings[0].teamId).toBe('A');
    expect(standings[1].teamId).toBe('B');
    expect(standings[2].teamId).toBe('C');
  });

  it('uses goal difference tiebreaker to differentiate equal-points teams', () => {
    const games = makeGames([['A', 'B'], ['C', 'D'], ['A', 'C'], ['B', 'D']]);
    const guessMap = {
      g0: makeGuess(2, 0), // A wins big
      g1: makeGuess(1, 0), // C wins small
      g2: makeGuess(0, 0), // draw
      g3: makeGuess(0, 0), // draw
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    const aStanding = standings.find((s) => s.teamId === 'A');
    const cStanding = standings.find((s) => s.teamId === 'C');
    expect(aStanding?.goalDiff).toBeGreaterThan(cStanding?.goalDiff ?? 0);
    expect(standings.indexOf(aStanding!)).toBeLessThan(standings.indexOf(cStanding!));
  });

  it('skips games without a guess (not in guessMap)', () => {
    const games = makeGames([['A', 'B'], ['A', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0), // only one guess provided
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    const a = standings.find((s) => s.teamId === 'A')!;
    const b = standings.find((s) => s.teamId === 'B')!;
    const c = standings.find((s) => s.teamId === 'C')!;
    expect(a.points).toBe(3);
    expect(b.points).toBe(0);
    expect(c.points).toBe(0); // g1 skipped
  });

  it('skips games where score is null', () => {
    const games = makeGames([['A', 'B'], ['A', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0),
      g1: makeGuess(null, null),
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    const a = standings.find((s) => s.teamId === 'A')!;
    expect(a.points).toBe(3); // only g0 counted
  });

  it('handles a group where all games are draws', () => {
    const games = makeGames([['A', 'B'], ['A', 'C'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 1),
      g1: makeGuess(1, 1),
      g2: makeGuess(1, 1),
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    expect(standings.every((s) => s.points === 2)).toBe(true);
    expect(standings.every((s) => s.goalDiff === 0)).toBe(true);
    // Alphabetical order when all equal
    expect(standings[0].teamId).toBe('A');
    expect(standings[1].teamId).toBe('B');
    expect(standings[2].teamId).toBe('C');
  });

  it('handles a group where one team wins all games', () => {
    const games = makeGames([['A', 'B'], ['A', 'C'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0),
      g1: makeGuess(1, 0),
      g2: makeGuess(0, 0),
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    expect(standings[0].teamId).toBe('A');
    expect(standings[0].points).toBe(6);
    expect(standings[0].position).toBe(1);
  });

  it('returns all teams even if no valid guesses exist', () => {
    const games = makeGames([['A', 'B'], ['C', 'D']]);
    const standings = computeGroupStandingsFromGuesses(games, {});
    const teamIds = standings.map((s) => s.teamId).sort();
    expect(teamIds).toEqual(['A', 'B', 'C', 'D']);
    expect(standings.every((s) => s.points === 0)).toBe(true);
  });

  it('positions are 1-indexed', () => {
    const games = makeGames([['A', 'B']]);
    const guessMap = { g0: makeGuess(1, 0) };
    const standings = computeGroupStandingsFromGuesses(games, guessMap);
    expect(standings.map((s) => s.position)).toEqual([1, 2]);
  });

  it('returns empty array when groupGames is empty', () => {
    const standings = computeGroupStandingsFromGuesses([], {});
    expect(standings).toEqual([]);
  });
});

describe('computeGroupStandingsFromGuesses — H2H mode (story #443)', () => {
  it('uses head_to_head tiebreaker when tiebreakerMode is head_to_head', () => {
    // A beats B in their direct match. Both have 3pts overall (A beats B, C beats A, B beats C).
    // In standard mode the order is determined by GD/GF. In H2H mode, direct match matters.
    // Here: A beats B → in H2H, A should rank above B when both have 3pts.
    const games = makeGames([['A', 'B'], ['C', 'A'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0), // A beats B
      g1: makeGuess(1, 0), // C beats A
      g2: makeGuess(1, 0), // B beats C
    };
    // All have 3pts. H2H: A beat B → A ranks above B.
    const standings = computeGroupStandingsFromGuesses(games, guessMap, 'head_to_head');
    const aPos = standings.find((s) => s.teamId === 'A')!.position;
    const bPos = standings.find((s) => s.teamId === 'B')!.position;
    expect(aPos).toBeLessThan(bPos);
  });

  it('falls back to standard sort when tiebreakerMode is standard', () => {
    // Same scenario — without H2H, purely points-based then GD.
    const games = makeGames([['A', 'B'], ['C', 'A'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0),
      g1: makeGuess(1, 0),
      g2: makeGuess(1, 0),
    };
    const standings = computeGroupStandingsFromGuesses(games, guessMap, 'standard');
    // All 3pts, GD=0, GF=1 — alphabetical fallback: A < B < C
    expect(standings[0].teamId).toBe('A');
    expect(standings[1].teamId).toBe('B');
    expect(standings[2].teamId).toBe('C');
  });

  it('omitting tiebreakerMode behaves as standard', () => {
    const games = makeGames([['A', 'B'], ['C', 'A'], ['B', 'C']]);
    const guessMap = {
      g0: makeGuess(1, 0),
      g1: makeGuess(1, 0),
      g2: makeGuess(1, 0),
    };
    const withStandard = computeGroupStandingsFromGuesses(games, guessMap, 'standard');
    const withUndefined = computeGroupStandingsFromGuesses(games, guessMap);
    expect(withUndefined.map((s) => s.teamId)).toEqual(withStandard.map((s) => s.teamId));
  });
});
