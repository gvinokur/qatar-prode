import { Metadata } from 'next'
import { findGamesInTournament } from '@/app/db/game-repository'
import { findPlayoffStagesWithGamesInTournament } from '@/app/db/tournament-playoff-repository'
import { getTeamsMap, getGroupStandingsForTournament } from '@/app/actions/tournament-actions'
import { Box, Typography } from '@/app/components/mui-wrappers'
import ResultsPageClient from '@/app/components/results-page/results-page-client'
import LoadingSkeleton from '@/app/components/results-page/loading-skeleton'
import { getTranslations, getLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { buildTournamentMetadata } from '@/app/utils/metadata-utils'

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
  const tTables = await getTranslations({ locale, namespace: 'tables' })
  const appName = tCommon('app.name')

  return buildTournamentMetadata(
    id,
    appName,
    (t) => `${tTables('results.title')} – ${t.long_name} | ${appName}`,
    (t) => tTables('metadata.description', { name: t.long_name })
  )
}

/**
 * Results & Tables page - Server Component.
 * Fetches all game results, group standings, and playoff data.
 * Displays Groups Stage and Playoffs views in tabs.
 */
export default async function ResultsPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id
  const t = await getTranslations('tables')

  try {
    // Fetch all data in parallel
    const [games, teamsMap, groupStandings, playoffStages] = await Promise.all([
      findGamesInTournament(tournamentId, false), // draftResult=false (only official results)
      getTeamsMap(tournamentId, 'tournament'),
      getGroupStandingsForTournament(tournamentId),
      findPlayoffStagesWithGamesInTournament(tournamentId),
    ])

    // Handle empty states
    const hasGroups = groupStandings.groups.length > 0
    const hasPlayoffs = playoffStages.length > 0

    // If no data at all, show empty state
    if (!hasGroups && !hasPlayoffs) {
      return (
        <Box sx={{ maxWidth: 'lg', mx: 'auto', py: 4, px: 2 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {t('results.unavailable')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('results.unavailableDescription')}
            </Typography>
          </Box>
        </Box>
      )
    }

    // Render the main results page
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
        }}
      >
        <Suspense fallback={<LoadingSkeleton />}>
          <ResultsPageClient
            groups={groupStandings.groups}
            qualifiedTeams={groupStandings.qualifiedTeams}
            games={games}
            teamsMap={teamsMap}
            playoffStages={playoffStages}
          />
        </Suspense>
      </Box>
    )
  } catch (error) {
    console.error('Error loading results page:', error)

    return (
      <Box sx={{ maxWidth: 'lg', mx: 'auto', py: 4, px: 2 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t('results.error')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('results.errorDescription')}
          </Typography>
        </Box>
      </Box>
    )
  }
}
