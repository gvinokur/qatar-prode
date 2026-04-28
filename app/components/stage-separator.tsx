'use client'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

interface StageSeparatorProps {
  readonly label: string
  readonly isNowAvailable?: boolean
}

export function StageSeparator({ label, isNowAvailable }: StageSeparatorProps) {
  const t = useTranslations('predictions')
  return (
    <Box
      sx={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mt: 4,
        mb: 2,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: 'primary.main',
          letterSpacing: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      {isNowAvailable && (
        <Chip
          label={t('stageSeparator.nowAvailable')}
          size="small"
          color="success"
        />
      )}
      <Divider sx={{ flexGrow: 1, borderColor: (theme) => alpha(theme.palette.primary.main, 0.2) }} />
    </Box>
  )
}
