'use client'

import React from 'react'
import { Box, Stack, Typography, Button, Chip } from '@mui/material'
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

  return (
    <Box>
      {/* Groups chips section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
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

      {/* CTA buttons */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          component={Link}
          href={`/${locale}/tournaments/${tournamentId}/friend-groups`}
        >
          {t('groupsPreview.goToGroups')}
        </Button>
        <Button
          variant="outlined"
          size="small"
          component={Link}
          href={`/${locale}/tournaments/${tournamentId}/friend-groups`}
        >
          {t('groupsPreview.createGroup')}
        </Button>
        <Button
          variant="outlined"
          size="small"
          component={Link}
          href={`/${locale}/tournaments/${tournamentId}/friend-groups`}
        >
          {t('groupsPreview.discoverGroups')}
        </Button>
      </Stack>
    </Box>
  )
}
