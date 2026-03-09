'use client'

import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import ShareTemplateBase from './ShareTemplateBase'
import { getAvatarColor, getUserInitials } from '../../../utils/avatar-utils'

export interface PersonalHighlightTemplateProps {
  readonly groupName: string
  readonly tournamentName: string
  readonly userName: string
  readonly userId: string
  readonly currentRank: number
  readonly previousRank: number
  readonly currentPoints: number
  readonly themeColor?: string
}

const PersonalHighlightTemplate = React.forwardRef<HTMLDivElement, PersonalHighlightTemplateProps>(
  function PersonalHighlightTemplate(
    {
      groupName,
      tournamentName,
      userName,
      userId,
      currentRank,
      previousRank,
      currentPoints,
      themeColor = '#1976d2',
    },
    ref
  ) {
    const t = useTranslations('groups.sharing')
    const placesUp = previousRank - currentRank
    const avatarColor = getAvatarColor(userId)
    const initials = getUserInitials(userName)
    const truncatedName = userName.length > 20 ? `${userName.substring(0, 20)}…` : userName

    return (
      <div ref={ref}>
        <ShareTemplateBase
          accentColor={themeColor}
          title={t('movingUpTitle')}
          subtitle={`${groupName} – ${tournamentName}`}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 3,
              gap: 1.5,
            }}
          >
            {/* Avatar */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${avatarColor}66`,
              }}
            >
              <Typography
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: 26,
                  fontFamily: 'inherit',
                }}
              >
                {initials}
              </Typography>
            </Box>

            {/* Name */}
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#212121',
                fontFamily: 'inherit',
              }}
            >
              {truncatedName}
            </Typography>

            {/* Rank change */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: themeColor,
                  fontFamily: 'inherit',
                  letterSpacing: 1,
                }}
              >
                ▲ {t('movedUp', { count: placesUp }).toUpperCase()}
              </Typography>
            </Box>

            {/* Rank before → after */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: 20, color: '#aaaaaa', fontFamily: 'inherit' }}>
                #{previousRank}
              </Typography>
              <Typography sx={{ fontSize: 24, color: themeColor, fontFamily: 'inherit' }}>
                →
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 'bold', color: themeColor, fontFamily: 'inherit' }}>
                #{currentRank}
              </Typography>
            </Box>

            {/* Points */}
            <Typography sx={{ fontSize: 14, color: '#757575', fontFamily: 'inherit' }}>
              {currentPoints.toLocaleString()} {t('pts')}
            </Typography>

            {/* Tagline */}
            <Typography
              sx={{
                fontSize: 13,
                color: '#9e9e9e',
                fontStyle: 'italic',
                fontFamily: 'inherit',
              }}
            >
              {t('catchMe')}
            </Typography>
          </Box>
        </ShareTemplateBase>
      </div>
    )
  }
)

export default PersonalHighlightTemplate
