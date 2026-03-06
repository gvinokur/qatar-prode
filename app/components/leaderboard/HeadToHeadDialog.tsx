'use client'

import { useEffect, useTransition, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { useTranslations } from 'next-intl'
import { getUserStatsForComparison, type UserComparisonStats } from '../../actions/stats-actions'

// Helper to get avatar color from user ID (same as LeaderboardCard)
function getAvatarColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ]
  const hash = userId.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0)
  return colors[hash % colors.length]
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

interface MetricRowProps {
  label: string
  myValue: number
  theirValue: number
  unit?: string
  highlightWinner?: boolean
}

function MetricRow({ label, myValue, theirValue, unit = '', highlightWinner = true }: MetricRowProps) {
  const theme = useTheme()
  const myWins = highlightWinner && myValue > theirValue
  const theyWin = highlightWinner && theirValue > myValue

  return (
    <Grid container alignItems="center" sx={{ py: 0.5 }}>
      <Grid size={{ xs: 4 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: myWins ? 'bold' : 'normal',
            color: myWins ? theme.palette.success.main : 'text.primary',
            textAlign: 'right',
            pr: 1,
          }}
        >
          {myValue.toLocaleString()}{unit}
        </Typography>
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          {label}
        </Typography>
      </Grid>
      <Grid size={{ xs: 4 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: theyWin ? 'bold' : 'normal',
            color: theyWin ? theme.palette.success.main : 'text.primary',
            pl: 1,
          }}
        >
          {theirValue.toLocaleString()}{unit}
        </Typography>
      </Grid>
    </Grid>
  )
}

interface SectionHeaderProps {
  label: string
}

function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <Box sx={{ mt: 2, mb: 0.5 }}>
      <Divider>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {label}
        </Typography>
      </Divider>
    </Box>
  )
}

export interface HeadToHeadDialogProps {
  open: boolean
  onClose: () => void
  currentUserId: string
  opponentId: string
  tournamentId: string
  currentUserName: string
  opponentName: string
  currentUserRank?: number
  opponentRank?: number
  groupName?: string
}

