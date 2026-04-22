import { Stack } from '@mui/material'
import { computeIsIncompleteUser } from '../../actions/hub-actions'
import type { ActionCenterData, TournamentTiming } from '../../actions/hub-actions'
import { LoggedOffBanner } from '../tournament-page/public-cta-bar'
import { TutorialCTACard } from './tutorial-cta-card'
import { TournamentStartBanner } from './tournament-start-banner'
import { PreTournamentCountdown } from './pre-tournament-hero'

interface DashboardBannerProps {
  readonly user: { id?: string } | null | undefined
  readonly timing: TournamentTiming | null
  readonly data: ActionCenterData | null
}

export async function DashboardBanner({ user, timing, data }: DashboardBannerProps) {
  // Hero layer: uses public timing data so it shows even for logged-out users
  let hero: React.ReactNode = null
  if (timing?.tournamentJustStarted) {
    hero = <TournamentStartBanner />
  } else if (timing && !timing.tournamentHasStarted && timing.firstGameDate !== null) {
    hero = (
      <PreTournamentCountdown
        firstGameDate={timing.firstGameDate}
        tournamentName={timing.tournamentName}
      />
    )
  }

  // Secondary layer: shown based on user auth/completion state
  let secondary: React.ReactNode = null
  if (!user) {
    secondary = <LoggedOffBanner />
  } else if (data && (await computeIsIncompleteUser(data))) {
    secondary = <TutorialCTACard fullWidth />
  }

  if (!hero && !secondary) return null

  return (
    <Stack gap={2}>
      {hero}
      {secondary}
    </Stack>
  )
}
