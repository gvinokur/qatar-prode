'use client'

import {useState, useEffect, useRef, ReactNode, cloneElement, isValidElement} from 'react';
import {useTranslations, useLocale} from 'next-intl';
import {generateShortUrlForGroup, buildShortUrl} from '@/app/actions/short-url-actions';
import {captureElement, downloadBlob, shareImage} from '@/app/utils/share-utils';
import InviteFlierTemplate from '@/app/components/friend-groups/sharing/InviteFlierTemplate';
import EmailInvitationsTab from '@/app/components/friend-groups/EmailInvitationsTab';
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
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

interface InviteFriendsDialogProps {
  readonly trigger: ReactNode;
  readonly groupId: string;
  readonly groupName: string;
  readonly tournamentId?: string;
  readonly groupLogoUrl?: string;
  readonly themeColor?: string;
  readonly hideEmailTab?: boolean;
}

export default function InviteFriendsDialog({ trigger, groupId, groupName, tournamentId, groupLogoUrl, themeColor, hideEmailTab }: InviteFriendsDialogProps) {
  const t = useTranslations('groups.invite');
  const tCommon = useTranslations('common.buttons');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(0);
  const [customMessage, setCustomMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const flierRef = useRef<HTMLDivElement>(null);

  // Rewrite the logo URL to our same-origin proxy so html-to-image can inline it
  // without hitting cross-origin fetch restrictions on the S3 bucket.
  const logoProxyUrl = groupLogoUrl
    ? `/api/proxy-image?url=${encodeURIComponent(groupLogoUrl)}`
    : undefined;

  const handleOpen = async () => {
    setOpen(true);
  }
  const handleClose = () => setOpen(false);

  // Initialise default message once translations are available
  useEffect(() => {
    setCustomMessage(t('flier.defaultMessage'));
  }, [t]);


  // Fetch short URL when dialog opens
  useEffect(() => {
    if (!open) return;

    async function fetchShortUrl() {
      try {
        setLoading(true);
        const result = await generateShortUrlForGroup(groupId, tournamentId);
        const fullUrl = await buildShortUrl(result.code);
        setShortUrl(fullUrl);
      } catch (error) {
        console.error('Failed to generate short URL:', error);
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

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getInvitationLink = () => {
    if (loading) return t('generatingLink', { default: 'Generating link...' });
    return shortUrl;
  };

  const getInvitationMessage = () => {
    return t('message', { groupName, link: getInvitationLink() });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInvitationLink())
      .then(() => showSnackbar(t('feedback.copied')))
      .catch(err => {
        console.error('Error al copiar: ', err);
        showSnackbar(t('feedback.copyError'), 'error');
      });
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(getInvitationMessage());
    window.open(`https://wa.me/?text=${message}`);
  };

  const handleDownload = async () => {
    if (!flierRef.current) return;
    setIsCapturing(true);
    try {
      const blob = await captureElement(flierRef.current);
      downloadBlob(blob, `invite-${groupName}.png`);
    } catch (err) {
      console.error('Capture failed:', err);
      showSnackbar(t('flier.captureError'), 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!flierRef.current) return;
    setIsCapturing(true);
    try {
      const blob = await captureElement(flierRef.current);
      const shareText = t('flier.shareText', { groupName });
      await shareImage(blob, shareText, `invite-${groupName}.png`);
    } catch (err) {
      console.error('Share failed:', err);
      showSnackbar(t('flier.captureError'), 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const triggerWithClick = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<{onClick: () => void}>, { onClick: handleOpen })
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

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} aria-label="invite tabs">
            <Tab label={t('tabs.link')} />
            {!hideEmailTab && <Tab label={t('tabs.email')} />}
            <Tab label={t('tabs.flier')} />
          </Tabs>
        </Box>

        <DialogContent>
          {/* Tab 0 — Enlace */}
          {activeTab === 0 && (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {t('description')}
              </Typography>

              <Box sx={{ display: 'flex', mb: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={getInvitationLink()}
                  slotProps={{ input: { readOnly: true } }}
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
            </>
          )}

          {/* Tab 1 — Email */}
          {!hideEmailTab && activeTab === 1 && (
            <EmailInvitationsTab
              groupId={groupId}
              groupLogoUrl={groupLogoUrl}
              themeColor={themeColor}
              onSnackbar={showSnackbar}
            />
          )}

          {/* Tab 2 — Folleto (index 1 when hideEmailTab, otherwise 2) */}
          {activeTab === (hideEmailTab ? 1 : 2) && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 3,
                alignItems: { xs: 'center', sm: 'flex-start' },
              }}
            >
              {/* Controls */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160, flex: '0 0 auto' }}>
                <TextField
                  label={t('flier.customMessageLabel')}
                  multiline
                  minRows={3}
                  fullWidth
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={isCapturing || loading}
                  fullWidth
                >
                  {t('flier.download')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  disabled={isCapturing || loading}
                  fullWidth
                >
                  {t('flier.share')}
                </Button>
              </Box>

              {/* Live preview */}
              <Box
                sx={{
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center',
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    transformOrigin: 'top center',
                    transform: { xs: 'scale(0.65)', sm: 'scale(0.7)' },
                    mb: { xs: '-80px', sm: '-70px' },
                  }}
                >
                  <InviteFlierTemplate
                    ref={flierRef}
                    groupName={groupName}
                    groupLogoUrl={logoProxyUrl}
                    customMessage={customMessage}
                    shortUrl={shortUrl}
                    themeColor={themeColor}
                    loading={loading}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="secondary">
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
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
