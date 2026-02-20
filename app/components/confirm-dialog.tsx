'use client'

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  readonly loading?: boolean;
}

/**
 * ConfirmDialog component
 *
 * Note: This component receives text via props. Consumers should pass
 * translated strings using useTranslations('common'):
 * - confirmText: t('buttons.confirm')
 * - cancelText: t('buttons.cancel')
 */

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  loading = false
}: ConfirmDialogProps) {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (loading) return;

    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      onKeyDown={handleKeyDown}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {confirmColor === 'warning' || confirmColor === 'error' ? (
          <WarningIcon color={confirmColor} />
        ) : null}
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
