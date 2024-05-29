const playoff = (stage: string, order: number, games: number, is_final?: boolean, is_third_place?: boolean) => ({
  stage,
  order,
  games,
  is_final,
  is_third_place
})
export const playoffs = [
  playoff('Cuartos de Final', 1, 4),
  playoff('Semifinal', 2, 2),
  playoff('Final', 3, 1, true),
  playoff('Tercer Puesto', 3, 1, false, true)
]
