'use client'

import { Box, Card, CardActionArea, Divider, Stack, Typography, useTheme } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import { useRouter } from 'next/navigation'
import { RankChangeIndicator } from '../leaderboard/rank-change-animations'
import LeaderboardCard from '../leaderboard/LeaderboardCard'
import type { GroupPeekData } from '../../actions/hub-actions'
import type { LeaderboardUser } from '../leaderboard/types'

interface LeaderboardPeekCardProps {
  readonly data: GroupPeekData
  readonly groupLeaderboardHref: string
}

function toLeaderboardUser(entry: GroupPeekData['rows'][number]): LeaderboardUser {
  return {
    id: entry.userId,
    name: entry.userName,
    totalPoints: entry.score,
    groupPoints: 0,
    groupStageScore: 0,
    groupStageQualifiersScore: 0,
    groupBoostBonus: 0,
    knockoutPoints: 0,
    playoffScore: 0,
    playoffBoostBonus: 0,
    honorRollScore: 0,
    individualAwardsScore: 0,
  }
}

export function LeaderboardPeekCard({ data, groupLeaderboardHref }: Readonly<LeaderboardPeekCardProps>) {
  const router = useRouter()
  const theme = useTheme()

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
      <CardActionArea onClick={() => router.push(groupLeaderboardHref)}>
        {/* Header: group name + rank + momentum */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 1.5,
            pb: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <GroupsIcon fontSize="small" sx={{ color: theme.palette.text.secondary, flexShrink: 0 }} />
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              noWrap
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {data.groupName}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0, ml: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              #{data.userRank}
            </Typography>
            <RankChangeIndicator rankChange={data.rankChange ?? 0} size="small" />
          </Stack>
        </Box>

        <Divider />

        {/* 3-row mini leaderboard */}
        <Box sx={{ px: 1, py: 0.5 }}>
          {data.rows.map((row) => (
            <LeaderboardCard
              key={row.userId}
              user={toLeaderboardUser(row)}
              rank={row.rank}
              rankChange={0}
              isCurrentUser={row.isCurrentUser}
              isExpanded={false}
              onToggle={() => {}}
              compact
            />
          ))}
        </Box>
      </CardActionArea>
    </Card>
  )
}
