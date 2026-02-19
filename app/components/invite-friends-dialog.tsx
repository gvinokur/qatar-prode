'use client'

import {useState, ReactNode, cloneElement, isValidElement} from 'react';
import {useTranslations} from 'next-intl';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';

interface InviteFriendsDialogProps {
  readonly trigger: ReactNode;
  readonly groupId: string;
  readonly groupName: string;
}

export default function InviteFriendsDialog({ trigger, groupId, groupName }: InviteFriendsDialogProps) {
  const t = useTranslations('groups.invite');
  const tCommon = useTranslations('common.buttons');

  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleOpen = async () => {
    setOpen(true);
  }
  const handleClose = () => setOpen(false);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Generate invitation link
  const getInvitationLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/friend-groups/join/${groupId}`;
  };

  // Generate invitation message
  const getInvitationMessage = () => {
    return t('message', { groupName, link: getInvitationLink() });
  };

  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInvitationLink())
      .then(() => {
        showSnackbar(t('feedback.copied'));
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
        showSnackbar(t('feedback.copyError'));
      });
  };

  // Share via email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(t('emailSubject', { groupName }));
    const body = encodeURIComponent(getInvitationMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(getInvitationMessage());
    window.open(`https://wa.me/?text=${message}`);
  };

  // Clone the trigger element and add onClick handler
  const triggerWithClick = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<any>, {
        onClick: handleOpen
      })
    : trigger;

  return (
    <>
      {triggerWithClick}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('title', { groupName })}</Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {t('description')}
          </Typography>

          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              value={getInvitationLink()}
              slotProps={{
                input: {
                  readOnly: true,
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={copyToClipboard}
              sx={{ ml: 1 }}
              startIcon={<ContentCopyIcon />}
            >
              {tCommon('copy')}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('directShare')}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={shareViaEmail}
            >
              {t('buttons.email')}
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={shareViaWhatsApp}
            >
              {t('buttons.whatsapp')}
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {tCommon('close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
