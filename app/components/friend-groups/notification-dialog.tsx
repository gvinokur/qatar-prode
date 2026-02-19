'use client'

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Snackbar, Alert } from '@mui/material';
import { sendGroupNotification } from '../../actions/notifiaction-actions';
import { useTranslations } from 'next-intl';

interface NotificationDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  tournamentId: string;
  senderId: string;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({ open, onClose, groupId, tournamentId, senderId }) => {
  const t = useTranslations('groups.notifications.dialog');
  const tFeedback = useTranslations('groups.notifications.feedback');
  const tCommon = useTranslations('common.buttons');

  const targetOptions = [
    { value: 'tournament', label: t('targetOptions.tournament') },
    { value: 'friends-group', label: t('targetOptions.friendsGroup') },
  ];

  const [targetPage, setTargetPage] = useState<'tournament' | 'friends-group'>('tournament');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleSend = async () => {
    setLoading(true);
    try {
      await sendGroupNotification({ groupId, tournamentId, targetPage, title, message, senderId });
      setSnackbar({ open: true, message: tFeedback('success'), severity: 'success' });
      setTitle('');
      setMessage('');
      onClose();
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || tFeedback('error'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label={t('targetLabel')}
            value={targetPage}
            onChange={e => setTargetPage(e.target.value as 'tournament' | 'friends-group')}
            fullWidth
            margin="normal"
          >
            {targetOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('titleLabel')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label={t('messageLabel')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>{tCommon('cancel')}</Button>
          <Button onClick={handleSend} variant="contained" color="primary" disabled={loading || !title || !message}>{tCommon('send')}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationDialog; 