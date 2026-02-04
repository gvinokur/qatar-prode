'use client';

import { usePathname } from 'next/navigation';
import { useMediaQuery, useTheme } from '@mui/material';
import TournamentBottomNav from './tournament-bottom-nav';

interface TournamentBottomNavWrapperProps {
  readonly tournamentId: string;
}

export default function TournamentBottomNavWrapper({ tournamentId }: TournamentBottomNavWrapperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <TournamentBottomNav
      tournamentId={tournamentId}
      currentPath={pathname}
    />
  );
}
