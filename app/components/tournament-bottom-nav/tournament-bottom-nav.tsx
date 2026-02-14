'use client';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, Groups, Assessment, Gavel, BarChart } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface TournamentBottomNavProps {
  readonly tournamentId: string;
  readonly currentPath: string;
}

export default function TournamentBottomNav({ tournamentId, currentPath }: TournamentBottomNavProps) {
  const router = useRouter();
  const [value, setValue] = useState<string>('tournament-home');

  // Determine active tab based on currentPath
  useEffect(() => {
    if (currentPath === '/') {
      setValue('main-home');
    } else if (currentPath === `/tournaments/${tournamentId}`) {
      setValue(''); // PARTIDOS is in top nav, no bottom nav tab selected
    } else if (currentPath.startsWith(`/tournaments/${tournamentId}/results`)) {
      setValue('results');
    } else if (currentPath.startsWith(`/tournaments/${tournamentId}/rules`)) {
      setValue('rules');
    } else if (currentPath === `/tournaments/${tournamentId}/friend-groups`) {
      // EXACT match for friend groups overview
      setValue('friend-groups');
    } else if (currentPath.startsWith(`/tournaments/${tournamentId}/stats`)) {
      setValue('stats');
    }
    // Note: Individual game groups (/tournaments/[id]/groups/[group_id]) don't activate any bottom nav tab
  }, [currentPath, tournamentId]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);

    // Navigate based on selected tab
    switch (newValue) {
      case 'main-home':
        router.push('/');
        break;
      case 'results':
        router.push(`/tournaments/${tournamentId}/results`);
        break;
      case 'rules':
        router.push(`/tournaments/${tournamentId}/rules`);
        break;
      case 'friend-groups':
        router.push(`/tournaments/${tournamentId}/friend-groups`);
        break;
      case 'stats':
        router.push(`/tournaments/${tournamentId}/stats`);
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
      <BottomNavigationAction label="Home" value="main-home" icon={<Home sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label="Tablas" value="results" icon={<Assessment sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label="Reglas" value="rules" icon={<Gavel sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label="Stats" value="stats" icon={<BarChart sx={{ fontSize: 24 }} />} />
      <BottomNavigationAction label="Grupos" value="friend-groups" icon={<Groups sx={{ fontSize: 24 }} />} />
    </BottomNavigation>
  );
}
