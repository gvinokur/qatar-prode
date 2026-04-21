'use server'

import { Box, Paper, Stack, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import HistoryIcon from '@mui/icons-material/History'
import { DashboardCard } from '@/app/components/tournament-hub/dashboard-card'

export default async function TournamentHubPage() {
  return (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Banner Area — full-width Stack */}
      <Stack gap={2}>
        <Paper
          variant="outlined"
          sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed', color: 'text.secondary' }}
        >
          <Typography variant="body2">Banner Area — full-width (Hero, Onboarding, etc.)</Typography>
        </Paper>
      </Stack>

      {/* Widget Grid — CSS Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 2 }}>
        <DashboardCard title="Games" icon={<SportsSoccerIcon />} count="3 pending" urgent>
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
        <DashboardCard title="Standings" icon={<EmojiEventsIcon />}>
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
        <DashboardCard title="Groups" icon={<GroupsIcon />} count="2 groups">
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
        <DashboardCard title="Results" icon={<HistoryIcon />}>
          <Typography variant="body2" color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Typography>
        </DashboardCard>
      </Box>

    </Box>
  )
}
