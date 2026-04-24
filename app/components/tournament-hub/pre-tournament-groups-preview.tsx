'use client'

import React from 'react'
import { Box, Stack, Typography, Button, Chip, Paper } from '@mui/material'
import { EmojiEvents as EmojiEventsIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Locale } from '../../../i18n.config'

interface PreTournamentGroupsPreviewProps {
  readonly allGroupNames: Array<{ id: string; name: string }>
  readonly locale: Locale
  readonly tournamentId: string
}

export function PreTournamentGroupsPreview({
  allGroupNames,
  locale,
  tournamentId,
}: PreTournamentGroupsPreviewProps) {
  const t = useTranslations('hub')

  const displayGroups = allGroupNames.slice(0, 3)
  const remainingCount = allGroupNames.length - 3
  const groupsUrl = `/${locale}/tournaments/${tournamentId}/friend-groups`

  return (
    <Stack spacing={1.5} sx={{ height: '100%', justifyContent: 'space-between' }}>
      {/* Card showing group memberships + ranking pending empty state — fills remaining height */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          textAlign: 'center',
          borderRadius: 2,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        {/* Group chips */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <Typography variant="body2" component="span">
            {t('groupsPreview.youreIn')}
          </Typography>
          {displayGroups.map((group) => (
            <Chip
              key={group.id}
              label={group.name}
              size="small"
              component={Link}
              href={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.id}`}
              clickable
            />
          ))}
          {remainingCount > 0 && (
            <Typography variant="body2" component="span">
              {t('groupsPreview.andOthers', { count: remainingCount })}
            </Typography>
          )}
        </Box>

        {/* Ranking pending empty state */}
        <EmojiEventsIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary">
          {t('groupsPreview.rankingPending')}
        </Typography>
      </Paper>

      <Button variant="outlined" size="small" component={Link} href={groupsUrl} fullWidth>
        {t('seeAllGroups')}
      </Button>
    </Stack>
  )
}
