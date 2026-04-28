import { Stack } from '@mui/material'
import type { TournamentTiming } from '../../actions/hub-actions'
import { LoggedOffBanner } from '../tournament-page/public-cta-bar'
import { TournamentStartBanner } from './tournament-start-banner'
import { PreTournamentCountdown } from './pre-tournament-hero'

interface DashboardBannerProps {
  readonly user: { id?: string } | null | undefined
  readonly timing: TournamentTiming | null
}

export async function DashboardBanner({ user, timing }: DashboardBannerProps) {
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

  // Secondary layer: logged-off users only
  const secondary: React.ReactNode = user ? null : <LoggedOffBanner />

  if (!hero && !secondary) return null

  return (
    <Stack gap={2}>
      {hero}
      {secondary}
    </Stack>
  )
}
