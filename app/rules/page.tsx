import Rules from '../components/tournament-page/rules'
import { Container } from '@mui/material'

export default function RulesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Rules fullpage />
    </Container>
  )
} 