'use client'

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Collapse,
  Divider,
  Grid,
  Typography,
  alpha,
  useTheme
} from '@mui/material'
import type { LeaderboardCardProps } from './types'

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

          {/* Points */}
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 'bold' }}
          >
            {user.totalPoints.toLocaleString()} pts
          </Typography>
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
              Point Breakdown
            </Typography>
            <Grid container spacing={1.5}>
              {/* Group Stage Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                  Group Stage
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Group Stage Games
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.groupStageScore}
                </Typography>
              </Grid>

              {user.groupBoostBonus > 0 && (
                <>
                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                      + Group Boost Bonus
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right', color: 'success.main' }}>
                      +{user.groupBoostBonus}
                    </Typography>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Qualified Teams
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.groupStageQualifiersScore}
                </Typography>
              </Grid>

              {user.groupPositionScore !== undefined && user.groupPositionScore > 0 && (
                <>
                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      Group Positions
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {user.groupPositionScore}
                    </Typography>
                  </Grid>
                </>
              )}

              {/* Knockout Section */}
              <Grid size={{ xs: 12 }} sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                  Knockout
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Playoff Games
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.playoffScore}
                </Typography>
              </Grid>

              {user.playoffBoostBonus > 0 && (
                <>
                  <Grid size={{ xs: 8 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                      + Playoff Boost Bonus
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right', color: 'success.main' }}>
                      +{user.playoffBoostBonus}
                    </Typography>
                  </Grid>
                </>
              )}

              {/* Tournament Section */}
              <Grid size={{ xs: 12 }} sx={{ mt: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                  Tournament
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Honor Roll
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.honorRollScore}
                </Typography>
              </Grid>

              <Grid size={{ xs: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  Individual Awards
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {user.individualAwardsScore}
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
