/**
 * Point calculation utility for game predictions with boost multipliers
 */

export type BoostType = 'silver' | 'golden' | null;

export interface PointCalculation {
  baseScore: number;
  multiplier: number;
  finalScore: number;
  description: string;
}

/**
 * Get the multiplier based on boost type
 */
function getBoostMultiplier(boostType: BoostType): number {
  switch (boostType) {
    case 'golden':
      return 3;
    case 'silver':
      return 2;
    default:
      return 1;
  }
}

/**
 * Get human-readable description for base score
 */
function getScoreDescription(baseScore: number): string {
  switch (baseScore) {
    case 0:
      return 'Miss';
    case 1:
      return 'Correct winner';
    case 2:
      return 'Exact score';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate final points from base score and boost type
 *
 * @param baseScore - Base score from prediction (0, 1, or 2)
 * @param boostType - Type of boost applied ('silver', 'golden', or null)
 * @returns Point calculation breakdown with final score
 */
export function calculateFinalPoints(
  baseScore: number,
  boostType: BoostType = null
): PointCalculation {
  const multiplier = getBoostMultiplier(boostType);
  const finalScore = baseScore * multiplier;
  const description = getScoreDescription(baseScore);

  return {
    baseScore,
    multiplier,
    finalScore,
    description,
  };
}

/**
 * Format boost display text
 */
export function formatBoostText(boostType: BoostType): string {
  switch (boostType) {
    case 'golden':
      return '3x Golden Boost';
    case 'silver':
      return '2x Silver Boost';
    default:
      return 'No Boost';
  }
}
