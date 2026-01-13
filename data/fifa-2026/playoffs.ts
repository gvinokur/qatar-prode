const playoff = (
  stage: string,
  order: number,
  games: number,
  is_final?: boolean,
  is_third_place?: boolean
) => ({
  stage,
  order,
  games,
  is_final,
  is_third_place,
});

/**
 * FIFA 2026 World Cup Playoff Structure
 *
 * The tournament features 6 knockout rounds:
 * - Round of 32: 16 matches (all group winners, runners-up, and best 8 third-place teams)
 * - Round of 16: 8 matches
 * - Quarter-finals: 4 matches
 * - Semi-finals: 2 matches
 * - Third Place: 1 match
 * - Final: 1 match
 *
 * Total: 32 knockout matches
 */
export const playoffs = [
  playoff('Round of 32', 1, 16),
  playoff('Round of 16', 2, 8),
  playoff('Quarter-finals', 3, 4),
  playoff('Semi-finals', 4, 2),
  playoff('Third Place', 5, 1, false, true),
  playoff('Final', 5, 1, true, false),
];
