'use client'

import {useState, useEffect, ReactNode, cloneElement, isValidElement} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {generateShortUrlForGroup, buildShortUrl} from '@/app/actions/short-url-actions';
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
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';

interface InviteFriendsDialogProps {
  readonly trigger: ReactNode;
  readonly groupId: string;
  readonly groupName: string;
  readonly tournamentId?: string;
}

export default function InviteFriendsDialog({ trigger, groupId, groupName, tournamentId }: InviteFriendsDialogProps) {
  const t = useTranslations('groups.invite');
  const tCommon = useTranslations('common.buttons');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const handleOpen = async () => {
    setOpen(true);
  }
  const handleClose = () => setOpen(false);

  // Fetch short URL when dialog opens
  useEffect(() => {
    if (!open) return; // Only fetch when dialog is open

    async function fetchShortUrl() {
      try {
        setLoading(true);
        const result = await generateShortUrlForGroup(groupId, tournamentId);
        const fullUrl = await buildShortUrl(result.code);
        setShortUrl(fullUrl);
      } catch (error) {
        console.error('Failed to generate short URL:', error);
        // Fallback to long URL WITH LOCALE PRESERVATION
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const fallbackUrl = tournamentId
          ? `${baseUrl}/${locale}/tournaments/${tournamentId}/friend-groups/join/${groupId}`
          : `${baseUrl}/${locale}/friend-groups/join/${groupId}`;
        setShortUrl(fallbackUrl);
      } finally {
        setLoading(false);
      }
    }

    fetchShortUrl();
  }, [open, groupId, tournamentId, locale]);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Get invitation link (short URL or loading message)
  const getInvitationLink = () => {
    if (loading) {
      return t('generatingLink', { default: 'Generating link...' });
    }
    return shortUrl;
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
