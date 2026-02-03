import { calculateScoreForGame } from '../../app/utils/game-score-calculator';
import { ExtendedGameData } from '../../app/definitions';
import { GameGuessNew } from '../../app/db/tables-definition';

describe('game-score-calculator', () => {
  describe('calculateScoreForGame', () => {
    const createGame = (overrides: Partial<ExtendedGameData> = {}): ExtendedGameData => ({
      id: '1',
      tournament_id: 'tournament-1',
      game_number: 1,
      home_team: 'team-1',
      away_team: 'team-2',
      home_team_rule: undefined,
      away_team_rule: undefined,
      game_type: 'group',
      game_local_timezone: undefined,
      game_date: new Date(),
      location: 'test-location',
      gameResult: {
        game_id: '1',
        home_score: 2,
        away_score: 1,
        home_penalty_score: 0,
        away_penalty_score: 0,
        is_draft: false
      },
      group: undefined,
      playoffStage: undefined,
      ...overrides
    });

    const createGuess = (overrides: Partial<GameGuessNew> = {}): GameGuessNew => ({
      game_id: '1',
      game_number: 1,
      user_id: 'user-1',
      home_score: 2,
      away_score: 1,
      ...overrides
    });

    describe('validation', () => {
      it('returns 0 when game has no result', () => {
        const game = createGame({ gameResult: null });
        const guess = createGuess();
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when game result has invalid home score', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:null as any,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess();
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when game result has non-integer home score', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2.5,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess();
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when game result has invalid away score', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2,
            away_score: null as any,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess();
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when guess has invalid home score', () => {
        const game = createGame();
        const guess = createGuess({ home_score: null as any });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when guess has non-integer home score', () => {
        const game = createGame();
        const guess = createGuess({ home_score: 2.5 });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when guess has invalid away score', () => {
        const game = createGame();
        const guess = createGuess({ away_score: null as any });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 when guess has non-integer away score', () => {
        const game = createGame();
        const guess = createGuess({ away_score: 1.5 });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });
    });

    describe('exact score matches', () => {
      it('returns 2 for exact score match in group game', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:3,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 3, away_score: 1 });
        expect(calculateScoreForGame(game, guess)).toBe(2);
      });

      it('returns 2 for exact score match in playoff game without penalties', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2,
            away_score: 0,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 2, away_score: 0 });
        expect(calculateScoreForGame(game, guess)).toBe(2);
      });

      it('returns 2 for exact score match with correct penalty winner', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 4,
            away_penalty_score: 2
          }
        });
        const guess = createGuess({ 
          home_score: 1, 
          away_score: 1, 
          home_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(2);
      });

      it('returns 0 for exact score match with wrong penalty winner', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 4,
            away_penalty_score: 2
          }
        });
        const guess = createGuess({ 
          home_score: 1, 
          away_score: 1, 
          away_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 for exact score match with home penalty winner but no penalty flag set', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2,
            away_score: 2,
            home_penalty_score: 5,
            away_penalty_score: 3
          }
        });
        const guess = createGuess({ 
          home_score: 2, 
          away_score: 2
          // No penalty winner flags set
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 for exact score match with away penalty winner but no penalty flag set', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:0,
            away_score: 0,
            home_penalty_score: 2,
            away_penalty_score: 4
          }
        });
        const guess = createGuess({ 
          home_score: 0, 
          away_score: 0
          // No penalty winner flags set
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });
    });

    describe('correct outcome (wrong score)', () => {
      it('returns 1 for correct home win prediction', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:3,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 2, away_score: 0 }); // Different score but same outcome
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 for correct away win prediction', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:0,
            away_score: 2,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 1, away_score: 3 }); // Different score but same outcome
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 for correct tie prediction', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2,
            away_score: 2,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 1, away_score: 1 }); // Different score but same outcome
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 0 for correct outcome with wrong penalty winner in playoff', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 3,
            away_penalty_score: 1
          }
        });
        const guess = createGuess({ 
          home_score: 2, 
          away_score: 2, 
          away_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 for correct tie outcome with home penalty winner but no penalty flag set', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 4,
            away_penalty_score: 2
          }
        });
        const guess = createGuess({ 
          home_score: 2, 
          away_score: 2
          // No penalty winner flags set, but correct tie outcome
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 for correct tie outcome with away penalty winner but no penalty flag set', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:0,
            away_score: 0,
            home_penalty_score: 1,
            away_penalty_score: 3
          }
        });
        const guess = createGuess({ 
          home_score: 1, 
          away_score: 1
          // No penalty winner flags set, but correct tie outcome
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });
    });

    describe('playoff penalty scenarios', () => {
      it('returns 1 when playoff game was tied and guess predicted correct penalty winner via flag', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 4,
            away_penalty_score: 2
          }
        });
        const guess = createGuess({ 
          home_score: 2, 
          away_score: 0, 
          home_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 when playoff game was tied and guess predicted correct penalty winner via score', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 4,
            away_penalty_score: 2
          }
        });
        const guess = createGuess({ 
          home_score: 3, 
          away_score: 1
        });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 when playoff game was tied and guess predicted correct away penalty winner via flag', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 2,
            away_penalty_score: 4
          }
        });
        const guess = createGuess({ 
          home_score: 2, 
          away_score: 0, 
          away_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 when playoff game was tied and guess predicted correct away penalty winner via score', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 2,
            away_penalty_score: 4
          }
        });
        const guess = createGuess({ 
          home_score: 0, 
          away_score: 2
        });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 when guess was tie with home penalty but actual was home straight win', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ 
          home_score: 1, 
          away_score: 1, 
          home_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('returns 1 when guess was tie with away penalty but actual was away straight win', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 2,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ 
          home_score: 1, 
          away_score: 1, 
          away_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });
    });

    describe('wrong predictions', () => {
      it('returns 0 for completely wrong prediction', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:3,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 0, away_score: 2 }); // Predicted away win, actual home win
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });

      it('returns 0 for playoff with wrong penalty prediction', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 4,
            away_penalty_score: 2
          }
        });
        const guess = createGuess({ 
          home_score: 0, 
          away_score: 2, 
          away_penalty_winner: true 
        });
        expect(calculateScoreForGame(game, guess)).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('handles high scores correctly', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:10,
            away_score: 9,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 10, away_score: 9 });
        expect(calculateScoreForGame(game, guess)).toBe(2);
      });

      it('handles zero scores correctly', () => {
        const game = createGame({
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:0,
            away_score: 0,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 0, away_score: 0 });
        expect(calculateScoreForGame(game, guess)).toBe(2);
      });

      it('handles playoff without penalties correctly', () => {
        const game = createGame({
          game_type: 'playoff',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:2,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ home_score: 3, away_score: 0 });
        expect(calculateScoreForGame(game, guess)).toBe(1);
      });

      it('handles group game type correctly', () => {
        const game = createGame({
          game_type: 'group',
          gameResult: {
            game_id: '1',
            is_draft: false,
            home_score:1,
            away_score: 1,
            home_penalty_score: 0,
            away_penalty_score: 0
          }
        });
        const guess = createGuess({ 
          home_score: 2, 
          away_score: 2,
          home_penalty_winner: true // Should be ignored in group games
        });
        expect(calculateScoreForGame(game, guess)).toBe(1); // Correct tie prediction
      });
    });
  });
});
