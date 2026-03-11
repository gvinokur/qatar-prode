'use client'

import React from 'react'
import { Box, Tooltip } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Badge } from './types'

export interface BadgeRowProps {
  badges: Badge[]
  sizePx: 15 | 16 | 17 | 18 | 20
  justify?: 'flex-start' | 'flex-end' | 'center'
  maxDisplay?: number
}

export function BadgeRow({
  badges,
  sizePx,
  justify = 'flex-start',
  maxDisplay,
}: BadgeRowProps) {
  const t = useTranslations('groups.badges')

  if (badges.length === 0) return null

  const displayed = maxDisplay != null ? badges.slice(0, maxDisplay) : badges

  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: justify,
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '3px',
      }}
    >
      {displayed.map((badge) => (
        <Tooltip
          key={badge.id}
          title={`${t(`${badge.id}.name`)}: ${t(`${badge.id}.description`)}`}
          arrow
        >
          <Box
            component="span"
            sx={{
              fontSize: `${sizePx}px`,
              lineHeight: 1,
              cursor: 'default',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${sizePx + 10}px`,
              height: `${sizePx + 10}px`,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {badge.emoji}
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}
