'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslations } from 'next-intl'
import ShareTemplateBase from './ShareTemplateBase'

const ACCENT_DEFAULT = '#1976d2'

function getMedalEmoji(rank: number, isCurrentUser: boolean): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  if (isCurrentUser) return '⭐'
  return ''
}

export interface LeaderboardTemplateUser {
  readonly rank: number
  readonly name: string
  readonly userId: string
  readonly points: number
  readonly isCurrentUser: boolean
}

export interface LeaderboardTemplateProps {
  readonly groupName: string
  readonly tournamentName: string
  readonly users: LeaderboardTemplateUser[]
  readonly currentUserRank: number
  readonly totalUsers: number
  readonly joinUrl?: string
  readonly themeColor?: string
}

const LeaderboardTemplate = React.forwardRef<HTMLDivElement, LeaderboardTemplateProps>(
  function LeaderboardTemplate(
    {
      groupName,
      tournamentName,
      users,
      currentUserRank,
      totalUsers,
      joinUrl,
      themeColor = ACCENT_DEFAULT,
    },
    ref
  ) {
    const t = useTranslations('groups.sharing')
    const currentUser = users.find((u) => u.isCurrentUser)
    const leader = users.find((u) => u.rank === 1)
    const ptsFromLead =
      currentUser && leader && currentUserRank > 1
        ? leader.points - currentUser.points
        : 0

    return (
      <div ref={ref}>
        <ShareTemplateBase
          accentColor={themeColor}
          title={groupName}
          subtitle={tournamentName}
          footerText="qatar-prode.app"
        >
          {/* Standings rows */}
          <Box sx={{ px: 2.5, pt: 1 }}>
            {users.map((user) => {
              const medal = getMedalEmoji(user.rank, user.isCurrentUser)
              const bgColor = user.isCurrentUser
                ? `${themeColor}18`
                : 'transparent'

              return (
                <Box
                  key={user.userId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 0.75,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: bgColor,
                    mb: 0.25,
                  }}
                >
                  <Typography
                    sx={{
                      width: 28,
                      fontSize: 13,
                      color: '#888888',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    #{user.rank}
                  </Typography>
                  <Typography
                    sx={{
                      width: 24,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {medal}
                  </Typography>
                  <Typography
                    sx={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: user.isCurrentUser ? 'bold' : 'normal',
                      color: '#212121',
                      fontFamily: 'inherit',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.isCurrentUser ? t('you') : user.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: user.isCurrentUser ? 'bold' : 'normal',
                      color: user.isCurrentUser ? themeColor : '#424242',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                  >
                    {user.points.toLocaleString()} {t('pts')}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          {/* Points from lead */}
          {ptsFromLead > 0 && (
            <Box sx={{ px: 2.5, pb: 1, pt: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: '#888888', fontStyle: 'italic', fontFamily: 'inherit' }}>
                📈 {t('pointsFromLead', { points: ptsFromLead.toLocaleString() })}
              </Typography>
            </Box>
          )}

          {/* QR code + total participants */}
          {joinUrl && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mx: 2.5,
                mb: 1.5,
                mt: 1,
                p: 1.5,
                border: '1px solid #eeeeee',
                borderRadius: 1,
              }}
            >
              <QRCodeSVG value={joinUrl} size={72} />
              <Box>
                <Typography sx={{ fontSize: 12, color: '#424242', fontWeight: 'bold', fontFamily: 'inherit' }}>
                  {t('joinGroup')}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#888888', fontFamily: 'inherit' }}>
                  {t('members', { count: totalUsers })}
                </Typography>
                <Typography sx={{ fontSize: 11, color: '#888888', fontFamily: 'inherit', wordBreak: 'break-all' }}>
                  {joinUrl}
                </Typography>
              </Box>
            </Box>
          )}
        </ShareTemplateBase>
      </div>
    )
  }
)

export default LeaderboardTemplate
