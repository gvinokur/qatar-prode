'use client';

import { usePathname } from 'next/navigation';
import { useMediaQuery, useTheme } from '@mui/material';
import TournamentBottomNav from './tournament-bottom-nav';
import { User } from 'next-auth';

interface TournamentBottomNavWrapperProps {
  readonly tournamentId: string;
  readonly user?: User;
}

export default function TournamentBottomNavWrapper({ tournamentId, user }: TournamentBottomNavWrapperProps) {
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
      user={user}
    />
  );
}
