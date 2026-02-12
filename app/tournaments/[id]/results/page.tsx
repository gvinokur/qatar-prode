import { findGamesInTournament } from '@/app/db/game-repository'
import { findPlayoffStagesWithGamesInTournament } from '@/app/db/tournament-playoff-repository'
import { getTeamsMap, getGroupStandingsForTournament } from '@/app/actions/tournament-actions'
import { Box, Typography } from '@/app/components/mui-wrappers'
import ResultsPageClient from '@/app/components/results-page/results-page-client'
import LoadingSkeleton from '@/app/components/results-page/loading-skeleton'
import { Suspense } from 'react'

type Props = {
  readonly params: Promise<{
    id: string
  }>
}

/**
 * Results & Tables page - Server Component.
 * Fetches all game results, group standings, and playoff data.
 * Displays Groups Stage and Playoffs views in tabs.
 */
export default async function ResultsPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

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
              Resultados no disponibles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Los resultados se mostrarán aquí cuando los partidos comiencen
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
          maxWidth: '868px',
          mx: { md: 'auto' },
          width: '100%',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ mb: 2, py: 2, textAlign: 'center' }}
        >
          Resultados y Tablas
        </Typography>

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
            Error al cargar resultados
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Por favor, intenta nuevamente más tarde
          </Typography>
        </Box>
      </Box>
    )
  }
}
