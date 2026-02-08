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

export default function TeamStandingCard({
  standing,
  isExpanded,
  onToggleExpand,
  rankChange,
  showRankChange
}: TeamStandingCardProps) {
  const theme = useTheme()

  // Responsive breakpoints based on viewport (approximates container width)
  const isUltraCompact = useMediaQuery('(max-width:400px)')
  const isCompact = useMediaQuery('(max-width:600px)')

  // Determine team display based on layout
  const teamDisplay = isUltraCompact
    ? standing.team.short_name || standing.team.name.substring(0, 3).toUpperCase()
    : standing.team.name

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
        aria-label={`${standing.team.name}, rank ${standing.position}, ${standing.points} points. ${isExpanded ? 'Expanded' : 'Collapsed'}. Press Enter or Space to ${isExpanded ? 'collapse' : 'expand'}.`}
        aria-expanded={isExpanded}
        sx={{
          py: isUltraCompact ? 1 : (isCompact ? 1.5 : 2),
          px: isUltraCompact ? 1.5 : (isCompact ? 1.5 : 2.5),
          mb: 1.5,
          borderRadius: 2,
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isUltraCompact ? 0.5 : 1.5 }}>
            {/* Rank Badge with Change Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: isUltraCompact ? '40px' : '60px' }}>
              <Typography
                variant={isUltraCompact ? 'body1' : 'h6'}
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.text.primary,
                  fontSize: isUltraCompact ? '0.875rem' : undefined
                }}
              >
                #{standing.position}
              </Typography>
              {showRankChange && !isUltraCompact && (
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
                fontSize: isUltraCompact ? '0.875rem' : undefined
              }}
              title={standing.team.name}
            >
              {teamDisplay}
            </Typography>

            {/* Points with PJ/DG (when collapsed) */}
            {!isExpanded && (
              <Typography
                variant={isUltraCompact ? 'body2' : 'h6'}
                component="div"
                sx={{
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  fontSize: isUltraCompact ? '0.875rem' : undefined
                }}
              >
                {standing.points} {isUltraCompact ? 'pts' : `pts ${!isUltraCompact ? `(${standing.gamesPlayed} PJ, ${standing.goalDifference >= 0 ? '+' : ''}${standing.goalDifference} DG)` : ''}`}
              </Typography>
            )}

            {/* Points only (when expanded) */}
            {isExpanded && (
              <Typography
                variant={isUltraCompact ? 'body2' : 'h6'}
                component="div"
                sx={{
                  fontWeight: 'bold',
                  fontSize: isUltraCompact ? '0.875rem' : undefined
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
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  )
}
