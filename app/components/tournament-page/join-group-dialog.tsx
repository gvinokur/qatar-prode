'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert } from "../mui-wrappers/";
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";

interface JoinGroupDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function JoinGroupDialog({ open, onClose }: JoinGroupDialogProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('groups.join');
  const tCommon = useTranslations('common.buttons');

  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    // Validate code
    if (!groupCode.trim()) {
      setError(t('codeField.required'));
      return;
    }

    // Navigate to join page
    router.push(`/${locale}/friend-groups/join/${groupCode.trim()}`);
    handleClose();
  };

  const handleClose = () => {
    setGroupCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label={t('codeField.label')}
          type="text"
          fullWidth
          variant="outlined"
          value={groupCode}
          onChange={(e) => {
            setGroupCode(e.target.value);
            setError('');
          }}
          placeholder={t('codeField.placeholder')}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {tCommon('cancel')}
        </Button>
        <Button onClick={handleJoin} variant="contained" color="primary">
          {t('buttons.join')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
