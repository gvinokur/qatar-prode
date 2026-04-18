'use server'

import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import {Box} from "../../../../components/mui-wrappers/";
import {UnifiedGamesPage} from "../../../../components/unified-games-page";
import { buildTournamentMetadata } from '../../../../utils/metadata-utils'

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

  return buildTournamentMetadata(
    id,
    appName,
    (t) => `${t.long_name} | ${appName}`,
    (t) => tTournament('metadata.description', { name: t.long_name })
  )
}

export default async function TournamentGamesPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  return (
    <Box sx={{ height: '100%' }}>
      <UnifiedGamesPage tournamentId={tournamentId} />
    </Box>
  )
}
