'use client'

import React from 'react'
import { Button, Stack, Typography } from '@mui/material'
import { GroupAdd as GroupAddIcon } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Locale } from '../../../i18n.config'

interface SocialHubCardProps {
  readonly locale: Locale
  readonly tournamentId: string
  readonly loginHref?: string
}

export function SocialHubCard({ locale, tournamentId, loginHref }: SocialHubCardProps) {
  const t = useTranslations('hub')

  const friendGroupsUrl = `/${locale}/tournaments/${tournamentId}/friend-groups`

  return (
    <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
      <Stack direction="column" alignItems="center" spacing={1}>
        <GroupAddIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
        <Typography variant="subtitle2" fontWeight={700} textAlign="center">
          {t('socialHub.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {t('socialHub.description')}
        </Typography>
      </Stack>
      {loginHref ? (
        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          component={Link}
          href={loginHref}
        >
          {t('socialHub.login')}
        </Button>
      ) : (
        <>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ flex: 1 }}
              component={Link}
              href={friendGroupsUrl}
            >
              {t('socialHub.createGroup')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              sx={{ flex: 1 }}
              component={Link}
              href={friendGroupsUrl}
            >
              {t('socialHub.findGroup')}
            </Button>
          </Stack>
          <Button
            variant="text"
            color="secondary"
            size="small"
            component={Link}
            href={friendGroupsUrl}
          >
            {t('newUser.socialHub.learnMore')}
          </Button>
        </>
      )}
    </Stack>
  )
}
