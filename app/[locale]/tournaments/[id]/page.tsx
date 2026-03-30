'use server'

import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import {Box} from "../../../components/mui-wrappers/";
import {UnifiedGamesPage} from "../../../components/unified-games-page";
import { findTournamentById } from '../../../db/tournament-repository'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tTournament = await getTranslations({ locale, namespace: 'tournament' })
  const appName = tCommon('app.name')

  try {
    const tournament = await findTournamentById(id)
    if (!tournament) return { title: appName }

    const title = `${tournament.long_name} | ${appName}`
    const description = tTournament('metadata.description', { name: tournament.long_name })

    return {
      title,
      description,
      openGraph: {
        type: 'website',
        title,
        description,
        images: [{ url: '/web-app-manifest-512x512.png', width: 512, height: 512 }],
      },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: appName }
  }
}

export default async function TournamentLandingPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  return (
    <Box sx={{ height: '100%' }}>
      <UnifiedGamesPage tournamentId={tournamentId} />
    </Box>
  )
}
