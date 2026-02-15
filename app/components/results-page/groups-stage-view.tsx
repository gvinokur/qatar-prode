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
 * Displays groups stage results in a responsive grid layout.
 * Shows one GroupResultCard per group.
 * Uses viewport breakpoints:
 * - 1 column for XS (<600px)
 * - 2 columns for S-M (≥600px)
 * - 3 columns for L+ (≥1200px)
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
    <Grid container spacing={2} sx={{ width: '100%' }}>
      {sortedGroups.map((group) => {
        // Filter games for this specific group
        const groupGames = games.filter(
          (game) => game.group?.tournament_group_id === group.id
        )

        return (
          <Grid
            key={group.id}
            size={{ xs: 12, sm: 6, lg: 4 }}
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
  )
}
