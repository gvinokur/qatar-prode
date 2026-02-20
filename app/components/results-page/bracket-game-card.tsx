import { ExtendedGameData } from '@/app/definitions'
import { Team } from '@/app/db/tables-definition'
import { Paper, Typography, Box } from '@mui/material'
import { formatPenaltyResult } from '@/app/utils/penalty-result-formatter'
import { getGameWinner } from '@/app/utils/score-utils'
import { getTeamDescription } from '@/app/utils/playoffs-rule-helper'
import { useTranslations } from 'next-intl'

interface BracketGameCardProps {
  readonly game: ExtendedGameData
  readonly teamsMap: { readonly [k: string]: Team }
}

/**
 * Minimalistic game card for playoff bracket display.
 * Shows team names with scores.
 * Highlights the winner and displays penalty shootout results.
 */
export default function BracketGameCard({ game, teamsMap }: BracketGameCardProps) {
  const t = useTranslations('predictions');
  const homeTeam = game.home_team ? teamsMap[game.home_team] : null
  const awayTeam = game.away_team ? teamsMap[game.away_team] : null

  // Get team display text - use full team name, or rule description, or 'TBD'
  const homeTeamDisplay =
    homeTeam?.name || getTeamDescription(game.home_team_rule as any, t, false) || 'TBD'
  const awayTeamDisplay =
    awayTeam?.name || getTeamDescription(game.away_team_rule as any, t, false) || 'TBD'

  const homeScore = game.gameResult?.home_score ?? '-'
  const awayScore = game.gameResult?.away_score ?? '-'

  const penaltyResult = formatPenaltyResult(game)

  // Determine winner for highlighting
  const winner = getGameWinner(game)
  const homeIsWinner = winner === game.home_team
  const awayIsWinner = winner === game.away_team

  return (
    <Paper
      elevation={2}
      sx={{
        width: 200,
        height: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: 1,
        backgroundColor: 'background.paper',
      }}
    >
      {/* Home team row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: homeIsWinner ? 700 : 400,
            color: homeIsWinner ? 'primary.main' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {homeTeamDisplay}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: homeIsWinner ? 700 : 500,
            minWidth: '30px',
            textAlign: 'center',
          }}
        >
          {homeScore}
        </Typography>
      </Box>

      {/* Away team row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: awayIsWinner ? 700 : 400,
            color: awayIsWinner ? 'primary.main' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {awayTeamDisplay}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: awayIsWinner ? 700 : 500,
            minWidth: '30px',
            textAlign: 'center',
          }}
        >
          {awayScore}
        </Typography>
      </Box>

      {/* Penalty result (if applicable) */}
      {penaltyResult && (
        <Typography
          variant="caption"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mt: 0.5,
            fontSize: '0.7rem',
          }}
        >
          {penaltyResult}
        </Typography>
      )}
    </Paper>
  )
}
