'use client';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Groups, Assessment, Gavel, BarChart } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface TournamentBottomNavProps {
  readonly tournamentId: string;
  readonly currentPath: string;
}

export default function TournamentBottomNav({ tournamentId, currentPath }: TournamentBottomNavProps) {
  const locale = useLocale();
  const t = useTranslations('navigation');
  const router = useRouter();
  const [value, setValue] = useState<string>('tournament-home');

  // Determine active tab based on currentPath (currentPath includes locale prefix)
  useEffect(() => {
    // Extract path without locale (currentPath is like /es/tournaments/... or /en/tournaments/...)
    const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, '');

    if (pathWithoutLocale === '' || pathWithoutLocale === '/') {
      setValue('main-home');
    } else if (pathWithoutLocale === `/tournaments/${tournamentId}`) {
      setValue(''); // PARTIDOS is in top nav, no bottom nav tab selected
    } else if (pathWithoutLocale.startsWith(`/tournaments/${tournamentId}/results`)) {
      setValue('results');
    } else if (pathWithoutLocale.startsWith(`/tournaments/${tournamentId}/rules`)) {
      setValue('rules');
    } else if (pathWithoutLocale === `/tournaments/${tournamentId}/friend-groups`) {
      // EXACT match for friend groups overview
      setValue('friend-groups');
    } else if (pathWithoutLocale.startsWith(`/tournaments/${tournamentId}/stats`)) {
      setValue('stats');
    }
    // Note: Individual game groups (/tournaments/[id]/groups/[group_id]) don't activate any bottom nav tab
  }, [currentPath, tournamentId]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);

    // Navigate based on selected tab
    switch (newValue) {
      case 'main-home':
        router.push(`/${locale}`);
        break;
      case 'results':
        router.push(`/${locale}/tournaments/${tournamentId}/results`);
        break;
      case 'rules':
        router.push(`/${locale}/tournaments/${tournamentId}/rules`);
        break;
      case 'friend-groups':
        router.push(`/${locale}/tournaments/${tournamentId}/friend-groups`);
        break;
      case 'stats':
        router.push(`/${locale}/tournaments/${tournamentId}/stats`);
        break;
    }
  };

  return (
    <BottomNavigation
      value={value}
      onChange={handleChange}
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        bottom: 0,
        width: '100%',
        height: 56,
        zIndex: 1300,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <BottomNavigationAction label={t('bottomNav.home')} value="main-home" icon={<Home sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label={t('bottomNav.results')} value="results" icon={<Assessment sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label={t('bottomNav.rules')} value="rules" icon={<Gavel sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label={t('bottomNav.stats')} value="stats" icon={<BarChart sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label={t('bottomNav.groups')} value="friend-groups" icon={<Groups sx={{ fontSize: 24 }} />} />
    </BottomNavigation>
  );
}
