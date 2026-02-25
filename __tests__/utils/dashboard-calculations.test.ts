import {
  calculateGamePredictions,
  calculateQualifiedTeamsPredictions,
  calculateFinalStandings,
  calculateAwards
} from '../../app/utils/dashboard-calculations';
import { ExtendedGameData } from '../../app/definitions';
import { GameGuessNew, TournamentGuessNew, QualifiedTeamPrediction } from '../../app/db/tables-definition';

describe('dashboard-calculations', () => {
  describe('calculateGamePredictions', () => {
    const mockGroupGame: ExtendedGameData = {
      id: 'game1',
      game_number: 1,
      tournament_id: 'tournament1',
      location_id: 'location1',
      home_score: null,
      away_score: null,
      group: { tournament_group_id: 'group1', group_letter: 'A' },
      playoffStage: null
    } as ExtendedGameData;

    const mockPlayoffGame: ExtendedGameData = {
      id: 'game2',
      game_number: 2,
      tournament_id: 'tournament1',
      location_id: 'location1',
      home_score: null,
      away_score: null,
      group: null,
      playoffStage: { tournament_playoff_round_id: 'playoff1', round_name: 'Final', is_final: true, is_third_place: false }
    } as ExtendedGameData;

    it('should return 0 when no games', () => {
      const result = calculateGamePredictions([], {});
      expect(result).toBe(0);
    });

    it('should return 0 when no guesses', () => {
      const result = calculateGamePredictions([mockGroupGame], {});
      expect(result).toBe(0);
    });

    it('should count group game with both scores', () => {
      const guess: GameGuessNew = {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 2,
        away_score: 1
      };

      const result = calculateGamePredictions([mockGroupGame], { game1: guess });
      expect(result).toBe(1);
    });

    it('should not count group game with only home score', () => {
      const guess: GameGuessNew = {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 2,
        away_score: null
      };

      const result = calculateGamePredictions([mockGroupGame], { game1: guess });
      expect(result).toBe(0);
    });

    it('should not count group game with only away score', () => {
      const guess: GameGuessNew = {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: null,
        away_score: 1
      };

      const result = calculateGamePredictions([mockGroupGame], { game1: guess });
      expect(result).toBe(0);
    });

    it('should count group game with tied scores (ties allowed in group stage)', () => {
      const guess: GameGuessNew = {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 1,
        away_score: 1
      };

      const result = calculateGamePredictions([mockGroupGame], { game1: guess });
      expect(result).toBe(1);
    });

    it('should count playoff game with decisive score', () => {
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 2,
        away_score: 1
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(1);
    });

    it('should NOT count playoff game with tied scores and no penalty winner', () => {
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(0);
    });

    it('should count playoff game with tied scores and home penalty winner', () => {
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: true,
        away_penalty_winner: false
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(1);
    });

    it('should count playoff game with tied scores and away penalty winner', () => {
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: true
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(1);
    });

    it('should handle playoff tie with undefined penalty winners as incomplete', () => {
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 1,
        away_score: 1
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(0);
    });

    it('should count multiple games correctly', () => {
      const games = [mockGroupGame, mockPlayoffGame];
      const guesses = {
        game1: {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 2,
          away_score: 1
        } as GameGuessNew,
        game2: {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 1,
          away_score: 1,
          home_penalty_winner: true,
          away_penalty_winner: false
        } as GameGuessNew
      };

      const result = calculateGamePredictions(games, guesses);
      expect(result).toBe(2);
    });

    it('should handle mix of complete and incomplete predictions', () => {
      const games = [mockGroupGame, mockPlayoffGame];
      const guesses = {
        game1: {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 2,
          away_score: 1
        } as GameGuessNew,
        game2: {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 1,
          away_score: 1
          // Missing penalty winner
        } as GameGuessNew
      };

      const result = calculateGamePredictions(games, guesses);
      expect(result).toBe(1); // Only game1 is complete
    });

    it('should handle 0-0 playoff tie with penalty winner', () => {
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 0,
        away_score: 0,
        home_penalty_winner: false,
        away_penalty_winner: true
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(1);
    });

    it('should handle both penalty winners true (invalid state but counted)', () => {
      // UI validation prevents this, but if it happens, count as complete
      const guess: GameGuessNew = {
        game_id: 'game2',
        game_number: 2,
        user_id: 'user1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: true,
        away_penalty_winner: true
      };

      const result = calculateGamePredictions([mockPlayoffGame], { game2: guess });
      expect(result).toBe(1);
    });
  });

  describe('calculateQualifiedTeamsPredictions', () => {
    it('should return 0 when map is empty', () => {
      const result = calculateQualifiedTeamsPredictions(new Map());
      expect(result).toBe(0);
    });

    it('should count teams with predicted_to_qualify = true', () => {
      const predictions = new Map<string, QualifiedTeamPrediction>([
        ['team1', {
          id: '1',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_id: 'team1',
          predicted_position: 1,
          predicted_to_qualify: true
        }]
      ]);

      const result = calculateQualifiedTeamsPredictions(predictions);
      expect(result).toBe(1);
    });

    it('should NOT count teams with predicted_to_qualify = false', () => {
      const predictions = new Map<string, QualifiedTeamPrediction>([
        ['team1', {
          id: '1',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_id: 'team1',
          predicted_position: 5,
          predicted_to_qualify: false
        }]
      ]);

      const result = calculateQualifiedTeamsPredictions(predictions);
      expect(result).toBe(0);
    });

    it('should count multiple qualifying teams', () => {
      const predictions = new Map<string, QualifiedTeamPrediction>([
        ['team1', {
          id: '1',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_id: 'team1',
          predicted_position: 1,
          predicted_to_qualify: true
        }],
        ['team2', {
          id: '2',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_id: 'team2',
          predicted_position: 2,
          predicted_to_qualify: true
        }],
        ['team3', {
          id: '3',
          user_id: 'user1',
          tournament_id: 'tournament1',
          group_id: 'group1',
          team_id: 'team3',
          predicted_position: 3,
          predicted_to_qualify: false
        }]
      ]);

      const result = calculateQualifiedTeamsPredictions(predictions);
      expect(result).toBe(2);
    });
  });

  describe('calculateFinalStandings', () => {
    it('should return 0 when tournamentGuesses is null', () => {
      const result = calculateFinalStandings(null);
      expect(result).toBe(0);
    });

    it('should return 0 when no standings are predicted', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1'
      };

      const result = calculateFinalStandings(tournamentGuesses);
      expect(result).toBe(0);
    });

    it('should count champion only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        champion_team_id: 'team1'
      };

      const result = calculateFinalStandings(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count runner-up only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        runner_up_team_id: 'team2'
      };

      const result = calculateFinalStandings(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count third place only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        third_place_team_id: 'team3'
      };

      const result = calculateFinalStandings(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count all three final standings', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        champion_team_id: 'team1',
        runner_up_team_id: 'team2',
        third_place_team_id: 'team3'
      };

      const result = calculateFinalStandings(tournamentGuesses);
      expect(result).toBe(3);
    });

    it('should not count individual awards', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        champion_team_id: 'team1',
        best_player_id: 'player1',
        top_goalscorer_player_id: 'player2'
      };

      const result = calculateFinalStandings(tournamentGuesses);
      expect(result).toBe(1); // Only champion
    });
  });

  describe('calculateAwards', () => {
    it('should return 0 when tournamentGuesses is null', () => {
      const result = calculateAwards(null);
      expect(result).toBe(0);
    });

    it('should return 0 when no awards are predicted', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(0);
    });

    it('should count top goalscorer only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        top_goalscorer_player_id: 'player1'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count best player only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        best_player_id: 'player2'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count best goalkeeper only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        best_goalkeeper_player_id: 'player3'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count best young player only', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        best_young_player_id: 'player4'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(1);
    });

    it('should count all four awards', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        top_goalscorer_player_id: 'player1',
        best_player_id: 'player2',
        best_goalkeeper_player_id: 'player3',
        best_young_player_id: 'player4'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(4);
    });

    it('should not count final standings', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        best_player_id: 'player1',
        champion_team_id: 'team1',
        runner_up_team_id: 'team2'
      };

      const result = calculateAwards(tournamentGuesses);
      expect(result).toBe(1); // Only best_player
    });

    it('should handle mix of awards and standings', () => {
      const tournamentGuesses: TournamentGuessNew = {
        tournament_id: 'tournament1',
        user_id: 'user1',
        champion_team_id: 'team1',
        runner_up_team_id: 'team2',
        third_place_team_id: 'team3',
        top_goalscorer_player_id: 'player1',
        best_player_id: 'player2'
      };

      const finalStandings = calculateFinalStandings(tournamentGuesses);
      const awards = calculateAwards(tournamentGuesses);

      expect(finalStandings).toBe(3); // Champion, runner-up, third place
      expect(awards).toBe(2); // Top goalscorer, best player
    });
  });
});
