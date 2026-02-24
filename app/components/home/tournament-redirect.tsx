'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  getLastSelectedTournamentId,
  setLastSelectedTournamentId,
} from '@/app/utils/dismissal-storage';

interface TournamentRedirectProps {
  tournaments: Array<{ id: string }>;
}

export default function TournamentRedirect({
  tournaments,
}: TournamentRedirectProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');

  useEffect(() => {
    if (tournaments.length === 0) return;

    // Get last selected tournament
    const lastSelectedId = getLastSelectedTournamentId();

    // Check if last selected tournament is still active
    const selectedTournament = lastSelectedId
      ? tournaments.find((t) => t.id === lastSelectedId)
      : null;

    // If found, redirect to it; otherwise, redirect to first tournament
    const targetTournament = selectedTournament || tournaments[0];

    // Save selection
    setLastSelectedTournamentId(targetTournament.id);

    // Redirect (using id, not slug - route is /tournaments/[id])
    router.push(`/${locale}/tournaments/${targetTournament.id}`);
  }, [tournaments, router, locale]);

  // Show centered loading indicator while redirecting
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        {t('home.loadingTournaments')}
      </Typography>
    </Box>
  );
}
