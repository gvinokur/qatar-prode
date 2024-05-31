const playoff = (stage: string, order: number, games: number, is_final?: boolean, is_third_place?: boolean) => ({
  stage,
  order,
  games,
  is_final,
  is_third_place
})
export const playoffs = [
  playoff('Octavos de Final', 1, 8),
  playoff('Cuartos de Final', 2, 4),
  playoff('Semifinal', 3, 2),
  playoff('Final', 4, 1, true),
  playoff('Tercer Puesto', 4, 1, false, true)
]