export default function HeadToHeadDialog({
  open,
  onClose,
  currentUserId,
  opponentId,
  tournamentId,
  currentUserName,
  opponentName,
  currentUserRank,
  opponentRank,
  groupName,
}: HeadToHeadDialogProps) {
  const theme = useTheme()
  const t = useTranslations('groups.headToHead')
  const tLeaderboard = useTranslations('groups.leaderboard')
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [isPending, startTransition] = useTransition()
  const [stats, setStats] = useState<UserComparisonStats[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStats(null)
      setError(null)
      return
    }

    startTransition(async () => {
      try {
        const result = await getUserStatsForComparison(
          [currentUserId, opponentId],
          tournamentId
        )
        setStats(result)
      } catch {
        setError('Failed to load comparison data')
      }
    })
  }, [open, currentUserId, opponentId, tournamentId])

  const myStats = stats?.find((s) => s.userId === currentUserId)
  const theirStats = stats?.find((s) => s.userId === opponentId)

  const isLoading = isPending || (open && stats === null && !error)

  // Compute advantage metrics
  const advantages = myStats && theirStats
    ? [
        {
          label: t('totalPoints'),
          my: myStats.performance.totalPoints,
          their: theirStats.performance.totalPoints,
          unit: ` ${t('pts')}`,
        },
        {
          label: t('groupStage'),
          my: myStats.performance.groupStagePoints,
          their: theirStats.performance.groupStagePoints,
          unit: ` ${t('pts')}`,
        },
        {
          label: t('playoff'),
          my: myStats.performance.playoffStagePoints,
          their: theirStats.performance.playoffStagePoints,
          unit: ` ${t('pts')}`,
        },
        {
          label: t('overall'),
          my: myStats.accuracy.overallCorrectPercentage,
          their: theirStats.accuracy.overallCorrectPercentage,
          unit: '%',
        },
        {
          label: t('exactScore'),
          my: myStats.accuracy.overallExactPercentage,
          their: theirStats.accuracy.overallExactPercentage,
          unit: '%',
        },
      ]
    : []

  const myLeads = advantages.filter((a) => a.my > a.their)
  const theirLeads = advantages.filter((a) => a.their > a.my)

  function handleShare() {
    if (!myStats || !theirStats) return

    const myPts = myStats.performance.totalPoints
    const theirPts = theirStats.performance.totalPoints
    const myAcc = myStats.accuracy.overallCorrectPercentage
    const theirAcc = theirStats.accuracy.overallCorrectPercentage
    const group = groupName ?? ''

    let message: string
    if (myPts > theirPts) {
      message = t('winningMessage', { groupName: group, myPts, name: opponentName, theirPts, myAcc, theirAcc })
    } else if (theirPts > myPts) {
      message = t('losingMessage', { name: opponentName, theirPts, myPts })
    } else {
      message = t('tiedMessage', { groupName: group, pts: myPts })
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="h2h-dialog-title"
    >
      <DialogTitle id="h2h-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" component="span">
          {t('title')}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label={t('close')}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        {/* User headers */}
        <Grid container alignItems="center" sx={{ mb: 1 }}>
          <Grid size={{ xs: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Avatar sx={{ bgcolor: getAvatarColor(currentUserId), width: 40, height: 40, fontSize: '0.875rem', fontWeight: 'bold' }}>
              {getUserInitials(currentUserName)}
            </Avatar>
            <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 80, textAlign: 'center' }}>
              {currentUserName}
            </Typography>
            {currentUserRank && (
              <Typography variant="caption" color="text.secondary">#{currentUserRank}</Typography>
            )}
          </Grid>
          <Grid size={{ xs: 4 }} sx={{ textAlign: 'center' }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
              vs
            </Typography>
          </Grid>
          <Grid size={{ xs: 4 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Avatar sx={{ bgcolor: getAvatarColor(opponentId), width: 40, height: 40, fontSize: '0.875rem', fontWeight: 'bold' }}>
              {getUserInitials(opponentName)}
            </Avatar>
            <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 80, textAlign: 'center' }}>
              {opponentName}
            </Typography>
            {opponentRank && (
              <Typography variant="caption" color="text.secondary">#{opponentRank}</Typography>
            )}
          </Grid>
        </Grid>

        {isLoading && (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress size={24} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
              {t('loading')}
            </Typography>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="text" height={32} sx={{ mb: 0.5 }} />
            ))}
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
            {error}
          </Typography>
        )}

        {myStats && theirStats && (
          <>
            {/* Total Points */}
            <SectionHeader label={t('totalPoints')} />
            <MetricRow
              label=""
              myValue={myStats.performance.totalPoints}
              theirValue={theirStats.performance.totalPoints}
              unit={` ${t('pts')}`}
            />

            {/* Category Breakdown */}
            <SectionHeader label={t('breakdown')} />
            <MetricRow
              label={tLeaderboard('groupStage')}
              myValue={myStats.performance.groupStagePoints}
              theirValue={theirStats.performance.groupStagePoints}
              unit={` ${t('pts')}`}
            />
            <MetricRow
              label={tLeaderboard('knockout')}
              myValue={myStats.performance.playoffStagePoints}
              theirValue={theirStats.performance.playoffStagePoints}
              unit={` ${t('pts')}`}
            />

            {/* Accuracy */}
            <SectionHeader label={t('accuracy')} />
            <MetricRow
              label={t('overall')}
              myValue={myStats.accuracy.overallCorrectPercentage}
              theirValue={theirStats.accuracy.overallCorrectPercentage}
              unit="%"
            />
            <MetricRow
              label={t('exactScore')}
              myValue={myStats.accuracy.overallExactPercentage}
              theirValue={theirStats.accuracy.overallExactPercentage}
              unit="%"
            />
            <MetricRow
              label={t('groupStage')}
              myValue={myStats.accuracy.groupCorrectPercentage}
              theirValue={theirStats.accuracy.groupCorrectPercentage}
              unit="%"
            />
            <MetricRow
              label={t('playoff')}
              myValue={myStats.accuracy.playoffCorrectPercentage}
              theirValue={theirStats.accuracy.playoffCorrectPercentage}
              unit="%"
            />

            {/* Advantages */}
            {(myLeads.length > 0 || theirLeads.length > 0) ? (
              <>
                {myLeads.length > 0 && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="success.main" gutterBottom>
                      {t('yourLead')}
                    </Typography>
                    {myLeads.map((a) => (
                      <Typography key={a.label} variant="body2" color="text.secondary">
                        {a.label}:{' '}
                        <Typography component="span" variant="body2" fontWeight="bold" color="success.main">
                          +{(a.my - a.their).toLocaleString()}{a.unit}
                        </Typography>
                      </Typography>
                    ))}
                  </Box>
                )}
                {theirLeads.length > 0 && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: alpha(theme.palette.warning.main, 0.08) }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="warning.main" gutterBottom>
                      {t('theirLead', { name: opponentName })}
                    </Typography>
                    {theirLeads.map((a) => (
                      <Typography key={a.label} variant="body2" color="text.secondary">
                        {a.label}:{' '}
                        <Typography component="span" variant="body2" fontWeight="bold" color="warning.main">
                          +{(a.their - a.my).toLocaleString()}{a.unit}
                        </Typography>
                      </Typography>
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.08) }}>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  {t('evenlyMatched')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<WhatsAppIcon />}
          onClick={handleShare}
          disabled={!myStats || !theirStats}
          size="small"
        >
          {t('shareWhatsapp')}
        </Button>
        <Button onClick={onClose} variant="outlined" size="small">
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
