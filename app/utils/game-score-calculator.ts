import {GameGuessNew} from "../db/tables-definition";
import {ExtendedGameData} from "../definitions";

// Define scoring config type
interface ScoringConfig {
  game_exact_score_points: number;
  game_correct_outcome_points: number;
}

/**
 * Validates that both game result and guess have valid scores
 */
const hasValidScores = (game: ExtendedGameData, gameGuess: GameGuessNew): boolean => {
  return !!(
    game.gameResult &&
    typeof game.gameResult.home_score === 'number' &&
    Number.isInteger(game.gameResult.home_score) &&
    typeof game.gameResult.away_score === 'number' &&
    Number.isInteger(game.gameResult.away_score) &&
    gameGuess &&
    typeof gameGuess.home_score === 'number' &&
    Number.isInteger(gameGuess.home_score) &&
    typeof gameGuess.away_score === 'number' &&
    Number.isInteger(gameGuess.away_score)
  )
}

/**
 * Determines penalty winners for playoff games
 */
const getPenaltyWinners = (game: ExtendedGameData, isPlayoff: boolean, isTie: boolean) => {
  let homePenaltyWin = false;
  let awayPenaltyWin = false;

  if (isPlayoff && isTie) {
    // @ts-ignore
    homePenaltyWin = (game.gameResult.home_penalty_score > game.gameResult.away_penalty_score)
    // @ts-ignore
    awayPenaltyWin = (game.gameResult.home_penalty_score < game.gameResult.away_penalty_score)
  }

  return { homePenaltyWin, awayPenaltyWin }
}

/**
 * Checks for exact score match
 */
const checkExactMatch = (
  gameHomeScore: number,
  gameAwayScore: number,
  gameGuess: GameGuessNew,
  homePenaltyWin: boolean,
  awayPenaltyWin: boolean,
  exactScorePoints: number
): number | null => {
  if (gameHomeScore === gameGuess.home_score && gameAwayScore === gameGuess.away_score) {
    // If penalty guess is wrong, no points
    if ((homePenaltyWin && !gameGuess.home_penalty_winner) || (awayPenaltyWin && !gameGuess.away_penalty_winner)) {
      return 0;
    }
    return exactScorePoints;
  }
  return null;
}

/**
 * Checks for correct winner/outcome
 */
const checkCorrectOutcome = (
  gameHomeScore: number,
  gameAwayScore: number,
  gameGuess: GameGuessNew,
  homePenaltyWin: boolean,
  awayPenaltyWin: boolean,
  correctOutcomePoints: number
): number | null => {
  if (Math.sign(gameHomeScore - gameAwayScore) === Math.sign(gameGuess.home_score! - gameGuess.away_score!)) {
    // If penalty guess is wrong, no points
    if ((homePenaltyWin && !gameGuess.home_penalty_winner) || (awayPenaltyWin && !gameGuess.away_penalty_winner)) {
      return 0;
    }
    return correctOutcomePoints;
  }
  return null;
}

/**
 * Checks special playoff penalty scenarios
 */
const checkPlayoffPenaltyScenarios = (
  gameScores: { homeScore: number; awayScore: number },
  gameGuess: GameGuessNew,
  gameFlags: { isPlayoff: boolean; isTie: boolean; guessTie: boolean },
  penaltyFlags: { homePenaltyWin: boolean; awayPenaltyWin: boolean },
  correctOutcomePoints: number
): number | null => {
  const { isPlayoff, isTie, guessTie } = gameFlags;
  const { homePenaltyWin, awayPenaltyWin } = penaltyFlags;
  const { homeScore: gameHomeScore, awayScore: gameAwayScore } = gameScores;

  // Playoff game was tied, guess predicted the penalty winner
  if (isPlayoff && isTie &&
    (((homePenaltyWin && (gameGuess.home_penalty_winner || gameGuess.home_score! > gameGuess.away_score!)) ||
      (awayPenaltyWin && (gameGuess.away_penalty_winner || gameGuess.home_score! < gameGuess.away_score!))))) {
    return correctOutcomePoints;
  }

  // Guess was tie with penalty, actual game was straight win
  if (isPlayoff && guessTie &&
    ((gameGuess.home_penalty_winner && (gameHomeScore > gameAwayScore)) ||
      (gameGuess.away_penalty_winner && (gameHomeScore < gameAwayScore)))) {
    return correctOutcomePoints;
  }

  return null;
}

export const calculateScoreForGame = (
  game: ExtendedGameData,
  gameGuess: GameGuessNew,
  scoringConfig: ScoringConfig = { game_exact_score_points: 2, game_correct_outcome_points: 1 }
) => {
  if (!hasValidScores(game, gameGuess)) {
    return 0;
  }

  const gameHomeScore = game.gameResult!.home_score!;
  const gameAwayScore = game.gameResult!.away_score!;

  const isPlayoff = game.game_type !== 'group';
  const isTie = (gameHomeScore === gameAwayScore);
  const guessTie = (gameGuess.home_score === gameGuess.away_score);

  const { homePenaltyWin, awayPenaltyWin } = getPenaltyWinners(game, isPlayoff, isTie);

  // Check for exact match
  const exactMatch = checkExactMatch(
    gameHomeScore,
    gameAwayScore,
    gameGuess,
    homePenaltyWin,
    awayPenaltyWin,
    scoringConfig.game_exact_score_points
  );
  if (exactMatch !== null) return exactMatch;

  // Check for correct outcome
  const correctOutcome = checkCorrectOutcome(
    gameHomeScore,
    gameAwayScore,
    gameGuess,
    homePenaltyWin,
    awayPenaltyWin,
    scoringConfig.game_correct_outcome_points
  );
  if (correctOutcome !== null) return correctOutcome;

  // Check special playoff penalty scenarios
  const penaltyScenario = checkPlayoffPenaltyScenarios(
    { homeScore: gameHomeScore, awayScore: gameAwayScore },
    gameGuess,
    { isPlayoff, isTie, guessTie },
    { homePenaltyWin, awayPenaltyWin },
    scoringConfig.game_correct_outcome_points
  );
  if (penaltyScenario !== null) return penaltyScenario;

  return 0;
}
