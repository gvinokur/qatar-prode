import { describe, it, expect } from 'vitest';
import {
  calculateGamePositions,
  calculateConnectionPath,
  calculateBracketDimensions,
  BRACKET_CONSTANTS,
  type BracketRound,
  type GamePosition,
} from '@/app/components/results-page/bracket-layout-utils';
import { testFactories } from '@/__tests__/db/test-factories';

describe('bracket-layout-utils', () => {
  describe('BRACKET_CONSTANTS', () => {
    it('should have correct constant values', () => {
      expect(BRACKET_CONSTANTS).toEqual({
        GAME_CARD_HEIGHT: 80,
        GAME_CARD_WIDTH: 200,
        ROUND_SPACING: 300,
        BASE_VERTICAL_SPACING: 120,
        MOBILE_SCALE: 0.7,
      });
    });
  });

  describe('calculateGamePositions', () => {
    it('should position first round games at regular intervals', () => {
      // Create 4 games for first round
      const games = Array.from({ length: 4 }, (_, i) =>
        testFactories.game({ id: `game-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        {
          name: 'Round of 16',
          games,
          columnIndex: 0,
        },
      ];

      const positions = calculateGamePositions(rounds);

      expect(positions).toHaveLength(4);

      // All games should be at x=0 (first round)
      expect(positions[0]).toMatchObject({
        gameId: 'game-1',
        x: 0,
        y: 0,
        roundIndex: 0,
        gameIndexInRound: 0,
      });

      expect(positions[1]).toMatchObject({
        gameId: 'game-2',
        x: 0,
        y: BRACKET_CONSTANTS.BASE_VERTICAL_SPACING,
        roundIndex: 0,
        gameIndexInRound: 1,
      });

      expect(positions[2]).toMatchObject({
        gameId: 'game-3',
        x: 0,
        y: BRACKET_CONSTANTS.BASE_VERTICAL_SPACING * 2,
        roundIndex: 0,
        gameIndexInRound: 2,
      });

      expect(positions[3]).toMatchObject({
        gameId: 'game-4',
        x: 0,
        y: BRACKET_CONSTANTS.BASE_VERTICAL_SPACING * 3,
        roundIndex: 0,
        gameIndexInRound: 3,
      });
    });

    it('should position second round games at weighted midpoint between feeders', () => {
      // Create bracket: 4 first round games -> 2 second round games
      const firstRoundGames = Array.from({ length: 4 }, (_, i) =>
        testFactories.game({ id: `game-r1-${i + 1}` })
      );

      const secondRoundGames = Array.from({ length: 2 }, (_, i) =>
        testFactories.game({ id: `game-r2-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        { name: 'Round 1', games: firstRoundGames, columnIndex: 0 },
        { name: 'Round 2', games: secondRoundGames, columnIndex: 1 },
      ];

      const positions = calculateGamePositions(rounds);

      expect(positions).toHaveLength(6);

      // Second round first game: positioned between game 1 (y=0) and game 2 (y=120)
      // y = 0 + 0.25 * (120 - 0) = 30
      const secondRoundGame1 = positions.find((p) => p.gameId === 'game-r2-1');
      expect(secondRoundGame1).toMatchObject({
        gameId: 'game-r2-1',
        x: BRACKET_CONSTANTS.ROUND_SPACING,
        y: 30,
        roundIndex: 1,
        gameIndexInRound: 0,
      });

      // Second round second game: positioned between game 3 (y=240) and game 4 (y=360)
      // y = 240 + 0.25 * (360 - 240) = 270
      const secondRoundGame2 = positions.find((p) => p.gameId === 'game-r2-2');
      expect(secondRoundGame2).toMatchObject({
        gameId: 'game-r2-2',
        x: BRACKET_CONSTANTS.ROUND_SPACING,
        y: 270,
        roundIndex: 1,
        gameIndexInRound: 1,
      });
    });

    it('should position subsequent rounds using same weighted positioning', () => {
      // Create full bracket: 8 -> 4 -> 2 -> 1
      const round1Games = Array.from({ length: 8 }, (_, i) =>
        testFactories.game({ id: `game-r1-${i + 1}` })
      );
      const round2Games = Array.from({ length: 4 }, (_, i) =>
        testFactories.game({ id: `game-r2-${i + 1}` })
      );
      const round3Games = Array.from({ length: 2 }, (_, i) =>
        testFactories.game({ id: `game-r3-${i + 1}` })
      );
      const round4Games = [testFactories.game({ id: 'game-r4-1' })];

      const rounds: BracketRound[] = [
        { name: 'Round 1', games: round1Games, columnIndex: 0 },
        { name: 'Round 2', games: round2Games, columnIndex: 1 },
        { name: 'Round 3', games: round3Games, columnIndex: 2 },
        { name: 'Round 4', games: round4Games, columnIndex: 3 },
      ];

      const positions = calculateGamePositions(rounds);

      expect(positions).toHaveLength(15); // 8 + 4 + 2 + 1

      // Check round 3 positioning (should be weighted between round 2 games)
      const round3Game1 = positions.find((p) => p.gameId === 'game-r3-1');
      expect(round3Game1).toBeDefined();
      expect(round3Game1?.roundIndex).toBe(2);
      expect(round3Game1?.x).toBe(BRACKET_CONSTANTS.ROUND_SPACING * 2);

      // Check final game positioning
      const finalGame = positions.find((p) => p.gameId === 'game-r4-1');
      expect(finalGame).toBeDefined();
      expect(finalGame?.roundIndex).toBe(3);
      expect(finalGame?.x).toBe(BRACKET_CONSTANTS.ROUND_SPACING * 3);
    });

    it('should return correct GamePosition array structure', () => {
      const games = [
        testFactories.game({ id: 'game-1' }),
        testFactories.game({ id: 'game-2' }),
      ];

      const rounds: BracketRound[] = [
        { name: 'Round 1', games, columnIndex: 0 },
      ];

      const positions = calculateGamePositions(rounds);

      expect(positions).toHaveLength(2);
      positions.forEach((position) => {
        expect(position).toHaveProperty('gameId');
        expect(position).toHaveProperty('x');
        expect(position).toHaveProperty('y');
        expect(position).toHaveProperty('roundIndex');
        expect(position).toHaveProperty('gameIndexInRound');
        expect(typeof position.gameId).toBe('string');
        expect(typeof position.x).toBe('number');
        expect(typeof position.y).toBe('number');
        expect(typeof position.roundIndex).toBe('number');
        expect(typeof position.gameIndexInRound).toBe('number');
      });
    });

    it('should handle edge case with single feeder game', () => {
      // Create scenario where second round has a game with only one feeder
      const firstRoundGames = [testFactories.game({ id: 'game-r1-1' })];
      const secondRoundGames = [testFactories.game({ id: 'game-r2-1' })];

      const rounds: BracketRound[] = [
        { name: 'Round 1', games: firstRoundGames, columnIndex: 0 },
        { name: 'Round 2', games: secondRoundGames, columnIndex: 1 },
      ];

      const positions = calculateGamePositions(rounds);

      expect(positions).toHaveLength(2);

      // Second round game should be positioned at same y as the single feeder
      const secondRoundGame = positions.find((p) => p.gameId === 'game-r2-1');
      expect(secondRoundGame).toMatchObject({
        gameId: 'game-r2-1',
        x: BRACKET_CONSTANTS.ROUND_SPACING,
        y: 0, // Same as the single feeder game
        roundIndex: 1,
        gameIndexInRound: 0,
      });
    });

    it('should handle empty rounds gracefully', () => {
      const rounds: BracketRound[] = [];
      const positions = calculateGamePositions(rounds);
      expect(positions).toEqual([]);
    });
  });

  describe('calculateConnectionPath', () => {
    it('should generate valid SVG path string', () => {
      const fromPosition: GamePosition = {
        gameId: 'game-1',
        x: 0,
        y: 0,
        roundIndex: 0,
        gameIndexInRound: 0,
      };

      const toPosition: GamePosition = {
        gameId: 'game-2',
        x: 300,
        y: 120,
        roundIndex: 1,
        gameIndexInRound: 0,
      };

      const path = calculateConnectionPath(fromPosition, toPosition);

      // Path should start with 'M' (move to) and contain 'L' (line to) commands
      expect(path).toMatch(/^M \d+ \d+ L \d+ \d+ L \d+ \d+ L \d+ \d+$/);
    });

    it('should connect from right-center of from card to left-center of to card', () => {
      const fromPosition: GamePosition = {
        gameId: 'game-1',
        x: 0,
        y: 0,
        roundIndex: 0,
        gameIndexInRound: 0,
      };

      const toPosition: GamePosition = {
        gameId: 'game-2',
        x: 300,
        y: 120,
        roundIndex: 1,
        gameIndexInRound: 0,
      };

      const path = calculateConnectionPath(fromPosition, toPosition);

      // Calculate expected coordinates
      const x1 = fromPosition.x + BRACKET_CONSTANTS.GAME_CARD_WIDTH; // 0 + 200 = 200
      const y1 = fromPosition.y + BRACKET_CONSTANTS.GAME_CARD_HEIGHT / 2; // 0 + 40 = 40

      const x2 = toPosition.x; // 300
      const y2 = toPosition.y + BRACKET_CONSTANTS.GAME_CARD_HEIGHT / 2; // 120 + 40 = 160

      const midX = (x1 + x2) / 2; // (200 + 300) / 2 = 250

      const expectedPath = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      expect(path).toBe(expectedPath);
    });

    it('should create L-shaped path with correct format', () => {
      const fromPosition: GamePosition = {
        gameId: 'game-1',
        x: 0,
        y: 100,
        roundIndex: 0,
        gameIndexInRound: 0,
      };

      const toPosition: GamePosition = {
        gameId: 'game-2',
        x: 300,
        y: 200,
        roundIndex: 1,
        gameIndexInRound: 0,
      };

      const path = calculateConnectionPath(fromPosition, toPosition);

      // Path format: "M x1 y1 L midX y1 L midX y2 L x2 y2"
      const x1 = 200; // 0 + 200
      const y1 = 140; // 100 + 40
      const x2 = 300;
      const y2 = 240; // 200 + 40
      const midX = 250; // (200 + 300) / 2

      expect(path).toBe(`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    });

    it('should handle positions at same y coordinate', () => {
      const fromPosition: GamePosition = {
        gameId: 'game-1',
        x: 0,
        y: 100,
        roundIndex: 0,
        gameIndexInRound: 0,
      };

      const toPosition: GamePosition = {
        gameId: 'game-2',
        x: 300,
        y: 100, // Same y as from
        roundIndex: 1,
        gameIndexInRound: 0,
      };

      const path = calculateConnectionPath(fromPosition, toPosition);

      // When y coordinates are the same, the path should still be valid
      const x1 = 200;
      const y1 = 140;
      const x2 = 300;
      const y2 = 140; // Same y
      const midX = 250;

      expect(path).toBe(`M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    });

    it('should handle downward connections', () => {
      const fromPosition: GamePosition = {
        gameId: 'game-1',
        x: 0,
        y: 200,
        roundIndex: 0,
        gameIndexInRound: 1,
      };

      const toPosition: GamePosition = {
        gameId: 'game-2',
        x: 300,
        y: 100, // Higher up than from (downward connection)
        roundIndex: 1,
        gameIndexInRound: 0,
      };

      const path = calculateConnectionPath(fromPosition, toPosition);

      expect(path).toMatch(/^M \d+ \d+ L \d+ \d+ L \d+ \d+ L \d+ \d+$/);
      expect(path).toContain('L'); // Should contain line-to commands
    });
  });

  describe('calculateBracketDimensions', () => {
    it('should calculate correct width based on number of rounds', () => {
      const rounds: BracketRound[] = [
        { name: 'Round 1', games: [testFactories.game()], columnIndex: 0 },
        { name: 'Round 2', games: [testFactories.game()], columnIndex: 1 },
        { name: 'Round 3', games: [testFactories.game()], columnIndex: 2 },
      ];

      const { width } = calculateBracketDimensions(rounds);

      // Expected: 3 rounds * 300 spacing + 200 card width = 1100
      expect(width).toBe(1100);
    });

    it('should calculate correct height based on max games in first round', () => {
      const firstRoundGames = Array.from({ length: 8 }, (_, i) =>
        testFactories.game({ id: `game-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        { name: 'Round 1', games: firstRoundGames, columnIndex: 0 },
      ];

      const { height } = calculateBracketDimensions(rounds);

      // Expected: (8 - 1) * 120 spacing + 80 card height = 920
      expect(height).toBe(920);
    });

    it('should apply mobile scale factor when isMobile=true', () => {
      const rounds: BracketRound[] = [
        { name: 'Round 1', games: [testFactories.game()], columnIndex: 0 },
        { name: 'Round 2', games: [testFactories.game()], columnIndex: 1 },
      ];

      const desktop = calculateBracketDimensions(rounds, false);
      const mobile = calculateBracketDimensions(rounds, true);

      // Mobile should be 0.7x desktop
      expect(mobile.width).toBe(desktop.width * BRACKET_CONSTANTS.MOBILE_SCALE);
      expect(mobile.height).toBe(desktop.height * BRACKET_CONSTANTS.MOBILE_SCALE);
    });

    it('should account for third place game in height', () => {
      const firstRoundGames = Array.from({ length: 4 }, () => testFactories.game());

      const rounds: BracketRound[] = [
        { name: 'Round 1', games: firstRoundGames, columnIndex: 0 },
      ];

      const withoutThirdPlace = calculateBracketDimensions(rounds, false, false);
      const withThirdPlace = calculateBracketDimensions(rounds, false, true);

      // Third place adds: 150 spacing + 80 card height + 20 padding = 250
      expect(withThirdPlace.height).toBe(withoutThirdPlace.height + 250);
    });

    it('should handle 16 games (full bracket) correctly', () => {
      const firstRoundGames = Array.from({ length: 16 }, (_, i) =>
        testFactories.game({ id: `game-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        { name: 'Round of 16', games: firstRoundGames, columnIndex: 0 },
      ];

      const { height } = calculateBracketDimensions(rounds);

      // Expected: (16 - 1) * 120 + 80 = 1880
      expect(height).toBe(1880);
    });

    it('should handle 8 games correctly', () => {
      const firstRoundGames = Array.from({ length: 8 }, (_, i) =>
        testFactories.game({ id: `game-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        { name: 'Quarterfinals', games: firstRoundGames, columnIndex: 0 },
      ];

      const { height } = calculateBracketDimensions(rounds);

      // Expected: (8 - 1) * 120 + 80 = 920
      expect(height).toBe(920);
    });

    it('should handle 4 games correctly', () => {
      const firstRoundGames = Array.from({ length: 4 }, (_, i) =>
        testFactories.game({ id: `game-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        { name: 'Semifinals', games: firstRoundGames, columnIndex: 0 },
      ];

      const { height } = calculateBracketDimensions(rounds);

      // Expected: (4 - 1) * 120 + 80 = 440
      expect(height).toBe(440);
    });

    it('should handle 2 games correctly', () => {
      const firstRoundGames = Array.from({ length: 2 }, (_, i) =>
        testFactories.game({ id: `game-${i + 1}` })
      );

      const rounds: BracketRound[] = [
        { name: 'Finals', games: firstRoundGames, columnIndex: 0 },
      ];

      const { height } = calculateBracketDimensions(rounds);

      // Expected: (2 - 1) * 120 + 80 = 200
      expect(height).toBe(200);
    });

    it('should handle 1 game correctly', () => {
      const firstRoundGames = [testFactories.game()];

      const rounds: BracketRound[] = [
        { name: 'Final', games: firstRoundGames, columnIndex: 0 },
      ];

      const { height } = calculateBracketDimensions(rounds);

      // Expected: (1 - 1) * 120 + 80 = 80 (just the card height)
      expect(height).toBe(80);
    });

    it('should combine mobile scale and third place game correctly', () => {
      const firstRoundGames = Array.from({ length: 8 }, () => testFactories.game());

      const rounds: BracketRound[] = [
        { name: 'Round 1', games: firstRoundGames, columnIndex: 0 },
      ];

      const desktop = calculateBracketDimensions(rounds, false, false);
      const mobileWithThirdPlace = calculateBracketDimensions(rounds, true, true);

      // Desktop base: (8-1)*120 + 80 = 920
      // With third place: 920 + 250 = 1170
      // Mobile: 1170 * 0.7 = 819
      expect(mobileWithThirdPlace.height).toBe(819);
    });

    it('should handle empty rounds', () => {
      const rounds: BracketRound[] = [];
      const { width, height } = calculateBracketDimensions(rounds);

      // Width: 0 rounds * 300 + 200 = 200
      // Height: 0 (no first round)
      expect(width).toBe(200);
      expect(height).toBe(0);
    });

    it('should handle rounds with no games in first round', () => {
      const rounds: BracketRound[] = [
        { name: 'Round 1', games: [], columnIndex: 0 },
      ];

      const { width, height } = calculateBracketDimensions(rounds);

      // Width: 1 round * 300 + 200 = 500
      // Height: 0 games means (0-1)*120 + 80 = -40 (edge case with negative height)
      expect(width).toBe(500);
      expect(height).toBe(-40); // Edge case: empty first round produces negative height
    });

    it('should return correct structure with width and height', () => {
      const rounds: BracketRound[] = [
        { name: 'Round 1', games: [testFactories.game()], columnIndex: 0 },
      ];

      const dimensions = calculateBracketDimensions(rounds);

      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(typeof dimensions.width).toBe('number');
      expect(typeof dimensions.height).toBe('number');
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });
  });
});
