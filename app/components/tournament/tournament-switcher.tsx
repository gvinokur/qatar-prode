'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { setLastSelectedTournamentId } from '@/app/utils/dismissal-storage';

interface TournamentSwitcherProps {
  currentTournamentId: string;
  tournaments: Array<{ id: string; long_name: string; short_name: string }>;
}

export default function TournamentSwitcher({
  currentTournamentId,
  tournaments,
}: TournamentSwitcherProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // Only show if multiple tournaments exist
  if (tournaments.length <= 1) {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectTournament = (tournamentId: string) => {
    // Save selection to localStorage
    setLastSelectedTournamentId(tournamentId);

    // Preserve current page path when switching tournaments
    // Extract everything after /tournaments/[id]
    const pathRegex = new RegExp(`/${locale}/tournaments/${currentTournamentId}(/.*)?`);
    const match = pathname.match(pathRegex);
    const pagePath = match && match[1] ? match[1] : '';

    // Navigate to new tournament with same page path
    router.push(`/${locale}/tournaments/${tournamentId}${pagePath}`);

    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label="Switch tournament"
        sx={{ ml: 0.5 }}
      >
        <KeyboardArrowDownIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {tournaments.map((tournament) => (
          <MenuItem
            key={tournament.id}
            onClick={() => handleSelectTournament(tournament.id)}
            selected={tournament.id === currentTournamentId}
          >
            {tournament.id === currentTournamentId && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            {tournament.long_name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
