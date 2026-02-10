'use client'

import {Card, CardContent, CardHeader, Stack, Box, Typography, useTheme, Button, Divider} from "@mui/material";
import {GameStatisticForUser} from "../../../types/definitions";
import {TournamentGuess} from "../../db/tables-definition";
import Link from "next/link";

type Props = {
  readonly userGameStatistics?: GameStatisticForUser
  readonly tournamentGuess?: TournamentGuess
  readonly tournamentId?: string
}

// Internal helper component for label/value pairs
interface StatRowProps {
  label: string
  value: string | number
  valueColor?: string
  bold?: boolean
}

function StatRow({ label, value, valueColor = 'text.primary', bold = true }: StatRowProps) {
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

export function UserTournamentStatistics({userGameStatistics, tournamentGuess, tournamentId} : Props) {
  const theme = useTheme()

  // Calculate direct totals (boost bonuses are included in the calculations)
  const groupsTotal = (userGameStatistics?.group_score || 0)
    + (userGameStatistics?.group_boost_bonus || 0)
    + (tournamentGuess?.qualified_teams_score || 0)
    + (tournamentGuess?.group_position_score || 0)

  const playoffsTotal = (userGameStatistics?.playoff_score || 0)
    + (userGameStatistics?.playoff_boost_bonus || 0)

  const qualifiedTotal = (tournamentGuess?.qualified_teams_score || 0)
    + (tournamentGuess?.group_position_score || 0)

  const awardsTotal = (tournamentGuess?.honor_roll_score || 0)
    + (tournamentGuess?.individual_awards_score || 0)

  const grandTotal = groupsTotal + playoffsTotal + awardsTotal

  return (
    <Card aria-label="Estadísticas del usuario">
      <CardHeader
        title='TUS ESTADÍSTICAS'
        sx={{ color: theme.palette.primary.main, borderBottom: `${theme.palette.primary.light} solid 1px`}}
      />
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

          <Divider sx={{ my: 1.5 }} />

          {tournamentId && (
            <Button
              component={Link}
              href={`/tournaments/${tournamentId}/stats`}
              variant="text"
              size="small"
              aria-label="Ver página de estadísticas detalladas"
              sx={{ textTransform: 'none' }}
            >
              Ver Estadísticas Detalladas
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
