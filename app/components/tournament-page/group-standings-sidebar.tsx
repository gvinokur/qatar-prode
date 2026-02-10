'use client'

import { Accordion, AccordionSummary, AccordionDetails, Tabs, Tab, Typography, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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
  const [expanded, setExpanded] = useState(true)
  const theme = useTheme()

  // Handle empty groups
  if (!groups || groups.length === 0) {
    return null
  }

  // Sort groups alphabetically by letter
  const sortedGroups = [...groups].sort((a, b) => a.letter.localeCompare(b.letter))

  const selectedGroup = sortedGroups.find(g => g.id === selectedGroupId) || sortedGroups[0]

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      defaultExpanded
      sx={{
        '&:before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="group-standings-content"
        id="group-standings-header"
        sx={{
          color: theme.palette.primary.main,
          borderBottom: expanded ? `${theme.palette.primary.light} solid 1px` : 'none',
          '& .MuiAccordionSummary-content': {
            margin: '12px 0',
          },
        }}
      >
        <Typography variant="h6" component="h2">
          Grupos
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
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
              backgroundColor: theme.palette.action.hover,
              borderRadius: 1,
              mx: 0.5,
              '&.Mui-selected': {
                backgroundColor: theme.palette.action.selected,
              },
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
          {sortedGroups.map(group => (
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
          compact={true}
        />
      </AccordionDetails>
    </Accordion>
  )
}
