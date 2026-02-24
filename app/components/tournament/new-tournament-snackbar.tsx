'use client';

import { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { getDismissalState, setDismissalState } from '@/app/utils/dismissal-storage';

interface NewTournamentSnackbarProps {
  readonly tournamentId: string;
  readonly tournamentName: string;
  readonly otherTournaments: ReadonlyArray<{ readonly id: string; readonly long_name: string }>;
}

export default function NewTournamentSnackbar({
  tournamentId,
  tournamentName,
  otherTournaments,
}: NewTournamentSnackbarProps) {
  const t = useTranslations('tournament.snackbar');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = getDismissalState(`tournamentSnackbar_${tournamentId}`);

    if (otherTournaments.length > 0 && !dismissed) {
      setOpen(true);
    }
  }, [tournamentId, otherTournaments]);

  const handleDismiss = () => {
    setDismissalState(`tournamentSnackbar_${tournamentId}`, true);
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={handleDismiss}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        variant="outlined"
        onClose={handleDismiss}
        sx={{ backgroundColor: 'background.paper' }}
      >
        <AlertTitle>{t('title')}</AlertTitle>
        <Typography variant="body2">
          {t('currentTournament', { name: tournamentName })}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {t('otherTournaments')}
        </Typography>
        <ul style={{ marginTop: '4px', marginBottom: '8px' }}>
          {otherTournaments.map((tournament) => (
            <li key={tournament.id}>
              <Typography variant="body2">{tournament.long_name}</Typography>
            </li>
          ))}
        </ul>
        <Typography variant="body2">
          {t('instructions')}
        </Typography>
      </Alert>
    </Snackbar>
  );
}
