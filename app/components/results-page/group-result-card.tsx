'use client'

import { ExtendedGameData } from '@/app/definitions'
import { Team, TeamStats } from '@/app/db/tables-definition'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  useTheme,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MinimalisticGamesList from './minimalistic-games-list'
import TeamStandingsCards from '../groups-page/team-standings-cards'

interface GroupResultCardProps {
  readonly group: {
    readonly id: string
    readonly letter: string
    readonly teamStats: TeamStats[]
    readonly teamsMap: { readonly [k: string]: Team }
  }
  readonly games: ExtendedGameData[]
  readonly qualifiedTeams: ReadonlyArray<{ readonly id: string }>
  readonly defaultExpanded?: boolean
}

/**
 * Collapsible card showing group games and standings.
 * Uses Accordion for mobile collapsibility.
 */
export default function GroupResultCard({
  group,
  games,
  qualifiedTeams,
  defaultExpanded = false,
}: GroupResultCardProps) {
  const theme = useTheme()

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      sx={{
        '&:before': {
          display: 'none',
        },
        mb: 2,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`group-${group.id}-content`}
        id={`group-${group.id}-header`}
        sx={{
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
          fontWeight: 600,
          '& .MuiAccordionSummary-content': {
            margin: '12px 0',
          },
        }}
      >
        <Typography variant="h6" component="h3">
          GRUPO {group.letter.toUpperCase()}
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 2 }}>
        {/* Games list section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Partidos:
          </Typography>
          <MinimalisticGamesList games={games} teamsMap={group.teamsMap} />
        </Box>

        {/* Standings table section */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            📊 Tabla de Posiciones:
          </Typography>
          <TeamStandingsCards
            teamStats={group.teamStats}
            teamsMap={group.teamsMap}
            qualifiedTeams={qualifiedTeams}
            compact={true}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
