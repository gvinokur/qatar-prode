'use client'

import { Box, Typography, Card, CardContent, Stack, Alert, Chip } from '@mui/material'
import { useTranslations } from 'next-intl'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Tournament } from '@/app/db/tables-definition'

interface BoostIntroductionStepProps {
  readonly tournament?: Tournament
}

export default function BoostIntroductionStep({ tournament }: BoostIntroductionStepProps) {
  const t = useTranslations('onboarding.steps.boosts')

  // Extract boost counts from tournament
  const silverBoosts = tournament?.max_silver_games ?? 0
  const goldenBoosts = tournament?.max_golden_games ?? 0

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom align="center">
        {t('title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
        {t('instructions')}
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 500, mx: 'auto' }}>
        <Card elevation={3} sx={{ bgcolor: 'action.hover', border: '2px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ fontSize: 32 }}>🥈</Box>
              <Typography variant="h6">{t('silverBoost.label')}</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {t('silverBoost.multiplier')}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t('silverBoost.description')}
            </Typography>

            <Chip
              label={t('silverBoost.available', { count: silverBoosts })}
              size="small"
              sx={{ mt: 1.5 }}
              color="default"
              variant="outlined"
            />
          </CardContent>
        </Card>

        <Card elevation={3} sx={{ bgcolor: 'action.hover', border: '3px solid', borderColor: 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <LocalFireDepartmentIcon sx={{ fontSize: 32, color: 'warning.main' }} />
              <Typography variant="h6">{t('goldenBoost.label')}</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {t('goldenBoost.multiplier')}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {t('goldenBoost.description')}
            </Typography>

            <Chip
              label={t('goldenBoost.available', { count: goldenBoosts })}
              size="small"
              sx={{ mt: 1.5 }}
              color="warning"
              variant="outlined"
            />
          </CardContent>
        </Card>

        <Alert severity="info" icon={<InfoOutlinedIcon />}>
          {tournament && (
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {t('configAlert.header', { tournament: tournament.long_name || tournament.short_name })}
            </Typography>
          )}
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {t('configAlert.subheader')}
          </Typography>
          <Stack spacing={0.5} sx={{ pl: 1 }}>
            <Typography variant="body2">
              • {t('configAlert.bullet1')}
            </Typography>
            <Typography variant="body2">
              • {t('configAlert.bullet2')}
            </Typography>
            <Typography variant="body2">
              • {t('configAlert.bullet3')}
            </Typography>
          </Stack>
        </Alert>

        <Box sx={{ textAlign: 'center', mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight="bold" color="text.primary">
            {t('strategicTip.title')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }} color="text.secondary">
            {t('strategicTip.text')}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}
