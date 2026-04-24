'use client'

import React from 'react'
import { Button, Paper, Stack, Typography } from '@mui/material'
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
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        textAlign: 'center',
        borderStyle: 'dashed',
        borderColor: 'secondary.main',
        borderRadius: 2,
      }}
    >
      <Stack direction="column" alignItems="center" spacing={2}>
        <GroupAddIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
        <Typography variant="h6">{t('socialHub.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('socialHub.description')}
        </Typography>
        {loginHref ? (
          <Button
            variant="contained"
            color="secondary"
            component={Link}
            href={loginHref}
          >
            {t('socialHub.login')}
          </Button>
        ) : (
          <>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                href={friendGroupsUrl}
              >
                {t('socialHub.createGroup')}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
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
    </Paper>
  )
}
