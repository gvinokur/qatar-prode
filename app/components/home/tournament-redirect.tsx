'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  getLastSelectedTournamentId,
  setLastSelectedTournamentId,
} from '@/app/utils/dismissal-storage';

interface TournamentRedirectProps {
  readonly tournaments: ReadonlyArray<{ readonly id: string }>;
}

export default function TournamentRedirect({
  tournaments,
}: TournamentRedirectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations('common');

  // Check if this is an auth redirect (openSignin=true)
  const isAuthRedirect = searchParams?.get('openSignin') === 'true';

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

    // Build redirect URL with preserved query parameters
    const targetPath = `/${locale}/tournaments/${targetTournament.id}`;
    const queryString = searchParams?.toString();
    const redirectUrl = queryString ? `${targetPath}?${queryString}` : targetPath;

    // If this is an auth redirect, clear openSignin from current URL immediately
    // This prevents the login dialog from opening on the home page while redirecting
    if (isAuthRedirect && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('openSignin');
      window.history.replaceState({}, '', currentUrl.toString());
    }

    // Redirect (using id, not slug - route is /tournaments/[id])
    router.push(redirectUrl);
  }, [tournaments, router, locale, searchParams, isAuthRedirect]);

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
