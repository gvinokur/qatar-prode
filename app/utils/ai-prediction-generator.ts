const BASE_LAMBDA = 1.2;
const K = 0.013;

/** Poisson sample using Knuth's algorithm with the provided RNG. */
function samplePoisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

/**
 * Generate a probabilistic score for a game using the Skellam model.
 * Each team's goals are sampled independently from Poisson(λ).
 * λ is derived from the rank difference:
 *   diff = awayRank − homeRank   (positive = home team is stronger)
 *   λHome = BASE_λ · exp(K · diff)
 *   λAway = BASE_λ · exp(−K · diff)
 *
 * rng defaults to Math.random; inject a deterministic function in tests.
 */
export function generateAIPrediction(
  homeRank: number | null | undefined,
  awayRank: number | null | undefined,
  isPlayoff: boolean,
  rng: () => number = Math.random
): { homeScore: number; awayScore: number; homePenaltyWinner?: boolean; awayPenaltyWinner?: boolean } {
  // Resolve ranks: if one is missing use the opponent's for both (diff = 0 → equal λ)
  const resolvedHome = homeRank ?? awayRank ?? 50;
  const resolvedAway = awayRank ?? homeRank ?? 50;

  const diff = resolvedAway - resolvedHome;
  const lambdaHome = BASE_LAMBDA * Math.exp(K * diff);
  const lambdaAway = BASE_LAMBDA * Math.exp(-K * diff);

  const homeScore = samplePoisson(lambdaHome, rng);
  const awayScore = samplePoisson(lambdaAway, rng);

  if (!isPlayoff || homeScore !== awayScore) {
    return { homeScore, awayScore };
  }

  // Playoff draw: determine penalty winner
  const absDiff = Math.abs(diff);
  // Stronger team (lower rank number → larger diff in their favour) wins with higher probability
  // min(75%, 50% + absDiff/3 %) — capped so it never goes above 75%
  const homeWinPct = Math.min(75, 50 + absDiff / 3) / 100;
  // home is stronger when diff > 0 (awayRank > homeRank → home lower rank = better)
  const homeWinProbability = diff >= 0 ? homeWinPct : 1 - homeWinPct;

  if (rng() < homeWinProbability) {
    return { homeScore, awayScore, homePenaltyWinner: true, awayPenaltyWinner: false };
  }
  return { homeScore, awayScore, homePenaltyWinner: false, awayPenaltyWinner: true };
}
