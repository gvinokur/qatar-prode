import { ExtendedGameData } from '@/app/definitions'
import { Team } from '@/app/db/tables-definition'
import { Typography, Box } from '@mui/material'
import { formatGameScore } from '@/app/utils/penalty-result-formatter'
import { getTeamDescription } from '@/app/utils/playoffs-rule-helper'
import { useTranslations } from 'next-intl'

interface MinimalisticGamesListProps {
  readonly games: ExtendedGameData[]
  readonly teamsMap: { readonly [k: string]: Team }
}

/**
 * Displays a simple read-only list of all games.
 * Shows team names (or placeholders) and scores including penalty shootouts.
 */
export default function MinimalisticGamesList({ games, teamsMap }: MinimalisticGamesListProps) {
  const t = useTranslations('predictions');

  // Sort all games by game number ascending
  const sortedGames = [...games].sort((a, b) => a.game_number - b.game_number)

  if (sortedGames.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        No hay partidos disponibles
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sortedGames.map((game) => {
        const homeTeam = game.home_team ? teamsMap[game.home_team] : null
        const awayTeam = game.away_team ? teamsMap[game.away_team] : null

        // Get team display text - use team name, or rule description (long form), or 'TBD'
        const homeTeamDisplay =
          homeTeam?.name || getTeamDescription(game.home_team_rule as any, t, false) || 'TBD'
        const awayTeamDisplay =
          awayTeam?.name || getTeamDescription(game.away_team_rule as any, t, false) || 'TBD'

        const scoreDisplay = formatGameScore(game)

        return (
          <Typography
            key={game.id}
            variant="body2"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 0.25,
            }}
          >
            <Box
              component="span"
              sx={{
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {homeTeamDisplay}
            </Box>
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                px: 2,
                minWidth: '80px',
                textAlign: 'center',
              }}
            >
              {scoreDisplay}
            </Box>
            <Box
              component="span"
              sx={{
                flex: 1,
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {awayTeamDisplay}
            </Box>
          </Typography>
        )
      })}
    </Box>
  )
}
