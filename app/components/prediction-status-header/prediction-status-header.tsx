'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Button,
  Chip,
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
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import StarIcon from '@mui/icons-material/Star';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { bulkAutoFillFromPredictions } from '../../actions/qualification-actions';
import { toLocale } from '../../utils/locale-utils';
import type { QualifiedTeamPrediction } from '../../db/tables-definition';
import type { StatusHeaderVariant, StatusHeaderTone } from './types';

interface PredictionStatusHeaderProps {
  variant: StatusHeaderVariant;
  /** QT auto-fill: called on successful auto-fill with the new predictions */
  onAutoFillSuccess?: (predictions: QualifiedTeamPrediction[]) => void;
  isLocked?: boolean;
  tournamentId?: string;
}

function toneToBackground(tone: StatusHeaderTone): string {
  switch (tone) {
    case 'brand': return 'background.paper';
    case 'calm': return 'background.paper';
    case 'success': return 'success.50';
    case 'deadlineSoon': return 'info.50';
    case 'deadlineUrgent': return 'warning.50';
    case 'deadlineNow': return 'error.50';
    case 'locked': return 'action.hover';
  }
}

function toneToBorderColor(tone: StatusHeaderTone): string {
  switch (tone) {
    case 'brand': return 'primary.main';
    case 'calm': return 'divider';
    case 'success': return 'success.main';
    case 'deadlineSoon': return 'info.main';
    case 'deadlineUrgent': return 'warning.main';
    case 'deadlineNow': return 'error.main';
    case 'locked': return 'text.disabled';
  }
}

function LeadIcon({ icon }: { icon: StatusHeaderVariant['leadIcon'] }) {
  const sx = { fontSize: 20, flexShrink: 0 };
  switch (icon) {
    case 'rocket': return <RocketLaunchIcon sx={sx} />;
    case 'check': return <CheckCircleOutlineIcon sx={sx} />;
    case 'info': return <InfoOutlinedIcon sx={sx} />;
    case 'warning': return <WarningAmberIcon sx={sx} />;
    case 'error': return <ErrorOutlineIcon sx={sx} />;
    case 'lock': return <LockOutlinedIcon sx={sx} />;
  }
}

interface AutoFillDialogProps {
  open: boolean;
  isCalculating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function AutoFillDialog({ open, isCalculating, onClose, onConfirm }: AutoFillDialogProps) {
  const t = useTranslations('qualified-teams.nudge');
  return (
    <Dialog
      open={open}
      onClose={isCalculating ? undefined : onClose}
      disableEscapeKeyDown={isCalculating}
    >
      <DialogTitle>{t('autoFillDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('autoFillDialog.body')}</DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>{t('autoFillDialog.note')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isCalculating}>
          {t('autoFillDialog.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isCalculating}
          autoFocus
          startIcon={isCalculating ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isCalculating ? t('autoFillDialog.calculating') : t('autoFillDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function PredictionStatusHeader({
  variant,
  onAutoFillSuccess,
  isLocked,
  tournamentId,
}: PredictionStatusHeaderProps) {
  const locale = toLocale(useLocale());
  const t = useTranslations('qualified-teams.nudge');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleAutoFillConfirm = () => {
    if (!tournamentId) return;
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

  // Resolve onClick actions: auto-fill actions open the internal dialog
  const resolveAction = (action: StatusHeaderVariant['action']) => {
    if (!action) return null;
    if (action.href) {
      return (
        <Button
          variant="contained"
          color="primary"
          size="small"
          component={Link}
          href={action.href}
          disabled={isLocked}
        >
          {action.label}
        </Button>
      );
    }
    return (
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => setDialogOpen(true)}
        disabled={isLocked}
      >
        {action.label}
      </Button>
    );
  };

  const resolveSecondaryAction = (action: StatusHeaderVariant['secondaryAction']) => {
    if (!action) return null;
    if (action.href) {
      return (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          component={Link}
          href={action.href}
        >
          {action.label}
        </Button>
      );
    }
    return (
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    );
  };

  const hasAutoFillAction = !!variant.action?.onClick;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderLeft: '4px solid',
          borderLeftColor: toneToBorderColor(variant.tone),
          backgroundColor: toneToBackground(variant.tone),
          px: 2,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {variant.stageLabel && (
            <Chip
              label={variant.stageLabel}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
          <LeadIcon icon={variant.leadIcon} />
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0 }}>
            {variant.statusText}
          </Typography>
          {variant.pointsBadge && (
            <Chip label={variant.pointsBadge} size="small" color="success" icon={<StarIcon />} />
          )}
          {variant.chip && (
            <Chip label={variant.chip.label} size="small" color={variant.chip.color} />
          )}
        </Box>

        {/* Boosts row (Games page) */}
        {variant.boosts && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {variant.boosts.silverMax > 0 && (
              <Chip
                icon={<ElectricBoltIcon />}
                label={`${variant.boosts.silverUsed}/${variant.boosts.silverMax}`}
                size="small"
                variant="outlined"
                sx={{ color: 'text.secondary' }}
              />
            )}
            {variant.boosts.goldenMax > 0 && (
              <Chip
                icon={<StarIcon />}
                label={`${variant.boosts.goldenUsed}/${variant.boosts.goldenMax}`}
                size="small"
                variant="outlined"
                sx={{ color: 'text.secondary' }}
              />
            )}
          </Box>
        )}

        {/* Message body */}
        {variant.message && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: 'pre-line' }}
          >
            {variant.message}
          </Typography>
        )}

        {/* Action buttons */}
        {(variant.action || variant.secondaryAction) && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {resolveAction(variant.action)}
            {resolveSecondaryAction(variant.secondaryAction)}
          </Box>
        )}
      </Paper>

      {/* Auto-fill dialog (QT only) */}
      {hasAutoFillAction && (
        <AutoFillDialog
          open={dialogOpen}
          isCalculating={isCalculating}
          onClose={() => setDialogOpen(false)}
          onConfirm={handleAutoFillConfirm}
        />
      )}

      <Snackbar
        open={errorOpen}
        autoHideDuration={4000}
        onClose={() => setErrorOpen(false)}
        message={t('autoFillError')}
      />
    </>
  );
}
