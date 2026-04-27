'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bulkAutoFillFromPredictions } from '../../actions/qualification-actions';
import { toLocale } from '../../utils/locale-utils';

export type QTBannerState = 'incomplete-games' | 'games-finished' | 'all-valid';

interface QTActionBannerProps {
  bannerState: QTBannerState | undefined | null;
  tournamentId: string;
  isLocked: boolean;
}

export function QTActionBanner({ bannerState, tournamentId, isLocked }: QTActionBannerProps) {
  const t = useTranslations('qualified-teams.nudge');
  const locale = toLocale(useLocale());
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!bannerState) return null;

  const handleAutoFillConfirm = () => {
    setDialogOpen(false);
    startTransition(async () => {
      const result = await bulkAutoFillFromPredictions(tournamentId, locale);
      if (result.success) {
        router.refresh();
      } else {
        setErrorOpen(true);
      }
    });
  };

  const borderColor =
    bannerState === 'incomplete-games'
      ? 'warning.main'
      : bannerState === 'games-finished'
        ? 'info.main'
        : 'success.main';

  const bgColor =
    bannerState === 'incomplete-games'
      ? 'warning.50'
      : bannerState === 'games-finished'
        ? 'info.50'
        : 'success.50';

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderLeft: '4px solid',
          borderLeftColor: borderColor,
          backgroundColor: bgColor,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {bannerState === 'incomplete-games' && t('incompleteGames.message')}
            {bannerState === 'games-finished' && t('gamesFinished.message')}
            {bannerState === 'all-valid' && t('allValid.message')}
          </Typography>
          {(bannerState === 'games-finished' || bannerState === 'all-valid') && (
            <Typography variant="caption" color="text.secondary">
              {bannerState === 'games-finished' ? t('gamesFinished.note') : t('allValid.note')}
            </Typography>
          )}
        </Box>

        <Box sx={{ flexShrink: 0 }}>
          {bannerState === 'incomplete-games' && (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              component={Link}
              href={`/${locale}/tournaments/${tournamentId}/games`}
            >
              {t('incompleteGames.cta')}
            </Button>
          )}

          {bannerState === 'games-finished' && (
            <Button
              variant="contained"
              color="info"
              size="small"
              disabled={isLocked || isPending}
              onClick={() => setDialogOpen(true)}
            >
              {t('gamesFinished.cta')}
            </Button>
          )}

          {bannerState === 'all-valid' && (
            <Button
              variant="outlined"
              color="success"
              size="small"
              component={Link}
              href={`/${locale}/tournaments/${tournamentId}/awards`}
            >
              {t('allValid.cta')}
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{t('autoFillDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('autoFillDialog.body')}</DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>{t('autoFillDialog.note')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('autoFillDialog.cancel')}</Button>
          <Button onClick={handleAutoFillConfirm} variant="contained" color="info" autoFocus>
            {t('autoFillDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={errorOpen}
        autoHideDuration={4000}
        onClose={() => setErrorOpen(false)}
        message={t('autoFillError')}
      />
    </>
  );
}
