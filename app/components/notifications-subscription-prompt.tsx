'use client';

import { useEffect, useState } from 'react';
import {
  Snackbar,
  Button,
  Alert,
  AlertTitle,
  Stack
} from '@mui/material';
import { useSession } from 'next-auth/react';
import {
  checkExistingSubscription,
  isNotificationSupported,
  subscribeToNotifications
} from "../utils/notifications-utils";

export default function NotificationsSubscriptionPrompt({ canOpen }: { canOpen: boolean }  ) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkNotificationEligibility = async () => {
      // Don't show if user isn't logged in
      if (status !== 'authenticated' || !session?.user?.id) {
        setLoading(false);
        return;
      }

      // Check if user has opted out
      const neverAskAgain = localStorage.getItem('notification-never-ask-again') === 'true';
      if (neverAskAgain) {
        setLoading(false);
        return;
      }

      const dontAskUntil = localStorage.getItem('notification-dont-ask-until')
      if(dontAskUntil) {
        const expires: number = Number.parseInt(dontAskUntil, 10)
        if(expires > Date.now()) {
          setLoading(false)
          return
        }
      }

      // Check browser support
      if (!isNotificationSupported()) {
        setLoading(false);
        return;
      }

      // Check notification hasn't been denied yet
      if (Notification.permission === 'denied') {
        setLoading(false);
        return;
      }

      // Check if already subscribed
      const isSubscribed = await checkExistingSubscription();
      if (isSubscribed) {
        setLoading(false);
        return;
      }

      // If we get here, we should show the prompt
      setOpen(true);
      setLoading(false);
    };

    checkNotificationEligibility();
  }, [session, status]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleNeverAskAgain = () => {
    localStorage.setItem('notification-never-ask-again', 'true');
    setOpen(false);
  };

  const handleNotNow= () => {
    //don't ask for a day
    localStorage.setItem('notification-dont-ask-until', (Date.now() + 24 * 60 * 60 * 1000).toString());
    setOpen(false);
  }

  const handleSubscribe = async () => {
    try {
      // Request permission
      await subscribeToNotifications()
      setOpen(false);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  };

  if (loading || !open) {
    return null;
  }

  return (
    <Snackbar
      open={canOpen && open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ width: {xs: 'calc(100% - 20px)', sm: '450px' } }}
      autoHideDuration={10000}
      onClose={handleClose}
    >
      <Alert
        severity="info"
        variant="outlined"
        sx={{ width: '100%', backgroundColor: 'background.paper' }}
      >
        <AlertTitle>Notificaciones</AlertTitle>
        <p>¿Te gustaría recibir notificaciones para estar al día con las últimas actualizaciones?</p>
        <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
          <Button
            size="small"
            color="inherit"
            onClick={handleNeverAskAgain}
            sx={{ opacity: 0.7 }}
          >
            No preguntar más
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={handleNotNow}
          >
            Ahora no
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={handleSubscribe}
            sx={{ fontWeight: 'bold' }}
          >
            Activar
          </Button>
        </Stack>
      </Alert>
    </Snackbar>
  );
}
