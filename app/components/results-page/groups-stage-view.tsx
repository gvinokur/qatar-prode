import { ExtendedGameData } from '@/app/definitions'
import { Team, TeamStats } from '@/app/db/tables-definition'
import { Grid, Typography, Box } from '@mui/material'
import GroupResultCard from './group-result-card'

interface GroupsStageViewProps {
  readonly groups: ReadonlyArray<{
    readonly id: string
    readonly letter: string
    readonly teamStats: TeamStats[]
    readonly teamsMap: { readonly [k: string]: Team }
  }>
  readonly games: ExtendedGameData[]
  readonly qualifiedTeams: ReadonlyArray<{ readonly id: string }>
}

/**
 * Displays groups stage results in a responsive grid layout using container queries.
 * Shows one GroupResultCard per group.
 * - 1 column for containers < 350px
 * - 2 columns for containers 350px-549px
 * - 3 columns for containers ≥ 550px
 */
export default function GroupsStageView({ groups, games, qualifiedTeams }: GroupsStageViewProps) {
  // Sort groups alphabetically by letter
  const sortedGroups = [...groups].sort((a, b) => a.letter.localeCompare(b.letter))

  if (sortedGroups.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No hay grupos configurados
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Los grupos se mostrarán aquí cuando estén disponibles
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      width: '100%',
      // Enable container queries on this element
      containerType: 'inline-size',
      containerName: 'groups-stage-grid'
    }}>
      <Grid container spacing={2}>
        {sortedGroups.map((group) => {
          // Filter games for this specific group
          const groupGames = games.filter(
            (game) => game.group?.tournament_group_id === group.id
          )

          return (
            <Grid
              key={group.id}
              sx={{
                // Use container queries instead of viewport breakpoints
                // Default: 1 column (100%)
                width: '100%',
                // 2 columns when container is at least 350px wide
                '@container groups-stage-grid (min-width: 350px)': {
                  width: '50%'
                },
                // 3 columns when container is at least 550px wide
                '@container groups-stage-grid (min-width: 550px)': {
                  width: '33.333333%'
                }
              }}
            >
              <GroupResultCard
                group={group}
                games={groupGames}
                qualifiedTeams={qualifiedTeams}
              />
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
