import { ExtendedGameData } from '@/app/definitions'
import { Team } from '@/app/db/tables-definition'
import { Typography, Box } from '@mui/material'
import { formatGameScore } from '@/app/utils/penalty-result-formatter'

interface MinimalisticGamesListProps {
  readonly games: ExtendedGameData[]
  readonly teamsMap: { readonly [k: string]: Team }
}

/**
 * Displays a simple read-only list of finished game results.
 * Shows team names and scores including penalty shootouts.
 */
export default function MinimalisticGamesList({ games, teamsMap }: MinimalisticGamesListProps) {
  // Filter to only finished games (have scores and date has passed)
  const finishedGames = games.filter((game) => {
    const hasScores =
      typeof game.gameResult?.home_score === 'number' &&
      typeof game.gameResult?.away_score === 'number'
    const hasPassed = game.game_date < new Date()
    return hasScores && hasPassed
  })

  // Sort by game number ascending
  const sortedGames = [...finishedGames].sort((a, b) => a.game_number - b.game_number)

  if (sortedGames.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        No hay resultados disponibles todavía
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {sortedGames.map((game) => {
        const homeTeam = game.home_team ? teamsMap[game.home_team] : null
        const awayTeam = game.away_team ? teamsMap[game.away_team] : null

        const homeTeamDisplay = homeTeam?.name || 'TBD'
        const awayTeamDisplay = awayTeam?.name || 'TBD'

        const scoreDisplay = formatGameScore(game)

        return (
          <Typography
            key={game.id}
            variant="body2"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 0.5,
            }}
          >
            <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
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
            <Box component="span" sx={{ flex: 1, textAlign: 'right' }}>
              {awayTeamDisplay}
            </Box>
          </Typography>
        )
      })}
    </Box>
  )
}
