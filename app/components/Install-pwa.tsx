'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse, AlertTitle, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import IosShareIcon from '@mui/icons-material/IosShare';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {InstallMobile} from "@mui/icons-material";
import NotificationsSubscriptionPrompt from "./notifications-subscription-prompt";
import { useTranslations } from 'next-intl';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const backoffs = [
  60000, // 1 minute
  600000, // 10 minutes
  60*60*1000, // 1 hour
  60*60*24*1000, // 1 day
  60*60*24*7*1000, // 1 week
  60*60*24*7*2*1000, // 2 weeks
  60*60*24*7*4*1000, // 1 month
]

const DONT_ASK_UNTIL_KEY = 'install-pwa-dont-ask-until';
const DONT_ASK_LAST_BACKOFF_PERIOD = 'install-pwa-dont-ask-backoff-period';

export default function InstallPwa() {
  const t = useTranslations('pwa');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [forceClose, setForceClose] = useState(false);

  useEffect(() => {
    const dontAskUntil = localStorage.getItem(DONT_ASK_UNTIL_KEY)
    if(dontAskUntil) {
      const expires: number = Number.parseInt(dontAskUntil, 10)
      if(expires > Date.now()) {
        setForceClose(true);
      }
    }

    // Check if on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setForceClose(true);
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setForceClose(true);
    }
  };

  const toggleIOSGuide = () => {
    setShowIOSGuide(!showIOSGuide);
  };

  const handleClose = () => {
    const previousBackoffString = localStorage.getItem(DONT_ASK_LAST_BACKOFF_PERIOD);
    let nextBackoff = backoffs[0];
    if (previousBackoffString) {
      const previousBackoff = parseInt(previousBackoffString);
      const nextBackoffIndex = backoffs.findIndex(b => previousBackoff === b) + 1
      nextBackoff = backoffs.length === nextBackoffIndex ? previousBackoff : backoffs[nextBackoffIndex];
    }
    localStorage.setItem(DONT_ASK_LAST_BACKOFF_PERIOD, nextBackoff.toString());
    localStorage.setItem(DONT_ASK_UNTIL_KEY, (Date.now() + nextBackoff).toString());
    setForceClose(true);
  };

  const openInstall = !forceClose && (!!installPrompt || isIOS);

  return (
    <>
      <Snackbar
        open={openInstall}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ width: {xs: 'calc(100% - 20px)', sm: '450px' } }}

      >
        <Alert
          severity="success"
          variant="outlined"
          icon={<InstallMobile />}
          sx={{ width: '100%', backgroundColor: 'background.paper' }}
          onClose={handleClose}
        >
          <AlertTitle>
            {t('install.title')}
          </AlertTitle>
          {installPrompt && (
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                {t('install.heading')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('install.description')}
              </Typography>
              <Button
                variant="contained"
                color="success"
                onClick={handleInstallClick}
                startIcon={<AddIcon />}
              >
                {t('install.button')}
              </Button>
            </Box>
          )}

          {isIOS && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('install.ios.heading')}
              </Typography>
              <Button
                variant="outlined"
                color="success"
                onClick={toggleIOSGuide}
                endIcon={showIOSGuide ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ mb: 1 }}
              >
                {showIOSGuide ? t('install.ios.hideGuide') : t('install.ios.showGuide')}
              </Button>

              <Collapse in={showIOSGuide}>
                <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                  <Typography variant="body1" gutterBottom>
                    {t('install.ios.instructions.title')}
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <IosShareIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('install.ios.instructions.step1')} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AddIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('install.ios.instructions.step2')} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AddIcon />
                      </ListItemIcon>
                      <ListItemText primary={t('install.ios.instructions.step3')} />
                    </ListItem>
                  </List>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Alert>
      </Snackbar>
      <NotificationsSubscriptionPrompt canOpen={!openInstall}/>
    </>
  );
}
