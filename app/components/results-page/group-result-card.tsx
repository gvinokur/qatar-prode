'use client'

import { ExtendedGameData } from '@/app/definitions'
import { Team, TeamStats } from '@/app/db/tables-definition'
import {
  Card,
  CardHeader,
  CardContent,
  Collapse,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MinimalisticGamesList from './minimalistic-games-list'
import TeamStandingsCards from '../groups-page/team-standings-cards'
import { ExpandMore } from '../tournament-page/expand-more'
import { useState } from 'react'

interface GroupResultCardProps {
  readonly group: {
    readonly id: string
    readonly letter: string
    readonly teamStats: TeamStats[]
    readonly teamsMap: { readonly [k: string]: Team }
  }
  readonly games: ExtendedGameData[]
  readonly qualifiedTeams: ReadonlyArray<{ readonly id: string }>
}

/**
 * Card showing group games and standings.
 * Desktop: Always expanded, no collapse button.
 * Mobile: Collapsible with expand button in header.
 */
export default function GroupResultCard({
  group,
  games,
  qualifiedTeams,
}: GroupResultCardProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [expanded, setExpanded] = useState(true)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const content = (
    <>
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
    </>
  )

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={`GRUPO ${group.letter.toUpperCase()}`}
        titleTypographyProps={{ variant: 'h6', component: 'h3' }}
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`,
        }}
        action={
          isMobile ? (
            <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="mostrar más"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          ) : null
        }
      />
      <Collapse in={isMobile ? expanded : true} timeout="auto" unmountOnExit>
        <CardContent
          sx={{
            borderBottom: `${theme.palette.primary.contrastText} 1px solid`,
            borderTop: `${theme.palette.primary.contrastText} 1px solid`,
          }}
        >
          {content}
        </CardContent>
      </Collapse>
    </Card>
  )
}
