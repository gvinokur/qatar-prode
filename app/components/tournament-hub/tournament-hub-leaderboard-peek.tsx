import { Box, Paper, Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'
import { getLeaderboardPeekData } from '../../actions/hub-actions'
import { LeaderboardPeekCard } from './leaderboard-peek-card'
import type { Locale } from '../../../i18n.config'

interface TournamentHubLeaderboardPeekProps {
  readonly tournamentId: string
  readonly locale: Locale
}

export async function TournamentHubLeaderboardPeek({
  tournamentId,
  locale,
}: TournamentHubLeaderboardPeekProps) {
  const groups = await getLeaderboardPeekData(tournamentId, locale)
  const t = await getTranslations({ locale, namespace: 'hub' })

  // Action returns [] for unauthenticated users — render nothing
  // We render nothing when unauthenticated to avoid a confusing section
  // Note: an empty array means either unauthenticated or no ranking data yet —
  // we can't distinguish without changing the action signature, so we show empty state.
  // The empty state is preferable over returning null (user sees the section, not nothing).

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
        {t('yourStandings')}
      </Typography>

      {groups.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('noRankingData')}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {groups.map((group) => (
            <LeaderboardPeekCard
              key={group.groupId}
              data={group}
              groupLeaderboardHref={`/${locale}/tournaments/${tournamentId}/friend-groups/${group.groupId}`}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
