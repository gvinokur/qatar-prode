'use client'

import { Box, Card, CardContent, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import type { ScoreHistoryResult } from '../../actions/score-history-actions';
import ScoreHistoryChart from './ScoreHistoryChart';
import RankHistoryChart from './RankHistoryChart';

interface HistoryTabProps {
  historyData?: ScoreHistoryResult
  themeColor?: string
}

export default function HistoryTab({ historyData, themeColor }: HistoryTabProps) {
  const t = useTranslations('groups.history');
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? '';

  // No data at all
  if (!historyData || historyData.isEmpty) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          gap: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {t('noHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('noHistoryDescription')}
        </Typography>
      </Box>
    );
  }

  // Tournament hasn't started yet (no games scheduled)
  if (historyData.tournamentStartDate === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          gap: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {t('noHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('noHistoryDescription')}
        </Typography>
      </Box>
    );
  }

  const startDate = historyData.tournamentStartDate;
  const endDate = historyData.tournamentEndDate ?? historyData.tournamentStartDate;
  const totalUsers = historyData.userHistories.length;

  // Derive rank-only histories for RankHistoryChart
  const rankHistories = historyData.userHistories.map((u) => ({
    userId: u.userId,
    displayName: u.displayName,
    data: u.data.map((d) => ({ date: d.date, rank: d.rank })),
  }));

  // Derive score-only histories for ScoreHistoryChart
  const scoreHistories = historyData.userHistories.map((u) => ({
    userId: u.userId,
    displayName: u.displayName,
    data: u.data.map((d) => ({ date: d.date, totalPoints: d.totalPoints })),
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      <Card variant="outlined">
        <CardContent>
          <ScoreHistoryChart
            userHistories={scoreHistories}
            currentUserId={currentUserId}
            startDate={startDate}
            endDate={endDate}
            themeColor={themeColor}
          />
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <RankHistoryChart
            userHistories={rankHistories}
            currentUserId={currentUserId}
            startDate={startDate}
            endDate={endDate}
            totalUsers={totalUsers}
            themeColor={themeColor}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
