// mark as client component
'use server'

import Home from '../components/home/home-component'
import {getTournaments} from "../actions/tournament-actions";
import {getGroupsForUser} from "../actions/prode-group-actions";
import {getLoggedInUser} from "../actions/user-actions";
import {getOnboardingStatus} from "../db/onboarding-repository";
import OnboardingTrigger from "../components/onboarding/onboarding-trigger";

type ServerHomeProps = {
  readonly searchParams: Promise<{ showOnboarding?: string }>
}

export default async function ServerHome({ searchParams }: ServerHomeProps) {

  const tournaments = await getTournaments();
  const prodeGroups = await getGroupsForUser()
  const user = await getLoggedInUser()

  // Force show onboarding for testing with ?showOnboarding=true
  const params = await searchParams
  const forceShowOnboarding = params?.showOnboarding === 'true'

  // Check if user needs onboarding (new users who haven't completed it)
  const needsOnboarding = user && !(await getOnboardingStatus(user.id))?.onboarding_completed
  const shouldShowOnboarding = forceShowOnboarding || needsOnboarding

  return (
    <>
      {shouldShowOnboarding && <OnboardingTrigger />}
      <Home tournaments={tournaments} groups={prodeGroups}></Home>
    </>
  )
}
