import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  getGameUrgencyLevel,
  getTournamentUrgencyLevel,
  getUrgencyIcon,
  hasUrgentGames,
  UrgencyLevel
} from '../../app/components/urgency-helpers';
import { TournamentPredictionCompletion } from '../../app/db/tables-definition';
import type { ExtendedGameData } from '../../app/definitions';

describe('urgency-helpers', () => {
  describe('getGameUrgencyLevel', () => {
    const createGame = (gameDate: Date, id: string = '1'): ExtendedGameData => ({
      id,
      game_date: gameDate,
      home_team_id: 'team1',
      away_team_id: 'team2',
      tournament_id: 'tournament1',
      group_id: null,
      home_score: null,
      away_score: null,
      is_finished: false,
      created_at: new Date(),
      game_type: 'group'
    } as ExtendedGameData);

    it('returns "complete" when games array is empty', () => {
      expect(getGameUrgencyLevel([], {})).toBe('complete');
    });

    it('returns "complete" when games is undefined', () => {
      expect(getGameUrgencyLevel(undefined, {})).toBe('complete');
    });

    it('returns "locked" when all games are closed', () => {
      const now = Date.now();
      const pastGame = createGame(new Date(now - 3 * 60 * 60 * 1000)); // 3 hours ago

      expect(getGameUrgencyLevel([pastGame], {})).toBe('locked');
    });

    it('returns "complete" when all games are predicted', () => {
      const now = Date.now();
      const futureGame = createGame(new Date(now + 24 * 60 * 60 * 1000)); // 24 hours from now

      const gameGuesses = {
        '1': { home_score: 2, away_score: 1 }
      };

      expect(getGameUrgencyLevel([futureGame], gameGuesses)).toBe('complete');
    });

    it('returns "urgent" when unpredicted game closes in less than 2 hours', () => {
      const now = Date.now();
      const urgentGame = createGame(new Date(now + 1.5 * 60 * 60 * 1000)); // 1.5 hours from now

      expect(getGameUrgencyLevel([urgentGame], {})).toBe('urgent');
    });

    it('returns "warning" when unpredicted game closes in less than 24 hours', () => {
      const now = Date.now();
      const warningGame = createGame(new Date(now + 12 * 60 * 60 * 1000)); // 12 hours from now

      expect(getGameUrgencyLevel([warningGame], {})).toBe('warning');
    });

    it('returns "notice" when unpredicted game closes in less than 48 hours', () => {
      const now = Date.now();
      const noticeGame = createGame(new Date(now + 36 * 60 * 60 * 1000)); // 36 hours from now

      expect(getGameUrgencyLevel([noticeGame], {})).toBe('notice');
    });

    it('returns "complete" when unpredicted game closes in more than 48 hours', () => {
      const now = Date.now();
      const distantGame = createGame(new Date(now + 72 * 60 * 60 * 1000)); // 72 hours from now

      expect(getGameUrgencyLevel([distantGame], {})).toBe('complete');
    });

    it('prioritizes urgent over warning and notice', () => {
      const now = Date.now();
      const urgentGame = createGame(new Date(now + 1.5 * 60 * 60 * 1000), '1');
      const warningGame = createGame(new Date(now + 12 * 60 * 60 * 1000), '2');
      const noticeGame = createGame(new Date(now + 36 * 60 * 60 * 1000), '3');

      expect(getGameUrgencyLevel([urgentGame, warningGame, noticeGame], {})).toBe('urgent');
    });

    it('prioritizes warning over notice', () => {
      const now = Date.now();
      const warningGame = createGame(new Date(now + 12 * 60 * 60 * 1000), '1');
      const noticeGame = createGame(new Date(now + 36 * 60 * 60 * 1000), '2');

      expect(getGameUrgencyLevel([warningGame, noticeGame], {})).toBe('warning');
    });

    it('ignores predicted games in urgency calculation', () => {
      const now = Date.now();
      const urgentGame = createGame(new Date(now + 1.5 * 60 * 60 * 1000), '1');
      const predictedUrgentGame = createGame(new Date(now + 1.5 * 60 * 60 * 1000), '2');

      const gameGuesses = {
        '2': { home_score: 2, away_score: 1 }
      };

      expect(getGameUrgencyLevel([urgentGame, predictedUrgentGame], gameGuesses)).toBe('urgent');
    });

    it('validates guess has numeric scores', () => {
      const now = Date.now();
      const game = createGame(new Date(now + 1.5 * 60 * 60 * 1000));

      const invalidGuess = {
        '1': { home_score: null, away_score: 1 }
      };

      expect(getGameUrgencyLevel([game], invalidGuess)).toBe('urgent');
    });
  });

  describe('getTournamentUrgencyLevel', () => {
    const createTournamentPredictions = (
      overallPercentage: number,
      isPredictionLocked: boolean
    ): TournamentPredictionCompletion => ({
      overallPercentage,
      isPredictionLocked,
      championPercentage: 0,
      runnerUpPercentage: 0,
      thirdPlacePercentage: 0,
      groupWinnersPercentage: 0,
      roundOf16Percentage: 0,
      quarterFinalsPercentage: 0,
      semiFinalsPercentage: 0
    });

    it('returns "complete" when tournament predictions are undefined', () => {
      expect(getTournamentUrgencyLevel(undefined, new Date())).toBe('complete');
    });

    it('returns "locked" when predictions are locked', () => {
      const predictions = createTournamentPredictions(50, true);
      expect(getTournamentUrgencyLevel(predictions, new Date())).toBe('locked');
    });

    it('returns "complete" when 100% predicted', () => {
      const predictions = createTournamentPredictions(100, false);
      expect(getTournamentUrgencyLevel(predictions, new Date())).toBe('complete');
    });

    it('returns "complete" when start date is undefined', () => {
      const predictions = createTournamentPredictions(50, false);
      expect(getTournamentUrgencyLevel(predictions, undefined)).toBe('complete');
    });

    it('returns "locked" when past lock time', () => {
      const now = new Date();
      const pastStart = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const predictions = createTournamentPredictions(50, false);

      expect(getTournamentUrgencyLevel(predictions, pastStart)).toBe('locked');
    });

    it('returns "urgent" when less than 2 hours until lock', () => {
      const now = new Date();
      // Lock is 5 days after start, so for lock in 1 hour: start = now - (5 days - 1 hour)
      const startDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000));
      const predictions = createTournamentPredictions(50, false);

      expect(getTournamentUrgencyLevel(predictions, startDate)).toBe('urgent');
    });

    it('returns "warning" when less than 24 hours until lock', () => {
      const now = new Date();
      // Lock is 5 days after start, so for lock in 12 hours: start = now - (5 days - 12 hours)
      const startDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 12 * 60 * 60 * 1000));
      const predictions = createTournamentPredictions(50, false);

      expect(getTournamentUrgencyLevel(predictions, startDate)).toBe('warning');
    });

    it('returns "notice" when less than 48 hours until lock', () => {
      const now = new Date();
      // Lock is 5 days after start, so for lock in 36 hours: start = now - (5 days - 36 hours)
      const startDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 36 * 60 * 60 * 1000));
      const predictions = createTournamentPredictions(50, false);

      expect(getTournamentUrgencyLevel(predictions, startDate)).toBe('notice');
    });

    it('returns "complete" when more than 48 hours until lock', () => {
      const now = new Date();
      // Lock is 5 days after start, so for lock in 72 hours: start = now - (5 days - 72 hours)
      const startDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000 - 72 * 60 * 60 * 1000));
      const predictions = createTournamentPredictions(50, false);

      expect(getTournamentUrgencyLevel(predictions, startDate)).toBe('complete');
    });
  });

  describe('getUrgencyIcon', () => {
    it('returns error icon for urgent level', () => {
      const { container } = render(<>{getUrgencyIcon('urgent')}</>);
      expect(container.querySelector('svg[data-testid="ErrorIcon"]')).toBeInTheDocument();
    });

    it('returns warning icon for warning level', () => {
      const { container } = render(<>{getUrgencyIcon('warning')}</>);
      expect(container.querySelector('svg[data-testid="WarningIcon"]')).toBeInTheDocument();
    });

    it('returns info icon for notice level', () => {
      const { container } = render(<>{getUrgencyIcon('notice')}</>);
      expect(container.querySelector('svg[data-testid="InfoIcon"]')).toBeInTheDocument();
    });

    it('returns check circle icon for complete level', () => {
      const { container } = render(<>{getUrgencyIcon('complete')}</>);
      expect(container.querySelector('svg[data-testid="CheckCircleIcon"]')).toBeInTheDocument();
    });

    it('returns lock icon for locked level', () => {
      const { container } = render(<>{getUrgencyIcon('locked')}</>);
      expect(container.querySelector('svg[data-testid="LockIcon"]')).toBeInTheDocument();
    });

    it('applies correct color for urgent', () => {
      const { container } = render(<>{getUrgencyIcon('urgent')}</>);
      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('MuiSvgIcon-root');
    });
  });

  describe('hasUrgentGames', () => {
    const createGame = (gameDate: Date, id: string = '1'): ExtendedGameData => ({
      id,
      game_date: gameDate,
      home_team_id: 'team1',
      away_team_id: 'team2',
      tournament_id: 'tournament1',
      group_id: null,
      home_score: null,
      away_score: null,
      is_finished: false,
      created_at: new Date(),
      game_type: 'group'
    } as ExtendedGameData);

    it('returns false when games array is empty', () => {
      expect(hasUrgentGames([], {})).toBe(false);
    });

    it('returns false when games is undefined', () => {
      expect(hasUrgentGames(undefined, {})).toBe(false);
    });

    it('returns true when unpredicted game closes within 48 hours', () => {
      const now = Date.now();
      const urgentGame = createGame(new Date(now + 24 * 60 * 60 * 1000)); // 24 hours from now

      expect(hasUrgentGames([urgentGame], {})).toBe(true);
    });

    it('returns false when game is already predicted', () => {
      const now = Date.now();
      const game = createGame(new Date(now + 24 * 60 * 60 * 1000));

      const gameGuesses = {
        '1': { home_score: 2, away_score: 1 }
      };

      expect(hasUrgentGames([game], gameGuesses)).toBe(false);
    });

    it('returns false when all games are beyond 48 hours', () => {
      const now = Date.now();
      const distantGame = createGame(new Date(now + 72 * 60 * 60 * 1000)); // 72 hours from now

      expect(hasUrgentGames([distantGame], {})).toBe(false);
    });

    it('returns false when game is already closed', () => {
      const now = Date.now();
      const pastGame = createGame(new Date(now - 3 * 60 * 60 * 1000)); // 3 hours ago

      expect(hasUrgentGames([pastGame], {})).toBe(false);
    });

    it('returns true if at least one unpredicted game is within 48 hours', () => {
      const now = Date.now();
      const urgentGame = createGame(new Date(now + 24 * 60 * 60 * 1000), '1');
      const distantGame = createGame(new Date(now + 72 * 60 * 60 * 1000), '2');

      expect(hasUrgentGames([urgentGame, distantGame], {})).toBe(true);
    });

    it('validates guess has both home and away scores', () => {
      const now = Date.now();
      const game = createGame(new Date(now + 24 * 60 * 60 * 1000));

      const invalidGuess = {
        '1': { home_score: 2, away_score: null }
      };

      expect(hasUrgentGames([game], invalidGuess)).toBe(true);
    });
  });
});
