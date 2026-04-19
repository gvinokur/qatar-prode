import { Box, Button, Typography } from '@mui/material'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getLeaderboardPeekData } from '../../actions/hub-actions'
import { LeaderboardPeekCard } from './leaderboard-peek-card'
import { SocialHubCard } from './social-hub-card'
import { PreTournamentGroupsPreview } from './pre-tournament-groups-preview'
import type { Locale } from '../../../i18n.config'

interface TournamentHubLeaderboardPeekProps {
  readonly tournamentId: string
  readonly locale: Locale
}

export async function TournamentHubLeaderboardPeek({
  tournamentId,
  locale,
}: TournamentHubLeaderboardPeekProps) {
  const result = await getLeaderboardPeekData(tournamentId, locale)
  const { groups, userHasGroups, allGroupNames } = result
  const t = await getTranslations({ locale, namespace: 'hub' })

  return (
    <Box>
      {/* Header — centered, matching Action Center style */}
      <Box sx={{ mb: 1, textAlign: 'center' }}>
        <Typography variant="h6">{t('yourStandings')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('yourStandingsSubtitle')}
        </Typography>
      </Box>

      {/* Branch 1: No groups at all (or unauthenticated) */}
      {!userHasGroups && (
        <SocialHubCard locale={locale} tournamentId={tournamentId} />
      )}

      {/* Branch 2: Has groups but no ranking data yet */}
      {userHasGroups && groups.length === 0 && (
        <PreTournamentGroupsPreview
          allGroupNames={allGroupNames}
          locale={locale}
          tournamentId={tournamentId}
        />
      )}

      {/* Branch 3: Has ranking data — existing leaderboard cards */}
      {groups.length > 0 && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {groups.map((group) => (
              <LeaderboardPeekCard
                key={group.groupId}
                data={group}
                groupLeaderboardHref={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.groupId}`}
              />
            ))}
          </Box>
          <Box sx={{ mt: 1.5, textAlign: 'center' }}>
            <Button
              component={Link}
              href={`/${locale}/tournaments/${tournamentId}/friend-groups`}
              variant="text"
              size="small"
              color="primary"
            >
              {t('seeAllGroups')}
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}
