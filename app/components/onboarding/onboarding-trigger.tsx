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

  // Debug: Log tournament data to verify fields are populated
  console.log('[OnboardingTrigger] Active tournament:', {
    id: activeTournament?.id,
    name: activeTournament?.short_name,
    hasScoring: {
      gameExact: activeTournament?.game_exact_score_points,
      gameOutcome: activeTournament?.game_correct_outcome_points,
      champion: activeTournament?.champion_points,
      silverBoosts: activeTournament?.max_silver_games,
      goldenBoosts: activeTournament?.max_golden_games,
    }
  })

  return <OnboardingDialog open={true} onClose={() => {}} tournament={activeTournament} />
}
