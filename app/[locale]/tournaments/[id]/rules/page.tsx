'use server'

import { Metadata } from 'next'
import { Box } from '@mui/material'
import Rules, { ScoringConfig } from '../../../../components/tournament-page/rules'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { buildTournamentMetadata, findTournamentByIdCached } from '../../../../utils/metadata-utils'
import { findFirstGameInTournament } from '../../../../db/game-repository'
import JsonLd from '../../../../components/shared/json-ld'
import { buildBreadcrumbListJsonLd } from '../../../../utils/json-ld-utils'

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
  const tRules = await getTranslations({ locale, namespace: 'rules' })
  const appName = tCommon('app.name')

  return buildTournamentMetadata(
    id,
    appName,
    (t) => `${tRules('title')} – ${t.long_name} | ${appName}`,
    (t) => tRules('metadata.description', { name: t.long_name })
  )
}

export default async function TournamentRulesPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id
  const locale = await getLocale()
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tRules = await getTranslations({ locale, namespace: 'rules' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Server Component pattern: Import repository directly, fetch data, pass as props
  const [tournament, firstGame] = await Promise.all([
    findTournamentByIdCached(tournamentId),
    findFirstGameInTournament(tournamentId),
  ])

  if (!tournament) {
    redirect('/es')
  }

  // Compute the QT/Awards lock date: 5 days after the first game
  const LOCK_OFFSET_MS = 5 * 24 * 60 * 60 * 1000
  const lockDate = firstGame?.game_date
    ? new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(firstGame.game_date.getTime() + LOCK_OFFSET_MS)
      )
    : undefined

  // Extract scoring config from tournament
  const scoringConfig: ScoringConfig = {
    game_exact_score_points: tournament.game_exact_score_points ?? 3,
    game_correct_goal_difference_points: tournament.game_correct_goal_difference_points ?? 2,
    game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
    champion_points: tournament.champion_points ?? 5,
    runner_up_points: tournament.runner_up_points ?? 3,
    third_place_points: tournament.third_place_points ?? 1,
    individual_award_points: tournament.individual_award_points ?? 3,
    qualified_team_points: tournament.qualified_team_points ?? 1,
    exact_position_qualified_points: tournament.exact_position_qualified_points ?? 2,
    max_silver_games: tournament.max_silver_games ?? 0,
    max_golden_games: tournament.max_golden_games ?? 0,
  }

  return (
    <>
      <JsonLd data={buildBreadcrumbListJsonLd([
        { name: tCommon('breadcrumb.home'), url: `${appUrl}/${locale}` },
        { name: tournament.long_name, url: `${appUrl}/${locale}/tournaments/${tournamentId}` },
        { name: tRules('title'), url: `${appUrl}/${locale}/tournaments/${tournamentId}/rules` },
      ])} />
      <Box sx={{ pt: 2 }}>
        <Rules fullpage scoringConfig={scoringConfig} lockDate={lockDate} />
      </Box>
    </>
  )
}
