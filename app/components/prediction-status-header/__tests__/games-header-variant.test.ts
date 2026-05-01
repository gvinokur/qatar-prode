import { describe, it, expect } from 'vitest';
import { computeGamesHeaderVariant, getNextBatchSummary, deriveStageLabel } from '../games-header-variant';
import type { GamesHeaderInput } from '../games-header-variant';
import type { ExtendedGameData } from '../../../definitions';
import type { TournamentPredictionCompletion } from '../../../db/tables-definition';

// Mock translation function
const mockT = (key: string, values?: Record<string, unknown>) => {
  if (values) return `${key}:${JSON.stringify(values)}`;
  return key;
};

// Helper factories for test data
const createMockGame = (overrides: Partial<ExtendedGameData> = {}): ExtendedGameData => ({
  id: 'game-1',
  tournament_id: 'tournament-1',
  game_number: 1,
  home_team: 'Team A',
  away_team: 'Team B',
  game_date: new Date('2026-06-01T18:00:00Z'),
  location: 'Stadium',
  ...overrides,
});

const createMockCompletion = (overrides: Partial<TournamentPredictionCompletion> = {}): TournamentPredictionCompletion => ({
  finalStandings: { completed: 0, total: 3, champion: false, runnerUp: false, thirdPlace: false },
  awards: { completed: 0, total: 4, bestPlayer: false, topGoalscorer: false, bestGoalkeeper: false, bestYoungPlayer: false },
  qualifiers: { completed: 0, total: 8 },
  overallCompleted: 0,
  overallTotal: 15,
  overallPercentage: 0,
  isPredictionLocked: false,
  completedGames: 0,
  totalGames: 10,
  completedGroupGames: 0,
  totalGroupGames: 8,
  silverBoostsUsed: 0,
  goldenBoostsUsed: 0,
  silverBoostsMax: 0,
  goldenBoostsMax: 0,
  playoffRoundsCompletion: {
    'round-1': {
      total: 2,
      completed: 0,
      round_name: 'Playoffs',
    },
  },
  ...overrides,
});

const createMockInput = (overrides: Partial<GamesHeaderInput> = {}): GamesHeaderInput => ({
  completion: createMockCompletion(),
  games: [createMockGame()],
  urgentGames: [],
  gameGuesses: {},
  teamsMap: {},
  tournamentId: 'tournament-1',
  locale: 'es',
  now: new Date('2026-05-25T12:00:00Z'),
  ...overrides,
});

