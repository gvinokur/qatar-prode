import OnboardingDialog from './onboarding-dialog'
import { getTournaments } from '@/app/actions/tournament-actions'

/**
 * Triggers the onboarding dialog
 * Loads active tournament configuration to display tournament-specific values
 */
export default async function OnboardingTrigger() {
  // Load active tournaments for user
  const tournaments = await getTournaments()

  // Use first active tournament (if available)
  const activeTournament = tournaments?.[0]

  return <OnboardingDialog open={true} onClose={() => {}} tournament={activeTournament} />
}
