'use client'

import { Paper, Typography } from '@mui/material'
import { Team, TeamStats } from '@/app/db/tables-definition'
import TeamStandingsCards from './team-standings-cards'

type Props = {
  readonly teamStats: TeamStats[]
  readonly teamsMap: { [k: string]: Team }
  readonly qualifiedTeams?: Team[]
}

export default function GroupTable({
  teamStats,
  teamsMap,
  qualifiedTeams = []
}: Props) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Standings
      </Typography>
      <TeamStandingsCards
        teamStats={teamStats}
        teamsMap={teamsMap}
        qualifiedTeams={qualifiedTeams}
      />
    </Paper>
  )
}