describe('computeGamesHeaderVariant', () => {
  // ── VARIANT 1: tournament-finished ──────────────────────────────────────────

  it('should return tournament-finished variant when all games have results', () => {
    const now = new Date('2026-06-30T20:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      completedGames: 10,
      totalGames: 10,
    });

    const input = createMockInput({
      completion,
      games: [game],
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('locked');
    expect(result.leadIcon).toBe('lock');
    expect(result.stageLabel).toBe('Finalizado');
    expect(result.action?.href).toContain('/stats');
  });

  it('should include pointsBadge when gamePointsEarned is provided', () => {
    const now = new Date('2026-06-30T20:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      completedGames: 10,
      totalGames: 10,
    });

    const input = createMockInput({
      completion,
      games: [game],
      now,
      gamePointsEarned: 250,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.pointsBadge).toBe('250 pts');
  });

  it('should return secondaryAction for tournament-finished variant', () => {
    const now = new Date('2026-06-30T20:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      completedGames: 10,
      totalGames: 10,
    });

    const input = createMockInput({
      completion,
      games: [game],
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.secondaryAction?.href).toContain('/friend-groups');
  });

  // ── VARIANT 2: urgent-unpredicted ───────────────────────────────────────────

  it('should return urgent-unpredicted variant when there are games < 2h away without guesses', () => {
    const now = new Date('2026-06-01T17:00:00Z');
    const urgentGame = createMockGame({
      id: 'urgent-1',
      game_date: new Date('2026-06-01T18:30:00Z'), // 1.5h away
      home_team: 'team-a-id',
      away_team: 'team-b-id',
    });

    const input = createMockInput({
      games: [urgentGame],
      urgentGames: [urgentGame],
      gameGuesses: {},
      teamsMap: {
        'team-a-id': { id: 'team-a-id', name: 'Team A', short_name: 'TMA' } as any,
        'team-b-id': { id: 'team-b-id', name: 'Team B', short_name: 'TMB' } as any,
      },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('deadlineNow');
    expect(result.leadIcon).toBe('info');
    expect(result.message).toContain('Team A vs Team B');
  });

  it('should return deadlineUrgent tone when game is 3-24h away', () => {
    const now = new Date('2026-05-31T20:00:00Z');
    const urgentGame = createMockGame({
      id: 'urgent-2',
      game_date: new Date('2026-06-01T18:00:00Z'), // 22h away
    });

    const input = createMockInput({
      games: [urgentGame],
      urgentGames: [urgentGame],
      gameGuesses: {},
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('deadlineUrgent');
    expect(result.leadIcon).toBe('info');
  });

  it('should return deadlineSoon tone when game is 24-48h away', () => {
    const now = new Date('2026-05-30T18:00:00Z');
    const urgentGame = createMockGame({
      id: 'urgent-3',
      game_date: new Date('2026-06-01T18:00:00Z'), // 48h away
    });

    const input = createMockInput({
      games: [urgentGame],
      urgentGames: [urgentGame],
      gameGuesses: {},
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('deadlineSoon');
    expect(result.leadIcon).toBe('info');
  });

  it('should ignore urgent games with complete guesses', () => {
    const now = new Date('2026-06-01T17:00:00Z');
    const urgentGame = createMockGame({
      id: 'urgent-4',
      game_date: new Date('2026-06-01T18:30:00Z'), // 1.5h away
    });

    const input = createMockInput({
      games: [urgentGame],
      urgentGames: [urgentGame],
      gameGuesses: {
        'urgent-4': { game_id: 'urgent-4', home_score: 2, away_score: 1 },
      },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    // Should not be urgent variant since game is already guessed
    expect(result.tone).not.toBe('deadlineNow');
  });

  it('should use most urgent game for tone when multiple unpredicted urgent games exist', () => {
    const now = new Date('2026-06-01T17:00:00Z');
    const urgentGame1 = createMockGame({
      id: 'urgent-5a',
      game_date: new Date('2026-06-01T18:30:00Z'), // 1.5h away
    });
    const urgentGame2 = createMockGame({
      id: 'urgent-5b',
      game_date: new Date('2026-06-02T12:00:00Z'), // ~19h away
    });

    const input = createMockInput({
      games: [urgentGame1, urgentGame2],
      urgentGames: [urgentGame1, urgentGame2],
      gameGuesses: {},
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    // Should use the most urgent (deadlineNow from game1)
    expect(result.tone).toBe('deadlineNow');
  });

  // ── VARIANT 3: pre-groups-complete-nudge-qt ─────────────────────────────────

  it('should return pre-groups-complete-nudge-qt when groups done, QT open, QT incomplete', () => {
    const now = new Date('2026-06-10T12:00:00Z');
    const game = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') }); // past
    const completion = createMockCompletion({
      totalGroupGames: 1,
      isPredictionLocked: false,
      qualifiers: { completed: 2, total: 8 },
    });

    const input = createMockInput({
      completion,
      games: [game],
      // Live guess triggers groupsComplete = true
      gameGuesses: { 'game-1': { game_id: 'game-1', home_score: 1, away_score: 0 } as any },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('success');
    expect(result.leadIcon).toBe('check');
    expect(result.action?.href).toContain('/qualified-teams');
  });

  it('should not return nudge-qt when QT is locked', () => {
    const now = new Date('2026-06-10T12:00:00Z');
    const game = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      totalGroupGames: 1,
      isPredictionLocked: true, // locked
      qualifiers: { completed: 2, total: 8 },
    });

    const input = createMockInput({
      completion,
      games: [game],
      gameGuesses: { 'game-1': { game_id: 'game-1', home_score: 1, away_score: 0 } as any },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).not.toBe('success');
  });

  it('should not return nudge-qt when QT is complete', () => {
    const now = new Date('2026-06-10T12:00:00Z');
    const game = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      totalGroupGames: 1,
      isPredictionLocked: false,
      qualifiers: { completed: 8, total: 8 }, // complete
    });

    const input = createMockInput({
      completion,
      games: [game],
      gameGuesses: { 'game-1': { game_id: 'game-1', home_score: 1, away_score: 0 } as any },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).not.toBe('success');
  });

  // ── VARIANT 4: pre-tournament ──────────────────────────────────────────────

  it('should return pre-tournament variant when tournament not started', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const game1 = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') });
    const game2 = createMockGame({ id: 'game-2', game_date: new Date('2026-06-02T18:00:00Z') });

    const input = createMockInput({
      games: [game1, game2],
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('brand');
    expect(result.leadIcon).toBe('rocket');
    expect(result.stageLabel).toBe('Grupos');
    expect(result.action?.href).toContain('?edit=next');
  });

  it('should show ctaStart when no groups predicted yet', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      completedGroupGames: 0,
      totalGroupGames: 8,
    });

    const input = createMockInput({
      completion,
      games: [game],
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.action?.label).toBe('statusHeader.games.preTournament.ctaStart');
  });

  it('should show ctaFinish when all groups predicted in pre-tournament', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const game = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') });
    const completion = createMockCompletion({
      totalGroupGames: 1,
      isPredictionLocked: false,
      qualifiers: { completed: 8, total: 8 }, // QT complete - skip nudge variant
    });

    const input = createMockInput({
      completion,
      games: [game],
      // Complete guess for the only game → liveCompletedGroupGames = 1 = totalGroupGames
      gameGuesses: { 'game-1': { game_id: 'game-1', home_score: 2, away_score: 0 } as any },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.action?.label).toBe('statusHeader.games.preTournament.ctaFinish');
  });

  it('should show ctaContinue when some groups predicted', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const game1 = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') });
    const game2 = createMockGame({ id: 'game-2', game_date: new Date('2026-06-02T18:00:00Z') });
    const completion = createMockCompletion({
      totalGroupGames: 2,
    });

    const input = createMockInput({
      completion,
      games: [game1, game2],
      // Only 1 of 2 predicted → liveCompletedGroupGames = 1, totalGroupGames = 2 → ctaContinue
      gameGuesses: { 'game-1': { game_id: 'game-1', home_score: 1, away_score: 0 } as any },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.action?.label).toBe('statusHeader.games.preTournament.ctaContinue');
  });

  // ── VARIANT 5: stage-active-caught-up ──────────────────────────────────────

  it('should return stage-active-caught-up as default variant', () => {
    const now = new Date('2026-06-05T12:00:00Z');
    const game1 = createMockGame({ id: 'game-1', game_date: new Date('2026-06-01T18:00:00Z') });
    const game2 = createMockGame({ id: 'game-2', game_date: new Date('2026-06-06T18:00:00Z') });

    const input = createMockInput({
      games: [game1, game2],
      completion: createMockCompletion({
        completedGroupGames: 4,
        totalGroupGames: 8,
      }),
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('calm');
    expect(result.leadIcon).toBe('check');
    expect(result.statusColor).toBe('success.main');
  });

  it('should show games count chip for stage-active-caught-up', () => {
    const now = new Date('2026-06-20T12:00:00Z');
    const game = createMockGame({ id: 'game-past', game_date: new Date('2026-06-10T18:00:00Z') });
    const completion = createMockCompletion({
      totalGames: 10,
    });

    const input = createMockInput({
      games: [game],
      completion,
      // One game with a complete guess → liveCompletedGames = 1
      gameGuesses: {
        'game-past': { game_id: 'game-past', home_score: 2, away_score: 1 } as any,
      },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    // chip should show live predicted/total games (partidos key)
    expect(result.chip?.label).toContain('statusHeader.chipLabel.partidos');
    expect(result.chip?.label).toContain('"predicted":1');
    expect(result.chip?.label).toContain('"total":10');
  });

  it('should show success chip color for stage-active-caught-up when all predicted', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    // Past game makes tournament "started"; future game prevents tournament-finished
    const pastGame = createMockGame({ id: 'past', game_date: new Date('2026-07-01T18:00:00Z') });
    const futureGame = createMockGame({ id: 'future', game_date: new Date('2026-07-15T18:00:00Z') });
    const completion = createMockCompletion({
      totalGames: 2, // matches the 2 games provided
      totalGroupGames: 2, // both games are group games → stageChipTotal uses this
      qualifiers: { completed: 8, total: 8 }, // QT complete → skip nudge-qt variant
    });

    const input = createMockInput({
      games: [pastGame, futureGame],
      completion,
      // Both games have complete guesses → liveCompletedGames = 2 = totalGames → allPredicted = true
      gameGuesses: {
        'past': { game_id: 'past', home_score: 1, away_score: 0 } as any,
        'future': { game_id: 'future', home_score: 2, away_score: 1 } as any,
      },
      now,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.chip?.color).toBe('success');
  });

  // ── Additional Edge Cases ───────────────────────────────────────────────

  it('should include boosts info when available, counted from live guesses', () => {
    const completion = createMockCompletion({
      silverBoostsMax: 5,
      silverBoostsUsed: 2, // server value — not used; live count comes from gameGuesses
      goldenBoostsMax: 1,
      goldenBoostsUsed: 0,
    });

    const input = createMockInput({
      completion,
      // 2 silver boosts in live guesses
      gameGuesses: {
        'g1': { game_id: 'g1', home_score: 1, away_score: 0, boost_type: 'silver' } as any,
        'g2': { game_id: 'g2', home_score: 2, away_score: 1, boost_type: 'silver' } as any,
        'g3': { game_id: 'g3', home_score: 0, away_score: 0, boost_type: null } as any,
      },
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.boosts).toEqual({
      silverUsed: 2,
      silverMax: 5,
      goldenUsed: 0,
      goldenMax: 1,
    });
  });

  it('should not include boosts info when none available', () => {
    const completion = createMockCompletion({
      silverBoostsMax: 0,
      goldenBoostsMax: 0,
    });

    const input = createMockInput({
      completion,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.boosts).toBeUndefined();
  });

  it('should use injected now date for calculations', () => {
    const specificNow = new Date('2026-06-15T10:30:00Z');
    const urgentGame = createMockGame({
      id: 'urgent-edge',
      game_date: new Date('2026-06-15T12:00:00Z'), // 1.5h away
    });

    const input = createMockInput({
      games: [urgentGame],
      urgentGames: [urgentGame],
      gameGuesses: {},
      now: specificNow,
    });

    const result = computeGamesHeaderVariant(input, mockT);

    expect(result.tone).toBe('deadlineNow');
  });
});

describe('getNextBatchSummary', () => {
  it('should return empty string when no upcoming games', () => {
    const now = new Date('2026-07-01T12:00:00Z');
    const pastGame = createMockGame({ game_date: new Date('2026-06-30T18:00:00Z') });

    const result = getNextBatchSummary([pastGame], now, mockT);

    expect(result).toBe('');
  });

  it('should return today summary when next games are today', () => {
    const now = new Date('2026-06-15T08:00:00Z');
    const game1 = createMockGame({ id: 'g1', game_date: new Date('2026-06-15T18:00:00Z') });
    const game2 = createMockGame({ id: 'g2', game_date: new Date('2026-06-15T20:00:00Z') });

    const result = getNextBatchSummary([game1, game2], now, mockT);

    expect(result).toContain('statusHeader.games.stageActive.statusToday');
    expect(result).toContain('count":2');
  });

  it('should return tomorrow summary when next games are tomorrow', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-16T18:00:00Z') });

    const result = getNextBatchSummary([game], now, mockT);

    expect(result).toContain('statusHeader.games.stageActive.statusTomorrow');
  });

  it('should return days summary when next games are multiple days away', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-20T18:00:00Z') });

    const result = getNextBatchSummary([game], now, mockT);

    expect(result).toContain('statusHeader.games.stageActive.statusDays');
    expect(result).toContain('days":5');
  });
});

describe('deriveStageLabel', () => {
  it('should return Grupos for pre-tournament phase', () => {
    const now = new Date('2026-05-20T12:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-06-01T18:00:00Z') });

    const result = deriveStageLabel([game], now);

    expect(result).toBe('Grupos');
  });

  it('should return Finalizado for post-tournament phase', () => {
    const now = new Date('2026-08-01T12:00:00Z');
    const game = createMockGame({ game_date: new Date('2026-07-15T18:00:00Z') });

    const result = deriveStageLabel([game], now);

    expect(result).toBe('Finalizado');
  });

  it('should handle empty game list', () => {
    const now = new Date('2026-06-15T12:00:00Z');

    const result = deriveStageLabel([], now);

    expect(result).toBeUndefined();
  });

  it('should merge Final and Third-place rounds', () => {
    const now = new Date('2026-07-10T12:00:00Z');
    const finalGame = createMockGame({
      id: 'final',
      game_date: new Date('2026-07-13T18:00:00Z'),
      playoffStage: {
        tournament_playoff_round_id: 'final-id',
        round_name: 'Final',
        is_final: true,
        is_third_place: false,
      },
    });
    const thirdGame = createMockGame({
      id: 'third',
      game_date: new Date('2026-07-12T18:00:00Z'),
      playoffStage: {
        tournament_playoff_round_id: 'third-id',
        round_name: 'Third Place',
        is_final: false,
        is_third_place: true,
      },
    });

    const result = deriveStageLabel([finalGame, thirdGame], now);

    // Should identify the finals bucket and use Final's round_name
    expect(result).toBeTruthy();
  });
});
