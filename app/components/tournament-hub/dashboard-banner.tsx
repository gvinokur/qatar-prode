import { Stack } from '@mui/material'
import { computeIsIncompleteUser } from '../../actions/hub-actions'
import type { ActionCenterData } from '../../actions/hub-actions'
import { LoggedOffBanner } from '../tournament-page/public-cta-bar'
import { TutorialCTACard } from './tutorial-cta-card'
import { TournamentStartBanner } from './tournament-start-banner'
import { PreTournamentCountdown } from './pre-tournament-hero'

interface DashboardBannerProps {
  readonly user: { id?: string } | null | undefined
  readonly data: ActionCenterData | null
}

export async function DashboardBanner({ user, data }: DashboardBannerProps) {
  // Hero layer: shown when tournament is about to start or just started
  let hero: React.ReactNode = null
  if (data?.tournamentJustStarted) {
    hero = <TournamentStartBanner />
  } else if (data && !data.tournamentHasStarted && data.firstGameDate !== null) {
    hero = (
      <PreTournamentCountdown
        firstGameDate={data.firstGameDate}
        tournamentName={data.tournamentName}
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
