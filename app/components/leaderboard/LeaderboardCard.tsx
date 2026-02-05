'use client'

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  Typography,
  alpha,
  useTheme
} from '@mui/material'
import type { LeaderboardCardProps } from './types'
import RankChangeIndicator from './RankChangeIndicator'

// Helper function to get avatar color from user ID
function getAvatarColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ]
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Helper function to get user initials
function getUserInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export default function LeaderboardCard({
  user,
  rank,
  isCurrentUser,
  isExpanded,
  onToggle
}: LeaderboardCardProps) {
  const theme = useTheme()

  // Truncate long names
  const displayName = user.name.length > 25
    ? `${user.name.substring(0, 25)}...`
    : user.name

  return (
    <Card
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${isCurrentUser ? 'Your' : displayName + "'s"} leaderboard card, rank ${rank}. ${isExpanded ? 'Expanded' : 'Collapsed'}. Press Enter or Space to ${isExpanded ? 'collapse' : 'expand'}.`}
      aria-expanded={isExpanded}
      sx={{
        py: 1.5,
        px: 2,
        mb: 1.5,
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
        backgroundColor: isCurrentUser
          ? alpha(theme.palette.primary.main, 0.05)
          : 'inherit',
        elevation: isCurrentUser ? 3 : 1,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Rank Badge */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              minWidth: '32px',
              fontWeight: 'bold',
              color: theme.palette.text.primary
            }}
          >
            #{rank}
          </Typography>

          {/* Avatar */}
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: getAvatarColor(user.id),
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            {getUserInitials(user.name)}
          </Avatar>

          {/* Name */}
          <Typography
            variant="body1"
            component="div"
            sx={{
              flex: 1,
              fontWeight: isCurrentUser ? 'bold' : 'normal',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={user.name}
          >
            {isCurrentUser ? 'You' : displayName}
          </Typography>

          {/* Points and Rank Change */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', lineHeight: 1 }}
            >
              {user.totalPoints.toLocaleString()} pts
            </Typography>
            <RankChangeIndicator change={user.rankChange} size="small" />
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Accuracy
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {user.accuracy}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={user.accuracy}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: user.accuracy >= 80
                  ? theme.palette.success.main
                  : user.accuracy >= 60
                  ? theme.palette.warning.main
                  : theme.palette.error.main
              }
            }}
            aria-label={`Accuracy: ${user.accuracy} percent`}
          />
        </Box>

        {/* Expand Hint (only on current user's card initially) */}
        {isCurrentUser && !isExpanded && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, textAlign: 'center', fontStyle: 'italic' }}
          >
            Tap to view details
          </Typography>
        )}

        {/* Expandable Detailed Stats Section */}
        <Collapse in={isExpanded} timeout={300} aria-live="polite">
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ mt: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}
            >
              Detailed Stats
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Group Stage Points:
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.groupPoints} pts
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Knockout Points:
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.knockoutPoints} pts
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Boosts Used:
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.boostsUsed}/{user.totalBoosts}
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Correct Predictions:
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.correctPredictions}/{user.playedGames}
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Accuracy:
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.accuracy}% ({user.playedGames} played)
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5, textAlign: 'center', fontStyle: 'italic' }}
          >
            Tap to collapse
          </Typography>
        </Collapse>
      </CardContent>
    </Card>
  )
}
