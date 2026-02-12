'use client'

import { ExtendedGameData } from '@/app/definitions'
import { Team, PlayoffRound } from '@/app/db/tables-definition'
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useMemo } from 'react'
import BracketGameCard from './bracket-game-card'
import {
  BracketRound,
  calculateGamePositions,
  calculateConnectionPath,
  calculateBracketDimensions,
  BRACKET_CONSTANTS,
} from './bracket-layout-utils'

interface PlayoffsBracketViewProps {
  readonly playoffStages: ReadonlyArray<
    PlayoffRound & { readonly games: ReadonlyArray<{ readonly game_id: string }> }
  >
  readonly games: ExtendedGameData[]
  readonly teamsMap: { readonly [k: string]: Team }
}

/**
 * Displays playoff bracket with SVG connection lines.
 * Horizontally scrollable on all screen sizes.
 */
export default function PlayoffsBracketView({
  playoffStages,
  games,
  teamsMap,
}: PlayoffsBracketViewProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Create games map for quick lookup
  const gamesMap = useMemo(() => {
    const map: { [key: string]: ExtendedGameData } = {}
    games.forEach((game) => {
      map[game.id] = game
    })
    return map
  }, [games])

  // Organize playoff stages into bracket rounds (exclude third place)
  const bracketRounds: BracketRound[] = useMemo(() => {
    const mainStages = playoffStages.filter((stage) => !stage.is_third_place)

    return mainStages.map((stage, index) => ({
      name: stage.round_name,
      games: stage.games
        .map((g) => gamesMap[g.game_id])
        .filter((g) => g !== undefined), // Filter out any missing games
      columnIndex: index,
    }))
  }, [playoffStages, gamesMap])

  // Find third place playoff separately
  const thirdPlaceStage = playoffStages.find((stage) => stage.is_third_place)
  const thirdPlaceGame = thirdPlaceStage
    ? gamesMap[thirdPlaceStage.games[0]?.game_id]
    : null

  // Calculate positions and connections
  const gamePositions = useMemo(
    () => calculateGamePositions(bracketRounds),
    [bracketRounds]
  )

  const connectionPaths = useMemo(() => {
    const paths: string[] = []

    // For each round (except the last), connect pairs of games to next round
    bracketRounds.forEach((round, roundIndex) => {
      if (roundIndex === bracketRounds.length - 1) return // Skip last round (no connections)

      const currentRoundPositions = gamePositions.filter((p) => p.roundIndex === roundIndex)
      const nextRoundPositions = gamePositions.filter((p) => p.roundIndex === roundIndex + 1)

      // Connect pairs of current round games to single next round game
      for (let i = 0; i < nextRoundPositions.length; i++) {
        const game1 = currentRoundPositions[i * 2]
        const game2 = currentRoundPositions[i * 2 + 1]
        const nextGame = nextRoundPositions[i]

        if (game1 && nextGame) {
          paths.push(calculateConnectionPath(game1, nextGame))
        }
        if (game2 && nextGame) {
          paths.push(calculateConnectionPath(game2, nextGame))
        }
      }
    })

    return paths
  }, [gamePositions, bracketRounds])

  const dimensions = useMemo(
    () => calculateBracketDimensions(bracketRounds, isMobile, !!thirdPlaceGame),
    [bracketRounds, isMobile, thirdPlaceGame]
  )

  if (bracketRounds.length === 0 && !thirdPlaceGame) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Los playoffs aún no comenzaron
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          El cuadro de eliminatorias se mostrará aquí cuando estén disponibles
        </Typography>
      </Box>
    )
  }

  const scale = isMobile ? BRACKET_CONSTANTS.MOBILE_SCALE : 1

  return (
    <Box>
      {/* Main bracket (if any rounds exist) */}
      {bracketRounds.length > 0 && (
        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'auto',
            position: 'relative',
            minHeight: `${dimensions.height + 100}px`,
            // Use vh fallback, with dvh for better mobile support (accounts for dynamic browser UI)
            // Subtract: header (56px) + page title+margin (64px) + tabs+margin (72px) + bottom nav on mobile (56px) + padding (32px)
            maxHeight: { xs: 'calc(100vh - 280px)', md: 'calc(100vh - 224px)' },
            '@supports (height: 100dvh)': {
              maxHeight: { xs: 'calc(100dvh - 280px)', md: 'calc(100dvh - 224px)' }
            },
            pb: 4,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* SVG overlay for connection lines */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: dimensions.width,
              height: dimensions.height,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            {connectionPaths.map((path, idx) => (
              <path
                key={idx}
                d={path}
                stroke={theme.palette.divider}
                strokeWidth={2}
                fill="none"
                opacity={0.5}
                transform={`scale(${scale})`}
              />
            ))}
          </svg>

          {/* Game cards layer */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {gamePositions.map((pos) => {
              const game = gamesMap[pos.gameId]
              if (!game) return null

              return (
                <Box
                  key={pos.gameId}
                  sx={{
                    position: 'absolute',
                    left: pos.x * scale,
                    top: pos.y * scale,
                    transform: isMobile ? `scale(${BRACKET_CONSTANTS.MOBILE_SCALE})` : 'none',
                    transformOrigin: 'top left',
                  }}
                >
                  <BracketGameCard game={game} teamsMap={teamsMap} />
                </Box>
              )
            })}

            {/* Third place playoff (below final) */}
            {thirdPlaceGame && gamePositions.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  left: gamePositions[gamePositions.length - 1].x * scale,
                  top: (gamePositions[gamePositions.length - 1].y + 150) * scale,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: isMobile ? `scale(${BRACKET_CONSTANTS.MOBILE_SCALE})` : 'none',
                  transformOrigin: 'top left',
                }}
              >
                <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                  3er Lugar
                </Typography>
                <BracketGameCard game={thirdPlaceGame} teamsMap={teamsMap} />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
