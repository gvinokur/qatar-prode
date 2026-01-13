'use server'

import { Container } from '@mui/material'
import Rules from '../../../components/tournament-page/rules'
import { getTournamentScoringConfig } from '../../../actions/tournament-actions'
import { redirect } from 'next/navigation'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export default async function TournamentRulesPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  // Fetch scoring config using server action (not direct repository import)
  const scoringConfig = await getTournamentScoringConfig(tournamentId)

  if (!scoringConfig) {
    redirect('/')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Rules fullpage scoringConfig={scoringConfig} />
    </Container>
  )
}
