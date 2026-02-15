'use client'

import {Card, CardContent, CardHeader, CardActions, Stack, Box, Typography, useTheme, Button, Divider, Collapse} from "@mui/material";
import {ExpandMore as ExpandMoreIcon, BarChart as BarChartIcon} from "@mui/icons-material";
import {useState} from "react";
import {GameStatisticForUser} from "../../../types/definitions";
import {TournamentGuess} from "../../db/tables-definition";
import Link from "next/link";
import {ExpandMore} from './expand-more';

type Props = {
  readonly userGameStatistics?: GameStatisticForUser
  readonly tournamentGuess?: TournamentGuess
  readonly tournamentId?: string
  readonly isActive?: boolean
}

// Internal helper component for label/value pairs
interface StatRowProps {
  readonly label: string
  readonly value: string | number
  readonly valueColor?: string
  readonly bold?: boolean
}

function StatRow({ label, value, valueColor = 'text.primary', bold = true }: Readonly<StatRowProps>) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        color={valueColor}
        fontWeight={bold ? 700 : 400}
      >
        {value}
      </Typography>
    </Box>
  )
}

export function UserTournamentStatistics({userGameStatistics, tournamentGuess, tournamentId, isActive = false} : Props) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  // Calculate direct totals (boost bonuses are included in the calculations)
  // Groups: only game predictions from group phase
  const groupsTotal = (userGameStatistics?.group_score || 0)
    + (userGameStatistics?.group_boost_bonus || 0)

  // Playoffs: game predictions from playoff phase
  const playoffsTotal = (userGameStatistics?.playoff_score || 0)
    + (userGameStatistics?.playoff_boost_bonus || 0)

  // Qualified: qualified teams + group positions predictions
  const qualifiedTotal = (tournamentGuess?.qualified_teams_score || 0)
    + (tournamentGuess?.group_position_score || 0)

  // Awards: honor roll + individual awards predictions
  const awardsTotal = (tournamentGuess?.honor_roll_score || 0)
    + (tournamentGuess?.individual_awards_score || 0)

  const grandTotal = groupsTotal + playoffsTotal + qualifiedTotal + awardsTotal

  return (
    <Card aria-label="Estadísticas del usuario" sx={{
      ...(isActive && {
        borderLeft: 3,
        borderColor: 'primary.main',
        backgroundColor: 'action.selected',
      })
    }}>
      <CardHeader
        title='Tus Estadísticas'
        subheader={isActive ? 'Estás aquí' : undefined}
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
        action={
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="mostrar más"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        }
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <StatRow label="Grupos:" value={`${groupsTotal} pts`} />
          <StatRow label="Playoffs:" value={`${playoffsTotal} pts`} />
          <StatRow label="Clasificados:" value={`${qualifiedTotal} pts`} />
          <StatRow label="Premios:" value={`${awardsTotal} pts`} />

          <Divider sx={{ my: 1.5 }} />

          <StatRow
            label="Total:"
            value={`${grandTotal} pts`}
            valueColor={theme.palette.primary.main}
          />
        </Stack>
      </CardContent>
      </Collapse>
      {tournamentId && (
        <CardActions sx={{ justifyContent: 'center', px: 2, py: 1.5 }}>
          <Button
            component={Link}
            href={`/tournaments/${tournamentId}/stats`}
            startIcon={<BarChartIcon />}
            variant="text"
            color="primary"
            aria-label="Ver página de estadísticas detalladas"
          >
            Ver Detalle
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
