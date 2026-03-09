'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface ShareTemplateBaseProps {
  readonly accentColor: string
  readonly title: string
  readonly subtitle: string
  readonly children: React.ReactNode
}

export default function ShareTemplateBase({
  accentColor,
  title,
  subtitle,
  children,
}: ShareTemplateBaseProps) {
  const tCommon = useTranslations('common')
  const appName = tCommon('app.fullName')

  return (
    <Box
      sx={{
        width: 540,
        fontFamily: 'Arial, Helvetica, sans-serif',
        bgcolor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: accentColor, px: 2.5, py: 1.5 }}>
        <Typography
          sx={{
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 17,
            lineHeight: 1.3,
            fontFamily: 'inherit',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {/* Content */}
      {children}

      {/* Footer */}
      <Box
        sx={{
          borderTop: '1px solid #eeeeee',
          px: 2.5,
          py: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon-32x32.png"
          width={14}
          height={14}
          alt=""
          crossOrigin="anonymous"
          style={{ display: 'block', flexShrink: 0 }}
        />
        <Typography sx={{ color: '#999999', fontSize: 11, fontFamily: 'inherit' }}>
          {appName}
        </Typography>
      </Box>
    </Box>
  )
}
