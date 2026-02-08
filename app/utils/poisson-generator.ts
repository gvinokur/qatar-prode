/**
 * Poisson distribution score generator for realistic sports scores
 * Uses Knuth's algorithm for generating Poisson-distributed random numbers
 */

/**
 * Generates a random score following a Poisson distribution
 *
 * @param lambda - The average number of goals (λ parameter)
 * @returns A non-negative integer representing a score
 *
 * @example
 * generatePoissonScore(1.35) // Returns 0, 1, 2, 3, ... with probabilities following Poisson(1.35)
 */
export function generatePoissonScore(lambda: number): number {
  // Validate input
  if (lambda <= 0) {
    throw new Error('Lambda must be greater than 0');
  }

  // Handle very large lambda (prevent overflow)
  if (lambda > 700) {
    // For very large lambda, Poisson approaches normal distribution
    // Use normal approximation: N(lambda, lambda)
    const mean = lambda;
    const stdDev = Math.sqrt(lambda);
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const score = Math.round(mean + z * stdDev);
    return Math.max(0, score);
  }

  // Knuth's algorithm for Poisson distribution
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

interface MatchScore {
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
}

/**
 * Generates realistic match scores for both teams
 *
 * @param lambda - The average number of goals per team (default: 1.35)
 * @returns Match score object with home/away scores and penalty scores if tied in playoffs
 *
 * @example
 * generateMatchScore() // { homeScore: 2, awayScore: 1 }
 * generateMatchScore(1.35) // { homeScore: 0, awayScore: 0, homePenaltyScore: 4, awayPenaltyScore: 3 }
 */
export function generateMatchScore(lambda: number = 1.35): MatchScore {
  // Validate input
  if (lambda <= 0) {
    throw new Error('Lambda must be greater than 0');
  }

  // Generate independent scores for each team
  const homeScore = generatePoissonScore(lambda);
  const awayScore = generatePoissonScore(lambda);

  // For playoff games with tied scores, generate penalty shootout scores
  // Ties occur naturally from the Poisson distribution (~20-25% of games with λ=1.35)
  if (homeScore === awayScore) {
    // Generate penalty shootout scores
    // Use λ=3 for realistic penalty shootout (typically 3-5 penalties per team)
    const penaltyLambda = 3;
    let homePenaltyScore = Math.min(5, generatePoissonScore(penaltyLambda));
    let awayPenaltyScore = Math.min(5, generatePoissonScore(penaltyLambda));

    // Ensure there's a winner (add 1 to random team if tied)
    if (homePenaltyScore === awayPenaltyScore) {
      if (Math.random() < 0.5) {
        homePenaltyScore = Math.min(5, homePenaltyScore + 1);
      } else {
        awayPenaltyScore = Math.min(5, awayPenaltyScore + 1);
      }
    }

    return {
      homeScore,
      awayScore,
      homePenaltyScore,
      awayPenaltyScore
    };
  }

  // No penalties needed if scores differ
  return {
    homeScore,
    awayScore
  };
}
