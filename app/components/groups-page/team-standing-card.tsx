'use client'

import {
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  Typography,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { motion } from 'framer-motion'
import RankChangeIndicator from '@/app/components/leaderboard/RankChangeIndicator'
import type { TeamStandingCardProps } from './types'
import type { Team } from '@/app/db/tables-definition'

// Helper function to calculate card padding based on screen size
function getCardPadding(isUltraCompact: boolean, isCompact: boolean, compactMode: boolean) {
  if (compactMode) return { py: 0.75, px: 1.25 }
  if (isUltraCompact) return { py: 1, px: 1.5 }
  if (isCompact) return { py: 1.5, px: 1.5 }
  return { py: 2, px: 2.5 }
}

// Helper function to get team display name based on screen size
function getTeamDisplay(team: Team, isUltraCompact: boolean, compactMode: boolean) {
  if (compactMode || isUltraCompact) {
    return team.short_name || team.name.substring(0, 3).toUpperCase()
  }
  return team.name
}

// Helper function to generate accessible aria-label
function getAriaLabel(
  teamName: string,
  position: number,
  points: number,
  isExpanded: boolean
): string {
  const expandState = isExpanded ? 'Expanded' : 'Collapsed'
  const action = isExpanded ? 'collapse' : 'expand'
  return `${teamName}, rank ${position}, ${points} points. ${expandState}. Press Enter or Space to ${action}.`
}

// Helper function to format points display text
function getPointsDisplayText(
  points: number,
  gamesPlayed: number,
  goalDifference: number,
  isUltraCompact: boolean,
  compactMode: boolean
): string {
  if (compactMode || isUltraCompact) {
    return `${points} pts`
  }
  const gdSign = goalDifference >= 0 ? '+' : ''
  return `${points} pts (${gamesPlayed} PJ, ${gdSign}${goalDifference} DG)`
}

export default function TeamStandingCard({
  standing,
  isExpanded,
  onToggleExpand,
  rankChange,
  showRankChange,
  compact = false
}: TeamStandingCardProps) {
  const theme = useTheme()

  // Responsive breakpoints based on viewport (approximates container width)
  const isUltraCompact = useMediaQuery('(max-width:400px)')
  const isCompact = useMediaQuery('(max-width:600px)')

  // Calculate responsive values
  const cardPadding = getCardPadding(isUltraCompact, isCompact, compact)
  const teamDisplay = getTeamDisplay(standing.team, isUltraCompact, compact)
  const ariaLabel = getAriaLabel(standing.team.name, standing.position, standing.points, isExpanded)
  const pointsText = getPointsDisplayText(standing.points, standing.gamesPlayed, standing.goalDifference, isUltraCompact, compact)

  return (
    <motion.div
      layout
      transition={{
        layout: {
          duration: 0.6,
          ease: 'easeInOut'
        }
      }}
    >
      <Card
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleExpand()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        aria-expanded={isExpanded}
        sx={{
          ...cardPadding,
          mb: compact ? 0.75 : 1.5,
          borderRadius: compact ? 1.5 : 2,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: standing.isQualified
            ? alpha(theme.palette.success.main, 0.1)
            : 'inherit',
          elevation: 1,
          '&:hover': {
            elevation: 3,
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4]
          },
          '&:focus': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px'
          }
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.5 : (isUltraCompact ? 0.5 : 1.5) }}>
            {/* Rank Badge with Change Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: compact ? '35px' : (isUltraCompact ? '40px' : '60px') }}>
              <Typography
                variant={compact || isUltraCompact ? 'body1' : 'h6'}
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                  fontSize: compact ? '0.75rem' : (isUltraCompact ? '0.875rem' : undefined)
                }}
              >
                #{standing.position}
              </Typography>
              {showRankChange && !compact && !isUltraCompact && (
                <RankChangeIndicator change={rankChange ?? 0} size="small" />
              )}
            </Box>

            {/* Team Name/Code */}
            <Typography
              variant="body1"
              component="div"
              sx={{
                flex: 1,
                fontWeight: standing.isQualified ? 'bold' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: compact ? '0.75rem' : (isUltraCompact ? '0.875rem' : undefined)
              }}
              title={standing.team.name}
            >
              {teamDisplay}
            </Typography>

            {/* Points with PJ/DG (when collapsed) */}
            {!isExpanded && (
              <Typography
                variant={compact || isUltraCompact ? 'body2' : 'h6'}
                component="div"
                sx={{
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  fontSize: compact ? '0.75rem' : (isUltraCompact ? '0.875rem' : undefined)
                }}
              >
                {pointsText}
              </Typography>
            )}

            {/* Points only (when expanded) */}
            {isExpanded && (
              <Typography
                variant={compact || isUltraCompact ? 'body2' : 'h6'}
                component="div"
                sx={{
                  fontWeight: 'bold',
                  fontSize: compact ? '0.75rem' : (isUltraCompact ? '0.875rem' : undefined)
                }}
              >
                {standing.points} pts
              </Typography>
            )}
          </Box>

          {/* Expanded Details */}
          <Collapse in={isExpanded} timeout={300}>
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Estadísticas Detalladas
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Games Played */}
                <Typography variant="body2" color="text.secondary">
                  Partidos Jugados: {standing.gamesPlayed}
                </Typography>

                {/* Record */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Récord
                  </Typography>
                  <Typography variant="body2">
                    • Ganados: {standing.wins}
                  </Typography>
                  <Typography variant="body2">
                    • Empatados: {standing.draws}
                  </Typography>
                  <Typography variant="body2">
                    • Perdidos: {standing.losses}
                  </Typography>
                </Box>

                {/* Goals */}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Goles
                  </Typography>
                  <Typography variant="body2">
                    • Goles a Favor: {standing.goalsFor}
                  </Typography>
                  <Typography variant="body2">
                    • Goles en Contra: {standing.goalsAgainst}
                  </Typography>
                  <Typography variant="body2">
                    • Diferencia de Gol: {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference}
                  </Typography>
                </Box>

                {/* Conduct Score */}
                <Typography variant="body2" color="text.secondary">
                  Puntos de Conducta: {standing.conductScore}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  )
}
