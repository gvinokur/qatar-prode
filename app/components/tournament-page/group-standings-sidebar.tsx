'use client'

import { Card, CardHeader, CardContent, Tabs, Tab, Typography, useTheme } from '@mui/material'
import { useState } from 'react'
import TeamStandingsCards from '../groups-page/team-standings-cards'
import { Team, TeamStats } from '@/app/db/tables-definition'

interface GroupStandingsSidebarProps {
  groups: Array<{
    id: string
    letter: string
    teamStats: TeamStats[]      // Use TeamStats directly (from calculateGroupPosition)
    teamsMap: { [k: string]: Team }
  }>
  defaultGroupId: string
  qualifiedTeams: { id: string }[]  // Format expected by TeamStandingsCards
}

export default function GroupStandingsSidebar({ groups, defaultGroupId, qualifiedTeams }: GroupStandingsSidebarProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId)
  const theme = useTheme()

  // Handle empty groups
  if (!groups || groups.length === 0) {
    return null
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0]

  return (
    <Card>
      <CardHeader
        title="GROUP STANDINGS"
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`
        }}
      />
      <CardContent>
        {/* Tabs for group selection */}
        <Tabs
          value={selectedGroupId}
          onChange={(_, value) => setSelectedGroupId(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Group standings selector"
          sx={{
            mb: 2,
            '.MuiTab-root': {
              minWidth: '60px',
              fontWeight: 600,
            },
          }}
          slotProps={{
            indicator: {
              sx: {
                backgroundColor: theme.palette.primary.main,
              },
            },
          }}
        >
          {groups.map(group => (
            <Tab
              key={group.id}
              label={group.letter.toUpperCase()}
              value={group.id}
            />
          ))}
        </Tabs>

        {/* Group name header */}
        <Typography variant="h6" sx={{ mb: 1 }}>
          GRUPO {selectedGroup.letter.toUpperCase()}
        </Typography>

        {/* REUSE existing TeamStandingsCards component */}
        <TeamStandingsCards
          teamStats={selectedGroup.teamStats}
          teamsMap={selectedGroup.teamsMap}
          qualifiedTeams={qualifiedTeams}
        />
      </CardContent>
    </Card>
  )
}
