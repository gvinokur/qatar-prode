'use client'

import { Paper, Typography } from '@mui/material'
import { Team, TeamStats } from '@/app/db/tables-definition'
import TeamStandingsCards from './team-standings-cards'

type Props = {
  readonly teamStats: TeamStats[]
  readonly teamsMap: { [k: string]: Team }
  readonly qualifiedTeams?: { id: string }[]
}

export default function GroupTable({
  teamStats,
  teamsMap,
  qualifiedTeams = []
}: Props) {
  return (
    <Paper elevation={2} sx={{ p: 2 }} data-testid="group-table">
      <Typography variant="h6" gutterBottom>
        Tabla de Posiciones
      </Typography>
      <TeamStandingsCards
        teamStats={teamStats}
        teamsMap={teamsMap}
        qualifiedTeams={qualifiedTeams}
      />
    </Paper>
  )
}
