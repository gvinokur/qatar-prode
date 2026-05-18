import type { TiebreakerMode } from '../db/tables-definition';
import { calculateGroupPosition, type GameWithResultOrGuess } from './group-position-calculator';

export interface GroupGame {
  id: string;
  home_team: string;
  away_team: string;
}

export interface TeamStanding {
  teamId: string;
  position: number; // 1-indexed
  points: number;
  goalDiff: number;
  goalsFor: number;
}

interface TeamStats {
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

/**
 * Computes simulated group standings from the user's predicted game scores.
 * Skips games where home_score or away_score is null.
 *
 * When tiebreakerMode is 'head_to_head' (story #443), delegates to calculateGroupPosition
 * which implements the full FIFA H2H tiebreaker sequence.
 * When 'standard' (or omitted), uses simple aggregate sort: points → GD → goals → teamId.
 */
export function computeGroupStandingsFromGuesses(
  groupGames: GroupGame[],
  guessMap: Record<string, { home_score: number | null; away_score: number | null }>,
  tiebreakerMode?: TiebreakerMode
): TeamStanding[] {
  if (groupGames.length === 0) return [];

  if (tiebreakerMode === 'head_to_head') {
    return computeGroupStandingsH2H(groupGames, guessMap);
  }

  return computeGroupStandingsStandard(groupGames, guessMap);
}

/**
 * Standard mode: sort by aggregate stats only (points → GD → goals → teamId).
 * Preserves existing behaviour.
 */
function computeGroupStandingsStandard(
  groupGames: GroupGame[],
  guessMap: Record<string, { home_score: number | null; away_score: number | null }>
): TeamStanding[] {
  const statsMap = new Map<string, TeamStats>();

  const getOrInit = (teamId: string): TeamStats => {
    if (!statsMap.has(teamId)) {
      statsMap.set(teamId, { points: 0, goalsFor: 0, goalsAgainst: 0 });
    }
    return statsMap.get(teamId)!;
  };

  // Ensure all teams appear even with no valid guesses
  for (const game of groupGames) {
    getOrInit(game.home_team);
    getOrInit(game.away_team);
  }

  for (const game of groupGames) {
    const guess = guessMap[game.id];
    if (guess?.home_score == null || guess.away_score == null) continue;

    const home = getOrInit(game.home_team);
    const away = getOrInit(game.away_team);
    const hs = guess.home_score;
    const as_ = guess.away_score;

    home.goalsFor += hs;
    home.goalsAgainst += as_;
    away.goalsFor += as_;
    away.goalsAgainst += hs;

    if (hs > as_) {
      home.points += 3;
    } else if (hs < as_) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  }

  const entries = Array.from(statsMap.entries());
  entries.sort(([idA, a], [idB, b]) => {
    const diffA = a.goalsFor - a.goalsAgainst;
    const diffB = b.goalsFor - b.goalsAgainst;
    if (b.points !== a.points) return b.points - a.points;
    if (diffB !== diffA) return diffB - diffA;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return idA.localeCompare(idB);
  });

  return entries.map(([teamId, stats], index) => ({
    teamId,
    position: index + 1,
    points: stats.points,
    goalDiff: stats.goalsFor - stats.goalsAgainst,
    goalsFor: stats.goalsFor,
  }));
}

/**
 * H2H mode: delegates to calculateGroupPosition (FIFA H2H tiebreaker sequence).
 * Constructs GameWithResultOrGuess objects from groupGames + guessMap.
 */
function computeGroupStandingsH2H(
  groupGames: GroupGame[],
  guessMap: Record<string, { home_score: number | null; away_score: number | null }>
): TeamStanding[] {
  // Collect all unique team IDs
  const teamIds = Array.from(
    new Set(groupGames.flatMap(g => [g.home_team, g.away_team]))
  );

  // Build GameWithResultOrGuess objects from the groupGames + guessMap
  const gamesWithGuesses: GameWithResultOrGuess[] = groupGames.map(game => ({
    // Cast to satisfy the Game interface — calculateGroupPosition only reads
    // home_team, away_team, and resultOrGuess.home_score / away_score
    id: game.id,
    home_team: game.home_team,
    away_team: game.away_team,
    resultOrGuess: guessMap[game.id] ?? null,
  } as GameWithResultOrGuess));

  const teamStats = calculateGroupPosition(teamIds, gamesWithGuesses, true, {});

  return teamStats.map((stat, index) => ({
    teamId: stat.team_id,
    position: index + 1,
    points: stat.points,
    goalDiff: stat.goal_difference,
    goalsFor: stat.goals_for,
  }));
}
