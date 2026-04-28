'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Button,
  CircularProgress,
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
import Link from 'next/link';
import { bulkAutoFillFromPredictions } from '../../actions/qualification-actions';
import { toLocale } from '../../utils/locale-utils';
import type { QualifiedTeamPrediction } from '../../db/tables-definition';

export type QTBannerState = 'incomplete-games' | 'games-finished' | 'all-valid';

interface QTActionBannerProps {
  readonly bannerState: QTBannerState | undefined | null;
  readonly tournamentId: string;
  readonly isLocked: boolean;
  readonly onAutoFillSuccess?: (_predictions: QualifiedTeamPrediction[]) => void;
}

export function QTActionBanner({
  bannerState,
  tournamentId,
  isLocked,
  onAutoFillSuccess,
}: QTActionBannerProps) {
  const t = useTranslations('qualified-teams.nudge');
  const locale = toLocale(useLocale());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [, startTransition] = useTransition();

  if (!bannerState) return null;

  const handleAutoFillConfirm = () => {
    setIsCalculating(true);
    startTransition(async () => {
      const result = await bulkAutoFillFromPredictions(tournamentId, locale);
      if (result.success && result.predictions) {
        setIsCalculating(false);
        setDialogOpen(false);
        onAutoFillSuccess?.(result.predictions);
      } else {
        setIsCalculating(false);
        setDialogOpen(false);
        setErrorOpen(true);
      }
    });
  };

  let borderColor: string;
  let bgColor: string;
  if (bannerState === 'incomplete-games') {
    borderColor = 'warning.main';
    bgColor = 'warning.50';
  } else if (bannerState === 'games-finished') {
    borderColor = 'info.main';
    bgColor = 'info.50';
  } else {
    borderColor = 'success.main';
    bgColor = 'success.50';
  }

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

        <Box sx={{ flexShrink: 0, display: 'flex', gap: 1 }}>
          {bannerState === 'incomplete-games' && (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              component={Link}
              href={`/${locale}/tournaments/${tournamentId}/games?edit=next`}
            >
              {t('incompleteGames.cta')}
            </Button>
          )}

          {bannerState === 'games-finished' && (
            <Button
              variant="contained"
              color="info"
              size="small"
              disabled={isLocked}
              onClick={() => setDialogOpen(true)}
            >
              {t('gamesFinished.cta')}
            </Button>
          )}

          {bannerState === 'all-valid' && (
            <>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                disabled={isLocked}
                onClick={() => setDialogOpen(true)}
                sx={{ color: 'text.secondary' }}
              >
                {t('allValid.recalculate')}
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="small"
                component={Link}
                href={`/${locale}/tournaments/${tournamentId}/awards`}
              >
                {t('allValid.cta')}
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={isCalculating ? undefined : () => setDialogOpen(false)}
        disableEscapeKeyDown={isCalculating}
      >
        <DialogTitle>{t('autoFillDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('autoFillDialog.body')}</DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>{t('autoFillDialog.note')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isCalculating}>
            {t('autoFillDialog.cancel')}
          </Button>
          <Button
            onClick={handleAutoFillConfirm}
            variant="contained"
            color="info"
            disabled={isCalculating}
            autoFocus
            startIcon={isCalculating ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isCalculating ? t('autoFillDialog.calculating') : t('autoFillDialog.confirm')}
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
