'use client'

import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';

function StrongText({ children }: { readonly children: React.ReactNode }) {
  return <strong>{children}</strong>;
}

interface AiGenerateAllDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly pendingCount: number;
  readonly loading: boolean;
  readonly errorMessage?: string | null;
}

export default function AiGenerateAllDialog({
  open,
  onClose,
  onConfirm,
  pendingCount,
  loading,
  errorMessage,
}: AiGenerateAllDialogProps) {
  const t = useTranslations('predictions');

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon color="primary" />
        {t('aiGenerate.dialogTitle')}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          {t.rich('aiGenerate.dialogMessage', {
            count: pendingCount,
            strong: StrongText,
          })}
        </Typography>
        {errorMessage && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {t('aiGenerate.cancelButton')}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="primary"
          autoFocus
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
        >
          {loading ? t('aiGenerate.generating') : t('aiGenerate.confirmButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
