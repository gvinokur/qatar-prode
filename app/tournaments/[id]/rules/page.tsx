'use server'

import { Container } from '@mui/material'
import Rules, { ScoringConfig } from '../../../components/tournament-page/rules'
import { findTournamentById } from '../../../db/tournament-repository'
import { redirect } from 'next/navigation'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentRulesPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  // Server Component pattern: Import repository directly, fetch data, pass as props
  const tournament = await findTournamentById(tournamentId)

  if (!tournament) {
    redirect('/')
  }

  // Extract scoring config from tournament
  const scoringConfig: ScoringConfig = {
    game_exact_score_points: tournament.game_exact_score_points ?? 2,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    champion_points: tournament.champion_points ?? 5,
    runner_up_points: tournament.runner_up_points ?? 3,
    third_place_points: tournament.third_place_points ?? 1,
    individual_award_points: tournament.individual_award_points ?? 3,
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 2,
    max_silver_games: tournament.max_silver_games ?? 0,
    max_golden_games: tournament.max_golden_games ?? 0,
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Rules fullpage scoringConfig={scoringConfig} />
    </Container>
  )
}
