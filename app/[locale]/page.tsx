// mark as client component
'use server'

import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '../utils/metadata-utils'
import {getTournaments} from "../actions/tournament-actions";
import {getLoggedInUser} from "../actions/user-actions";
import {getOnboardingStatus} from "../db/onboarding-repository";
import OnboardingTrigger from "../components/onboarding/onboarding-trigger";
import EmptyTournamentsState from "../components/tournament/empty-tournaments-state";
import TournamentRedirect from "../components/home/tournament-redirect";

type ServerHomeProps = {
  readonly searchParams: Promise<{ showOnboarding?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'common' })
  const appName = t('app.name')
  const description = t('home.metadata.description')

  return buildPageMetadata(appName, description)
}

export default async function ServerHome({ searchParams }: ServerHomeProps) {

  const tournaments = await getTournaments();
  const user = await getLoggedInUser()

  // Force show onboarding for testing with ?showOnboarding=true
  const params = await searchParams
  const forceShowOnboarding = params?.showOnboarding === 'true'

  // Check if user needs onboarding (new users who haven't completed it)
  const needsOnboarding = user && !(await getOnboardingStatus(user.id))?.onboarding_completed
  const shouldShowOnboarding = forceShowOnboarding || needsOnboarding

  // Check if there are active tournaments
  if (tournaments.length === 0) {
    return (
      <>
        {shouldShowOnboarding && <OnboardingTrigger />}
        <EmptyTournamentsState />
      </>
    )
  }

  return (
    <>
      {shouldShowOnboarding && <OnboardingTrigger />}
      <TournamentRedirect tournaments={tournaments} />
    </>
  )
}
